import { Suspense } from 'react';

/**
 * Checkout Success Page
 * 
 * Customer lands here after completing a Stripe Checkout payment.
 * The URL contains the session_id and payment_id so we can show
 * a confirmation with the payment details.
 */
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  // In a real app, we'd use useSearchParams() to get session_id and payment_id
  // and fetch the payment details from the API to show a receipt.
  // For now, we show a generic success message.

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed. You&apos;ll receive a confirmation email shortly.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-500 mb-1">What happens next:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Gina will be notified of your payment</li>
            <li>• Your booking/enrollment is confirmed</li>
            <li>• You can view your payment history in your account</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="/customer"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Go to My Account
          </a>
          <a
            href="/classes"
            className="w-full bg-white text-green-600 py-3 px-4 rounded-lg font-semibold border border-green-600 hover:bg-green-50 transition-colors"
          >
            Browse Classes
          </a>
        </div>
      </div>
    </div>
  );
}