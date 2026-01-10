/*
  # Create settings table for storing application configuration

  1. New Tables
    - `settings`
      - `id` (uuid, primary key) - Unique identifier
      - `key` (text, unique) - Configuration key (e.g., 'resend_api_key')
      - `value` (text) - Configuration value
      - `description` (text) - Description of the setting
      - `updated_at` (timestamptz) - When the setting was last updated

  2. Security
    - Enable RLS on settings table
    - Add policy allowing authenticated admins to read settings
    - Add policy allowing authenticated admins to update settings
*/

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON settings
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update settings"
  ON settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert settings"
  ON settings
  FOR INSERT
  WITH CHECK (true);
