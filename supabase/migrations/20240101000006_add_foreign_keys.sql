-- First, ensure meal_id is of type UUID
ALTER TABLE order_items
ALTER COLUMN meal_id TYPE uuid USING meal_id::uuid;

-- Add foreign key constraint between order_items and meals
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_meal
FOREIGN KEY (meal_id) REFERENCES meals(id);

-- Ensure we have the correct columns in order_items
ALTER TABLE order_items
ALTER COLUMN pickup_date SET NOT NULL,
ALTER COLUMN pickup_time SET NOT NULL,
ALTER COLUMN meal_id SET NOT NULL;
