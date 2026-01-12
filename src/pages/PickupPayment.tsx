import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
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
}

export default function PickupPayment() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'online' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderToken, setOrderToken] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    const storedData = localStorage.getItem('pickup_order_data');
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

  const calculateTotal = () => {
    if (!orderData) return 0;
    return orderData.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !orderData) return;

    setError(null);
    setLoading(true);

    try {
      const paymentExpiresAt = new Date();
      paymentExpiresAt.setMinutes(paymentExpiresAt.getMinutes() + 10);

      const { data, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            name: orderData.formData.name,
            email: orderData.formData.email,
            phone: orderData.formData.phone,
            address: orderData.formData.address,
            payment_method: selectedPayment,
            payment_status: 'pending',
            payment_expires_at: paymentExpiresAt.toISOString(),
          },
        ])
        .select('id, order_token')
        .maybeSingle();

      if (orderError || !data) {
        setError('Failed to place order.');
        return;
      }

      setOrderToken(data.order_token);

      const itemsPayload = orderData.cartItems.map((item) => ({
        order_id: data.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsPayload);

      if (itemsError) {
        setError('Failed to save order items.');
        return;
      }

      if (selectedPayment === 'cash') {
        sendOrderEmails({
          id: data.id,
          name: orderData.formData.name,
          email: orderData.formData.email,
          phone: orderData.formData.phone,
          address: orderData.formData.address,
          payment_method: 'cash',
        }).catch(console.error);

        localStorage.removeItem('pickup_order_data');
        setSuccess(true);
      } else if (selectedPayment === 'online') {
        localStorage.removeItem('pickup_order_data');
        localStorage.setItem('pickup_online_order_data', JSON.stringify({
          formData: orderData.formData,
          cartItems: orderData.cartItems,
          orderId: data.id,
        }));
        navigate('/pickup-online-payment');
        return;
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-semibold mb-2">Order Placed Successfully</h2>
          <p className="text-gray-600 mb-2">Your order has been confirmed!</p>
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Select Payment Method</h1>
            <p className="text-amber-100">Choose how you'd like to pay for your pickup order</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
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
                <span className="font-bold text-amber-700 text-lg">
                  {calculateTotal()} PKR
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPayment === 'cash'
                        ? 'border-amber-600 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300 bg-white'
                    }`}
                    onClick={() => setSelectedPayment('cash')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === 'cash'}
                        onChange={() => setSelectedPayment('cash')}
                        className="w-5 h-5 text-amber-600"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Cash Payment</p>
                        <p className="text-sm text-gray-600">Pay with cash when you pick up</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="block">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPayment === 'online'
                        ? 'border-amber-600 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300 bg-white'
                    }`}
                    onClick={() => setSelectedPayment('online')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === 'online'}
                        onChange={() => setSelectedPayment('online')}
                        className="w-5 h-5 text-amber-600"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Online Payment</p>
                        <p className="text-sm text-gray-600">Pay online via Easypaisa</p>
                      </div>
                    </div>
                  </div>
                </label>
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
                  disabled={!selectedPayment || loading}
                  className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
