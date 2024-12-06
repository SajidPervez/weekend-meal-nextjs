-- First drop the existing check constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- Add the check constraint back with 'refunded' as a valid status
ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]));
