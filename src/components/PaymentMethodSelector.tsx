'use client';

import { useState, useEffect } from 'react';
import { api, PaymentMethodsResponse, PaymentMethodOption } from '@/lib/api';
import { CreditCard, Banknote, FileText, Smartphone, ArrowRightLeft, MapPin, Loader2 } from 'lucide-react';

interface PaymentMethodSelectorProps {
  /** Called when user selects a payment method and confirms */
  onSelect: (method: string, checkoutUrl?: string) => void;
  /** Total amount in dollars (e.g. 35.00) */
  amount: number;
  /** What they're paying for: "class", "booking", "assessment" */
  paymentType: string;
  /** ID of the related entity (class ID, booking ID, etc.) */
  relatedId?: string;
  /** Description shown on the payment */
  description?: string;
  /** Whether the payment is being processed */
  loading?: boolean;
  /** Error message from parent (e.g. API error) to display inside the modal */
  error?: string | null;
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  stripe: <CreditCard className="w-5 h-5" />,
  cash: <Banknote className="w-5 h-5" />,
  check: <FileText className="w-5 h-5" />,
  venmo: <Smartphone className="w-5 h-5" />,
  zelle: <ArrowRightLeft className="w-5 h-5" />,
  pay_at_location: <MapPin className="w-5 h-5" />,
};

const METHOD_DESCRIPTIONS: Record<string, string> = {
  stripe: 'Pay securely with your credit or debit card',
  cash: 'Reservation only — pay on first day of class',
  check: 'Reservation only — pay on first day of class',
  venmo: 'Send payment via Venmo — preferred method',
  zelle: 'Send payment via Zelle — preferred method',
  pay_at_location: 'Pay when you arrive at the club',
};

