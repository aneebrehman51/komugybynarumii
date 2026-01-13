
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: 'cash' | 'delivery';
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

  const DELIVERY_CHARGE = 300;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const calculateDeliveryTotal = () =>
    calculateTotal() + DELIVERY_CHARGE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.paymentMethod === 'cash') {
        localStorage.setItem('pickup_order_data', JSON.stringify({
          formData,
          cartItems,
        }));
        navigate('/pickup-payment');
        return;
      }

      if (formData.paymentMethod === 'delivery') {
        const paymentExpiresAt = new Date();
        paymentExpiresAt.setMinutes(paymentExpiresAt.getMinutes() + 10);

        const { data, error: orderError } = await supabase
          .from('orders')
          .insert([
            {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              payment_method: 'online',
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

        localStorage.setItem('delivery_order_data', JSON.stringify({
          formData,
          cartItems,
          orderId: data.id,
        }));
        navigate('/delivery-payment');
        return;
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

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

          <div className="border rounded-md px-3 py-2 bg-gray-50 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{calculateTotal()} PKR</span>
            </div>
            {formData.paymentMethod === 'delivery' && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge:</span>
                  <span className="font-medium">{DELIVERY_CHARGE} PKR</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-bold text-amber-700">
                  <span>Total:</span>
                  <span>{calculateDeliveryTotal()} PKR</span>
                </div>
              </>
            )}
            {formData.paymentMethod === 'cash' && (
              <div className="font-bold text-amber-700">Total: {calculateTotal()} PKR</div>
            )}
          </div>

          <div className="space-y-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={formData.paymentMethod === 'cash'} onChange={() => setFormData({ ...formData, paymentMethod: 'cash' })} />
              Pick Up Yourself
            </label>

            <label className="flex items-center gap-2">
              <input type="radio" checked={formData.paymentMethod === 'delivery'} onChange={() => setFormData({ ...formData, paymentMethod: 'delivery' })} />
              Delivery
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


