
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendOrderEmails } from '../services/emailService';

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: 'cash' | 'online';
}

interface CheckoutProps {
  cartItems: any[];
  onClose: () => void;
}

export default function Checkout({ cartItems, onClose }: CheckoutProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'cash',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderToken, setOrderToken] = useState<string | null>(null);

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const paymentExpiresAt = new Date();
      paymentExpiresAt.setMinutes(paymentExpiresAt.getMinutes() + 5);

      // Create order
      const { data, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            payment_method: formData.paymentMethod,
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

      // Save order items
      const itemsPayload = cartItems.map((item) => ({
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

      // ✅ SEND EMAIL ONLY FOR CASH
      if (formData.paymentMethod === 'cash') {
        sendOrderEmails({
          id: data.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          payment_method: 'cash',
        }).catch(console.error);

        setSuccess(true);
      } else {
        // Online payment → go to payment page, no email yet
        localStorage.setItem('order_token', data.order_token);
        navigate(`/payment?ref=${data.order_token}`);
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-1">Order Placed</h2>
          <p className="text-sm text-gray-600 mb-4">
            Order Token: {orderToken}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-amber-600 text-white py-2 rounded-md text-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Checkout</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-3 rounded-md text-sm">
              <AlertCircle className="text-red-500 w-4 h-4" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
          <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required className={inputClass} />
          <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} required className={inputClass} />

          <textarea
            name="address"
            placeholder="Delivery Address"
            value={formData.address}
            onChange={handleInputChange}
            rows={3}
            required
            className={`${inputClass} resize-none`}
          />

          <div className="border rounded-md px-3 py-2 bg-gray-50 text-sm font-medium">
            Total: {calculateTotal()} PKR
          </div>

          <div className="space-y-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={formData.paymentMethod === 'cash'} onChange={() => setFormData({ ...formData, paymentMethod: 'cash' })} />
              Cash on Delivery
            </label>

            <label className="flex items-center gap-2">
              <input type="radio" checked={formData.paymentMethod === 'online'} onChange={() => setFormData({ ...formData, paymentMethod: 'online' })} />
              Online Payment
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border py-2 rounded-md text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-amber-600 text-white py-2 rounded-md text-sm hover:bg-amber-700 disabled:opacity-50">
              {loading ? 'Processing…' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


