import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Copy, Upload, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendOrderEmails } from '../services/emailService';

interface OrderData {
  formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  orderId: string;
}

export default function PickupOnlinePayment() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [copied, setCopied] = useState<'easypaisa' | 'bank' | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderToken, setOrderToken] = useState<string | null>(null);

  const EASYPAISA_NUMBER = '03001234567';
  const BANK_ACCOUNT = 'IBAN: PK36 ABCD 0123 4567 8901 2345';

  useEffect(() => {
    const storedData = localStorage.getItem('pickup_online_order_data');
    if (!storedData) {
      navigate('/');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setOrderData(data);
    } catch {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const handleCopy = (text: string, type: 'easypaisa' | 'bank') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setScreenshot(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
  };

  const calculateTotal = () => {
    if (!orderData) return 0;
    return orderData.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot || !orderData) return;

    setError(null);
    setLoading(true);

    try {
      const fileName = `${orderData.orderId}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, screenshot);

      if (uploadError) {
        setError('Failed to upload payment proof. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_proof_url: urlData.publicUrl,
          payment_proof_submitted_at: new Date().toISOString(),
          payment_status: 'pending_verification',
        })
        .eq('id', orderData.orderId);

      if (updateError) {
        setError('Failed to save payment proof. Please try again.');
        return;
      }

      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('order_token')
        .eq('id', orderData.orderId)
        .maybeSingle();

      if (updatedOrder) {
        setOrderToken(updatedOrder.order_token);
      }

      localStorage.removeItem('pickup_online_order_data');
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-amber-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black/50 flex items-center justify-center px-3">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Payment Submitted</h2>
          <p className="text-gray-600 mb-4">Your payment proof has been received. We'll verify it shortly.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order Token:</p>
            <p className="font-mono font-bold text-amber-900 text-lg">{orderToken}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-white">Online Payment</h1>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
                <span className="font-mono text-lg font-bold text-white">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <p className="text-amber-100">Complete your payment and upload proof within 10 minutes</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Easypaisa Payment</h3>
                <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Send payment to:</p>
                  <p className="text-2xl font-mono font-bold text-gray-900 break-all">{EASYPAISA_NUMBER}</p>
                </div>
                <button
                  onClick={() => handleCopy(EASYPAISA_NUMBER, 'easypaisa')}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                    copied === 'easypaisa'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  {copied === 'easypaisa' ? 'Copied!' : 'Copy Number'}
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Bank Transfer</h3>
                <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Send payment to:</p>
                  <p className="text-lg font-mono font-bold text-gray-900 break-all">{BANK_ACCOUNT}</p>
                </div>
                <button
                  onClick={() => handleCopy(BANK_ACCOUNT, 'bank')}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                    copied === 'bank'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  {copied === 'bank' ? 'Copied!' : 'Copy IBAN'}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 mb-3">
                {orderData.cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium text-gray-800">
                      {item.price * item.quantity} PKR
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-amber-700 text-lg">{calculateTotal()} PKR</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Upload Payment Proof
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center cursor-pointer hover:bg-amber-50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-40 mx-auto mb-3 rounded-lg"
                      />
                      <p className="text-sm text-gray-600">
                        {screenshot?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-gray-900 font-semibold">Click to upload</p>
                      <p className="text-sm text-gray-600">
                        Screenshot of Easypaisa or bank transfer confirmation
                      </p>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!screenshot || loading}
                  className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Submit Payment Proof'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
