import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, CheckCircle, AlertCircle, Upload, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  order_token: string;
  payment_expires_at: string;
  payment_status: string;
  name: string;
  email: string;
  payment_proof_url?: string;
  payment_proof_submitted_at?: string;
}

const EASYPAISA_NUMBER = '03368862917';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const token =
        searchParams.get('ref') || localStorage.getItem('order_token');

      if (!token) {
        setExpired(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('orders')
        .select(
          'id, order_token, payment_expires_at, payment_status, name, email, payment_proof_url, payment_proof_submitted_at'
        )
        .eq('order_token', token)
        .maybeSingle();

      if (!data) {
        setExpired(true);
        setLoading(false);
        return;
      }

      if (new Date() > new Date(data.payment_expires_at)) {
        setExpired(true);
        setLoading(false);
        return;
      }

      setOrder(data);
      setLoading(false);
    };

    fetchOrder();
  }, [searchParams]);

 
  useEffect(() => {
    if (!order) return;

    const interval = setInterval(() => {
      const diff =
        new Date(order.payment_expires_at).getTime() - Date.now();

      if (diff <= 0) {
        setExpired(true);
        clearInterval(interval);
        return;
      }

      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

 
  const copyNumber = async () => {
    await navigator.clipboard.writeText(EASYPAISA_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Max file size is 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  const uploadProof = async () => {
    if (!selectedFile || !order) return;

    setUploading(true);
    setUploadError(null);

    try {
      const ext = selectedFile.name.split('.').pop();
      const path = `payment-proofs/${order.order_token}_${Date.now()}.${ext}`;

      // 1️⃣ Upload screenshot
      await supabase.storage.from('payment-proofs').upload(path, selectedFile);

      const { data: url } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(path);

      const now = new Date().toISOString();

      // 2️⃣ Update order
      await supabase
        .from('orders')
        .update({
          payment_proof_url: url.publicUrl,
          payment_proof_submitted_at: now,
          payment_status: 'paid',
        })
        .eq('id', order.id);

      // 3️⃣ Send email (OWNER notification)
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-emails`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: order.id,
            order_token: order.order_token,
            name: order.name,
            email: order.email,
            payment_method: 'online',
          }),
        }
      );

      // 4️⃣ Success modal
      setShowSuccess(true);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-amber-600" />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
        <p>Payment session expired</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Instructions
            </h1>
            <p className="text-sm text-gray-500">
              Order ID will be generated after payment proof
            </p>
          </div>

         
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
            <p className="text-sm font-medium text-amber-900 mb-4">
              Send payment to this Easypaisa number:
            </p>
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 bg-white border border-amber-300 rounded px-4 py-3 text-lg font-mono font-bold text-amber-900 text-center">
                {EASYPAISA_NUMBER}
              </code>
              <button
                onClick={copyNumber}
                className="bg-amber-600 text-white p-3 rounded-lg"
              >
                <Copy size={20} />
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 font-medium">
                Copied to clipboard!
              </p>
            )}
          </div>

       
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 uppercase">Name</p>
            <p className="font-semibold">{order.name}</p>
            <p className="text-xs text-gray-500 uppercase mt-2">Email</p>
            <p className="font-semibold">{order.email}</p>
          </div>

      
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm font-medium text-red-900 mb-1">
              Time Remaining
            </p>
            <p className="text-3xl font-bold text-red-600 font-mono">
              {timeRemaining}
            </p>
          </div>

       
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <p className="font-semibold mb-2">Upload Payment Proof</p>

            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="mb-3"
            />

            {uploadError && (
              <p className="text-sm text-red-600 mb-2">{uploadError}</p>
            )}

            <button
              onClick={uploadProof}
              disabled={uploading || !selectedFile}
              className="w-full bg-amber-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Upload Payment Proof
                </>
              )}
            </button>
          </div>

          <a
            href="/"
            className="block w-full text-center mt-4 text-gray-600"
          >
            Back to Home
          </a>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-1">
              Order Placed Successfully
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Order Token:{' '}
              <span className="font-mono">{order.order_token}</span>
            </p>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-amber-600 text-white py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}



