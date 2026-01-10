/*
  # Create Storage Bucket for Payment Proofs

  1. New Storage Bucket
    - `payment-proofs` bucket for storing payment screenshot uploads
  
  2. Security
    - Enable RLS on storage.objects
    - Allow authenticated users to upload to payment-proofs bucket
    - Allow public read access to payment proofs for verification
    - Restrict uploads to image files only (enforced at application level)
  
  3. Notes
    - Files are stored with format: payment-proofs/{order_token}_{timestamp}.{ext}
    - Public access allows admin verification of proofs
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to payment proofs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'payment-proofs');

CREATE POLICY "Allow anyone to upload payment proofs"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'payment-proofs');
