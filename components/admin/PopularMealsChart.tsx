'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MealData {
  id: number;
  title: string;
  count: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Popular Meals',
      font: {
        size: 16,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
    },
  },
};

export default function PopularMealsChart() {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{
      label: 'Orders',
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1
    }]
  });
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch order items with meal details
        const { data: orderItems, error: orderError } = await supabase
          .from('order_items')
          .select(`
            meal_id,
            meal:meals (
              id,
              title
            )
          `);

        if (orderError) throw orderError;

        // Count orders per meal
        const mealCounts = orderItems.reduce((acc: { [key: number]: MealData }, item) => {
          if (!item.meal) return acc;
          
          if (!acc[item.meal.id]) {
            acc[item.meal.id] = {
              id: item.meal.id,
              title: item.meal.title,
              count: 0
            };
          }
          acc[item.meal.id].count++;
          return acc;
        }, {});

        // Convert to array and sort by count
        const sortedMeals = Object.values(mealCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 meals

        // Generate random colors for each meal
        const colors = sortedMeals.map(() => {
          const r = Math.floor(Math.random() * 255);
          const g = Math.floor(Math.random() * 255);
          const b = Math.floor(Math.random() * 255);
          return `rgba(${r}, ${g}, ${b}, 0.5)`;
        });

        setChartData({
          labels: sortedMeals.map(meal => meal.title),
          datasets: [{
            label: 'Orders',
            data: sortedMeals.map(meal => meal.count),
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.5', '1')),
            borderWidth: 1
          }]
        });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.style.height = chartRef.current.offsetWidth > 600 ? '400px' : '300px';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full" ref={chartRef}>
      <Bar options={options} data={chartData} />
    </div>
  );
}
