import { MealType } from '@/types/meal';

interface MealFiltersProps {
  selectedTypes: MealType[];
  onTypeChange: (types: MealType[]) => void;
}

const mealTypes: { value: MealType; label: string; icon: string }[] = [
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { value: 'chicken', label: 'Chicken', icon: '🍗' },
  { value: 'lamb', label: 'Lamb', icon: '🐑' },
  { value: 'beef', label: 'Beef', icon: '🥩' },
];

export default function MealFilters({ selectedTypes, onTypeChange }: MealFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {mealTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => {
            if (selectedTypes.includes(type.value)) {
              onTypeChange(selectedTypes.filter(t => t !== type.value));
            } else {
              onTypeChange([...selectedTypes, type.value]);
            }
          }}
          className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors
            ${selectedTypes.includes(type.value)
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <span className="mr-1">{type.icon}</span>
          {type.label}
        </button>
      ))}
      {selectedTypes.length > 0 && (
        <button
          onClick={() => onTypeChange([])}
          className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
