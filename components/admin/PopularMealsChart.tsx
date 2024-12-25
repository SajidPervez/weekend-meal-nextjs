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
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPopularMeals();
    
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.style.height = chartRef.current.offsetWidth > 600 ? '400px' : '300px';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPopularMeals = async () => {
    try {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          meal:meal_id (
            id,
            title
          )
        `)
        .not('meal', 'is', null);

      if (error) throw error;

      const mealCounts: { [key: string]: number } = {};
      orderItems.forEach((item: any) => {
        if (item.meal?.title) {
          mealCounts[item.meal.title] = (mealCounts[item.meal.title] || 0) + 1;
        }
      });

      const sortedMeals = Object.entries(mealCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4);

      setChartData({
        labels: sortedMeals.map(([title]) => title),
        datasets: [
          {
            label: 'Number of Orders',
            data: sortedMeals.map(([, count]) => count),
            backgroundColor: 'rgb(52, 211, 153)',
            borderRadius: 6,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching popular meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
