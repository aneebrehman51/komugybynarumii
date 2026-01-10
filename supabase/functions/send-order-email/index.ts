import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface EmailRequest {
  orderToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: string;
  items: OrderItem[];
  totalAmount: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      orderToken,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      paymentMethod,
      items,
      totalAmount,
    }: EmailRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Database configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settingsData, error: settingsError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "resend_api_key")
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching API key:", settingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch API configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let resendApiKey = settingsData?.value || Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.price} PKR</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${item.price * item.quantity} PKR</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - Komugi by Narumi</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
              <div style="background: linear-gradient(135deg, #b45309 0%, #d97706 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Confirmation</h1>
                <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">Thank you for your order!</p>
              </div>
              
              <div style="padding: 30px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Dear ${customerName},</p>
                
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thank you for ordering from <strong>Komugi by Narumi</strong>! We're excited to prepare your delicious baked goods.
                </p>
                
                <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-weight: 600;">Order ID: <span style="font-family: monospace; font-size: 16px;">${orderToken}</span></p>
                </div>
                
                <h2 style="color: #92400e; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #d97706; padding-bottom: 10px;">Order Details</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background-color: #fef3c7;">
                      <th style="padding: 12px; text-align: left; color: #92400e; font-weight: 600;">Item</th>
                      <th style="padding: 12px; text-align: center; color: #92400e; font-weight: 600;">Qty</th>
                      <th style="padding: 12px; text-align: right; color: #92400e; font-weight: 600;">Price</th>
                      <th style="padding: 12px; text-align: right; color: #92400e; font-weight: 600;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr style="background-color: #fffbeb;">
                      <td colspan="3" style="padding: 15px; text-align: right; font-weight: 700; color: #92400e; font-size: 16px;">Total Amount:</td>
                      <td style="padding: 15px; text-align: right; font-weight: 700; color: #b45309; font-size: 18px;">${totalAmount} PKR</td>
                    </tr>
                  </tfoot>
                </table>
                
                <h2 style="color: #92400e; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #d97706; padding-bottom: 10px;">Delivery Information</h2>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 5px 0; color: #374151;"><strong>Name:</strong> ${customerName}</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> ${customerEmail}</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Phone:</strong> ${customerPhone}</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Delivery Address:</strong> ${deliveryAddress}</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Payment Method:</strong> ${paymentMethod === "cash" ? "Cash on Delivery" : "Online Payment"}</p>
                </div>
                
                ${paymentMethod === "online" ? `
                <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #1e40af; font-weight: 600;">⏱️ Payment Pending</p>
                  <p style="margin: 10px 0 0 0; color: #1e3a8a; font-size: 14px;">Please complete your payment within 5 minutes to confirm your order. Check your payment page for instructions.</p>
                </div>
                ` : `
                <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #065f46; font-weight: 600;">✓ Order Confirmed</p>
                  <p style="margin: 10px 0 0 0; color: #064e3b; font-size: 14px;">Your order has been confirmed. We'll contact you soon to arrange delivery.</p>
                </div>
                `}
                
                <div style="margin: 30px 0; padding: 20px; background-color: #fffbeb; border-radius: 6px;">
                  <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                    If you have any questions about your order, feel free to reach out to us on WhatsApp at <strong>03368862917</strong> or reply to this email.
                  </p>
                </div>
                
                <p style="color: #374151; font-size: 14px; margin: 30px 0 0 0;">
                  Best regards,<br>
                  <strong style="color: #92400e;">Komugi by Narumi Team</strong>
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                  This is an automated email. Please do not reply directly to this message.
                </p>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
                  © ${new Date().getFullYear()} Komugi by Narumi. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Komugi by Narumi <orders@komugi.com>",
        to: [customerEmail],
        subject: `Order Confirmation - ${orderToken}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});