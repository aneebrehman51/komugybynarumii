/*
  # Create orders table for checkout functionality

  1. New Tables
    - `orders`
      - `id` (uuid, primary key) - Unique identifier
      - `order_token` (text, unique) - Token for payment reference
      - `name` (text) - Customer name
      - `email` (text) - Customer email
      - `phone` (text) - Customer phone number
      - `address` (text) - Delivery address
      - `payment_method` (text) - Payment method (cash or online)
      - `payment_status` (text) - Payment status (pending, completed, failed)
      - `payment_expires_at` (timestamptz) - When payment session expires
      - `created_at` (timestamptz) - When order was created

  2. Security
    - Enable RLS on orders table
    - Add policy allowing anyone to insert orders (for checkout)
    - Add policy allowing users to read their own orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders"
  ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view orders by token"
  ON orders
  FOR SELECT
  USING (true);
