import { Suspense } from 'react';

/**
 * Checkout Cancel Page
 * 
 * Customer lands here if they cancel a Stripe Checkout payment.
 * They can try again or choose a different payment method.
 */
export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutCancelContent />
    </Suspense>
  );
}

function CheckoutCancelContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Cancel Icon */}
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was not processed. No charges have been made.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-500 mb-1">You can still pay by:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Credit/Debit Card</strong> — try again online</li>
            <li>• <strong>Cash</strong> — pay at the front desk</li>
            <li>• <strong>Venmo</strong> — send payment to Gina</li>
            <li>• <strong>Check</strong> — mail or drop off at the front desk</li>
            <li>• <strong>Zelle</strong> — send payment to Gina&apos;s account</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="/classes"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Browse Classes
          </a>
          <a
            href="/customer"
            className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Go to My Account
          </a>
        </div>
      </div>
    </div>
  );
}