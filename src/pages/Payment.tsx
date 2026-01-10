/*import { useState, useEffect } from 'react';
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
  order_confirmed?: boolean;
  confirmed_at?: string;
}

const EASYPAISA_NUMBER = '03368862917';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        let token = searchParams.get('ref');

        if (!token) {
          token = localStorage.getItem('order_token');
        }

        if (!token) {
          setExpired(true);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('orders')
          .select('id, order_token, payment_expires_at, payment_status, name, email, payment_proof_url, payment_proof_submitted_at, order_confirmed, confirmed_at')
          .eq('order_token', token)
          .maybeSingle();

        if (error || !data) {
          setExpired(true);
          setLoading(false);
          return;
        }

        const expiresAt = new Date(data.payment_expires_at);
        const now = new Date();

        if (now > expiresAt) {
          setExpired(true);
          setLoading(false);
          return;
        }

        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setExpired(true);
        setLoading(false);
      }
    };

    fetchOrder();
  }, [searchParams]);

  useEffect(() => {
    if (!order) return;

    const timer = setInterval(() => {
      const expiresAt = new Date(order.payment_expires_at);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setExpired(true);
        setTimeRemaining('');
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(EASYPAISA_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        setSelectedFile(null);
        return;
      }
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !order) return;

    setUploading(true);
    setUploadError(null);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${order.order_token}_${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_proof_url: urlData.publicUrl,
          payment_proof_submitted_at: now,
          order_confirmed: true,
          confirmed_at: now,
        })
        .eq('id', order.id);

      if (updateError) {
        throw updateError;
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setOrder({
        ...order,
        payment_proof_url: urlData.publicUrl,
        payment_proof_submitted_at: now,
        order_confirmed: true,
        confirmed_at: now,
      });
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Failed to upload payment proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-opacity-30 border-t-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h1>
          <p className="text-gray-600 mb-6">Your payment session has expired. Please reorder to continue.</p>
          <a
            href="/"
            className="inline-block bg-amber-600 text-white py-2 px-6 rounded-lg hover:bg-amber-700 transition-colors duration-200 font-medium"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find your order. Please try again.</p>
          <a
            href="/"
            className="inline-block bg-amber-600 text-white py-2 px-6 rounded-lg hover:bg-amber-700 transition-colors duration-200 font-medium"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {order.order_confirmed ? (
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed</h1>
              <p className="text-lg font-semibold text-amber-600">Order ID: {order.order_token}</p>
            </div>
          ) : (
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Instructions</h1>
              <p className="text-sm text-gray-500">Order ID will be generated after payment proof</p>
            </div>
          )}

          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
            <p className="text-sm font-medium text-amber-900 mb-4">Send payment to this Easypaisa number:</p>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 bg-white border border-amber-300 rounded px-4 py-3 text-lg font-mono font-bold text-amber-900 text-center">
                {EASYPAISA_NUMBER}
              </code>
              <button
                onClick={handleCopyToClipboard}
                className="bg-amber-600 text-white p-3 rounded-lg hover:bg-amber-700 transition-colors duration-200 flex-shrink-0"
                title="Copy to clipboard"
              >
                {copied ? (
                  <CheckCircle size={20} />
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 font-medium">Copied to clipboard!</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Recipient Details:</label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                <p className="font-semibold text-gray-900">{order.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="font-semibold text-gray-900">{order.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-900 mb-2">Time Remaining:</p>
            <p className="text-3xl font-bold text-red-600 text-center font-mono">
              {timeRemaining || '--:--'}
            </p>
            <p className="text-xs text-red-700 text-center mt-2">Payment expires after this time</p>
          </div>

          {order.payment_proof_url ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 text-center mb-2">
                Payment Proof Submitted
              </h3>
              <p className="text-sm text-green-700 text-center mb-4">
                Your payment proof has been received. We'll verify and contact you soon.
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-600 text-center uppercase tracking-wide mb-1">
                  Confirmed Order ID
                </p>
                <p className="text-2xl font-bold text-green-600 text-center font-mono">
                  {order.order_token}
                </p>
              </div>
              <p className="text-xs text-gray-600 text-center">
                Submitted on {new Date(order.payment_proof_submitted_at!).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Upload Payment Proof
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                After making the payment, upload a screenshot of your transaction as proof.
              </p>

              {uploadSuccess && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-green-800 font-medium">
                    Payment proof uploaded successfully!
                  </p>
                </div>
              )}

              {uploadError && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-red-800">{uploadError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Screenshot
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Accepted formats: JPG, PNG, GIF (Max 5MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="text-gray-600" size={18} />
                      <span className="text-sm text-gray-700 truncate max-w-[200px]">
                        {selectedFile.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}

                <button
                  onClick={handleUploadProof}
                  disabled={!selectedFile || uploading}
                  className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>Upload Payment Proof</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <a
              href="/"
              className="block w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium text-center"
            >
              Back to Home
            </a>
            <p className="text-xs text-gray-500 text-center">
              After uploading payment proof, you'll be contacted for verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
*/
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

  /* ================= FETCH ORDER ================= */
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

  /* ================= TIMER ================= */
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

  /* ================= HANDLERS ================= */
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

  /* ================= UPLOAD + EMAIL ================= */
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

  /* ================= STATES ================= */
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

  /* ================= UI (UNCHANGED DESIGN) ================= */
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

          {/* Easypaisa */}
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

          {/* Recipient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 uppercase">Name</p>
            <p className="font-semibold">{order.name}</p>
            <p className="text-xs text-gray-500 uppercase mt-2">Email</p>
            <p className="font-semibold">{order.email}</p>
          </div>

          {/* Timer */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm font-medium text-red-900 mb-1">
              Time Remaining
            </p>
            <p className="text-3xl font-bold text-red-600 font-mono">
              {timeRemaining}
            </p>
          </div>

          {/* Upload */}
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

      {/* SUCCESS MODAL */}
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




