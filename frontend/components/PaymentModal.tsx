'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credits: number) => void;
  selectedPlan?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  selectedPlan = 'pro',
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Razorpay script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const plans = {
    free: { name: 'Free', credits: 3, amount: 0 },
    standard: { name: 'Standard', credits: 15, amount: 2500 },
    pro: { name: 'Pro', credits: 50, amount: 8000 },
    professional: { name: 'Professional', credits: 100, amount: 15000 },
  };

  const handlePayment = async (plan: string) => {
    setLoading(true);
    setError('');

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Create order from backend
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }

      const orderData = await response.json();

      // Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                plan,
                userId: user.id,
              }),
            });

            if (!verifyResponse.ok) {
              const data = await verifyResponse.json();
              throw new Error(data.error || 'Payment verification failed');
            }

            const verifyData = await verifyResponse.json();

            // Success
            onSuccess(verifyData.credits);
            onClose();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Payment verification failed'
            );
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#06b6d4',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Add Credits</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`p-6 rounded-lg border-2 transition cursor-pointer ${
                selectedPlan === key
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
              }`}
              onClick={() => {
                if (plan.amount > 0) {
                  handlePayment(key);
                }
              }}
            >
              <h4 className="text-lg font-bold mb-2 text-white">{plan.name}</h4>
              <p className="text-3xl font-bold text-cyan-400 mb-2">
                {plan.amount === 0 ? 'Free' : `₹${plan.amount}`}
              </p>
              <p className="text-slate-300 text-sm">
                {plan.credits} credits
              </p>
              {plan.amount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePayment(key);
                  }}
                  disabled={loading}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Buy Now'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}