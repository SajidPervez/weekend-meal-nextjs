-- Create meal_type enum
CREATE TYPE meal_type AS ENUM ('vegan', 'vegetarian', 'chicken', 'lamb', 'beef');

-- Add meal_types column to meals table
ALTER TABLE meals
ADD COLUMN meal_types meal_type[] DEFAULT '{}'::meal_type[];

-- Add comment
COMMENT ON COLUMN meals.meal_types IS 'Array of meal types (vegan, vegetarian, chicken, lamb, beef)';