export default function PaymentMethodSelector({
  onSelect,
  amount,
  paymentType,
  relatedId,
  description,
  loading = false,
  error: parentError,
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [venmoHandle, setVenmoHandle] = useState('');
  const [zelleInfo, setZelleInfo] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [fetchingMethods, setFetchingMethods] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api.getPaymentMethods()
      .then((res) => {
        setMethods(res.data.methods.filter((m: PaymentMethodOption) => m.enabled));
        setVenmoHandle(res.data.venmo_handle);
        setZelleInfo(res.data.zelle_info);
      })
      .catch((err) => {
        console.error('Failed to load payment methods:', err?.response?.data || err);
        // Fallback: show all methods if API is unavailable
        setMethods([
          { id: 'cash', label: 'Cash', enabled: true },
          { id: 'check', label: 'Check', enabled: true },
          { id: 'venmo', label: 'Venmo', enabled: true },
          { id: 'zelle', label: 'Zelle', enabled: true },
          { id: 'pay_at_location', label: 'Pay at Location', enabled: true },
        ]);
      })
      .finally(() => setFetchingMethods(false));
  }, []);

  const handleConfirm = async () => {
    if (!selectedMethod) return;
    setError(null);
    console.log('PaymentMethodSelector: handleConfirm called with method:', selectedMethod);

    // For Stripe, create a checkout session (component manages its own async state)
    if (selectedMethod === 'stripe') {
      setConfirming(true);
      try {
        const res = await api.createStripeCheckoutSession({
          amount: Math.round(amount * 100), // Convert to cents
          payment_type: paymentType,
          related_id: relatedId || '',
          description: description || `${paymentType} payment`,
          user_id: '', // Will be set by the parent component
        });
        onSelect('stripe', res.data.checkout_url);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to create checkout session. Please try another method.');
      } finally {
        setConfirming(false);
      }
      return;
    }

    // For offline methods, delegate to parent handler
    // Parent manages loading state via the `loading` prop and will close modal on success
    onSelect(selectedMethod);
  };

  if (fetchingMethods) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin mr-2" />
        <span className="text-gray-500">Loading payment options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Amount Header */}
      <div className="bg-green-50 rounded-xl p-4 text-center">
        <p className="text-sm text-green-600 font-medium">Amount Due</p>
        <p className="text-3xl font-extrabold text-green-900">${amount.toFixed(2)}</p>
      </div>

      {/* Method Selection */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Choose a payment method:</p>
        <p className="text-xs text-green-700 mb-1 font-medium">✅ Venmo and Zelle are the preferred and fastest ways to pay.</p>
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => { setSelectedMethod(method.id); setError(null); }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === method.id
                ? 'border-green-500 bg-green-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              selectedMethod === method.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {METHOD_ICONS[method.id] || <CreditCard className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold ${selectedMethod === method.id ? 'text-green-900' : 'text-gray-800'}`}>
                  {method.label}
                </p>
                {method.id === 'venmo' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Preferred</span>
                )}
                {method.id === 'zelle' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Preferred</span>
                )}
                {method.reservation_only && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Reservation Only</span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{METHOD_DESCRIPTIONS[method.id]}</p>
              {/* Show Venmo handle */}
              {method.id === 'venmo' && venmoHandle && (
                <p className="text-xs text-green-600 font-medium mt-0.5">Send to: {venmoHandle}</p>
              )}
              {/* Show Zelle info */}
              {method.id === 'zelle' && zelleInfo && (
                <p className="text-xs text-green-600 font-medium mt-0.5">Send to: {zelleInfo}</p>
              )}
            </div>
            {selectedMethod === method.id && (
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Offline Payment Instructions */}
      {selectedMethod && selectedMethod !== 'stripe' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-1">
            📋 How to complete your payment:
          </p>
          {/* Reservation-only warning for cash/check */}
          {methods.find(m => m.id === selectedMethod && m.reservation_only) && (
            <div className="mb-3 bg-red-50 border border-red-100 p-3 rounded-lg">
              <p className="text-sm text-red-700 font-semibold">Reservation Only</p>
              <p className="text-xs text-red-700">Selecting this method reserves your spot only. You must pay in full on the first day of class or your account may be suspended/banned.</p>
            </div>
          )}
          {selectedMethod === 'cash' && (
            <p className="text-sm text-yellow-700">
              Bring cash to the front desk at your next visit. This reserves your spot only — payment must be made on the first day of class or you risk suspension.
            </p>
          )}
          {selectedMethod === 'check' && (
            <p className="text-sm text-yellow-700">
              Mail or drop off a check at: <strong>649 Springfield Ave, Berkeley Heights, NJ 07922</strong>.
              Make payable to &quot;Gina&apos;s Tennis World&quot;. This reserves your spot only — payment must be made on the first day of class or you risk suspension.
            </p>
          )}
          {selectedMethod === 'venmo' && (
            <p className="text-sm text-yellow-700">
              Send ${amount.toFixed(2)} via Venmo to <strong>{venmoHandle || '@Gina-Tennis'}</strong>. 
              Include your name and &quot;{description || paymentType}&quot; in the note.
            </p>
          )}
          {selectedMethod === 'zelle' && (
            <p className="text-sm text-yellow-700">
              Send ${amount.toFixed(2)} via Zelle to <strong>{zelleInfo || 'ginas@tennis.com'}</strong>. 
              Include your name and &quot;{description || paymentType}&quot; in the memo.
            </p>
          )}
          {selectedMethod === 'pay_at_location' && (
            <p className="text-sm text-yellow-700">
              Pay when you arrive at the club. Your spot is reserved, but payment must be made at the front desk before your session.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {(error || parentError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error || parentError}</p>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedMethod || loading || confirming}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-base transition-all ${
          !selectedMethod
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : loading || confirming
            ? 'bg-green-400 text-white cursor-wait'
            : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
        }`}
      >
        {loading || confirming ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Processing...
          </span>
        ) : selectedMethod === 'stripe' ? (
          `Pay $${amount.toFixed(2)} with Card`
        ) : selectedMethod ? (
          `Confirm — Pay $${amount.toFixed(2)} via ${methods.find(m => m.id === selectedMethod)?.label || selectedMethod}`
        ) : (
          'Select a payment method'
        )}
      </button>
    </div>
  );
}