-- Add session_id column to orders table
ALTER TABLE orders 
ADD COLUMN session_id text;

-- Add comment to session_id column
COMMENT ON COLUMN orders.session_id IS 'Stripe checkout session ID for refund processing';

-- Update existing orders to have a payment status of paid
UPDATE orders SET payment_status = 'paid' WHERE payment_status IS NULL;
