/*
  # Add Order Confirmation Status

  1. Changes
    - Add `order_confirmed` column to track if order ID should be finalized after payment proof upload
    - Add `confirmed_at` column to track when order was confirmed
  
  2. Notes
    - Order ID shown only after payment proof is uploaded and verified
    - Tracks confirmation timestamp for audit purposes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_confirmed'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_confirmed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN confirmed_at timestamptz;
  END IF;
END $$;
