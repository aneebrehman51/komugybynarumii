export async function sendOrderEmails(payload: {
  id: string;
  name: string;
  email: string;
  phone: string; // ✅ ADD THIS
  address: string;
  payment_method: string;
}) {

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('Supabase env vars missing');
    return;
  }

  const res = await fetch(
    `${supabaseUrl}/functions/v1/send-order-emails`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('Email sending failed:', err);
  }
}
