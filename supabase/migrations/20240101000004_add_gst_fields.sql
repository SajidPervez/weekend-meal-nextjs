-- Add GST related columns to meals table
ALTER TABLE meals
ADD COLUMN includes_gst boolean DEFAULT false,
ADD COLUMN gst_rate decimal DEFAULT 0.10;

-- Add comment
COMMENT ON COLUMN meals.includes_gst IS 'Whether the price includes GST';
COMMENT ON COLUMN meals.gst_rate IS 'GST rate (default 10%)';
