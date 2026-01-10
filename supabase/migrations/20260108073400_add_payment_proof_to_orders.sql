/*
  # Add Payment Proof Support

  1. Changes
    - Add `payment_proof_url` column to `orders` table to store the uploaded screenshot URL
    - Add `payment_proof_submitted_at` column to track when proof was submitted
  
  2. Notes
    - Allows users to upload payment confirmation screenshots
    - Tracks submission timestamp for verification purposes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_proof_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_proof_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_proof_submitted_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_proof_submitted_at timestamptz;
  END IF;
END $$;
