-- Add updated_at column to orders table with default value and trigger
ALTER TABLE orders 
ADD COLUMN updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at on modified rows
CREATE TRIGGER set_updated_at_on_modified_order
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
