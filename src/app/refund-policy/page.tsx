import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-green-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-medium mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-extrabold text-green-900 mb-8">Refund Policy</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 prose prose-green max-w-none">
          <p className="text-sm text-gray-500 mb-6">Last updated: June 2026</p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800 font-semibold">⚠️ Important for Cash & Check Payments</p>
            <p className="text-sm text-yellow-700 mt-1">Cash and check payments reserve your spot only. Payment must be made in full on the first day of class or your reservation may be cancelled and your account may be suspended.</p>
          </div>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">Contract Bookings (30-Week / 15-Week)</h2>
          <p>If you need to cancel a contract booking:</p>
          <ul>
            <li><strong>12+ hours before your scheduled start time:</strong> You are eligible for a <strong>50% refund</strong> of completed payments.</li>
            <li><strong>Less than 12 hours before:</strong> No refund is available.</li>
          </ul>
          <p>Refunds for contract bookings are processed automatically when you cancel through the website. The 50% refund will be issued to your original payment method.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">Open-Time (Single) Bookings</h2>
          <p>Single court rental bookings are <strong>non-refundable</strong>. If you cannot make your booking, please contact us as early as possible so we can offer the slot to someone else.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">Clinics & Classes</h2>
          <ul>
            <li>If Gina's Tennis World cancels a class (e.g., due to weather or instructor absence), you will receive a full credit or refund.</li>
            <li>If you need to withdraw from a class, refunds are at the discretion of management. Please contact us as soon as possible.</li>
            <li>No refunds are given for missed classes unless prior arrangements have been made.</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">Payment Methods & Refund Processing</h2>
          <ul>
            <li><strong>Venmo / Zelle:</strong> Refunds are sent back to your account within 3–5 business days.</li>
            <li><strong>Credit/Debit Card (Stripe):</strong> Refunds are processed to your original card within 5–10 business days.</li>
            <li><strong>Cash / Check:</strong> Refunds are issued as account credit or by check, at management's discretion.</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">How to Request a Refund</h2>
          <ol>
            <li>Log in to your account and navigate to your bookings</li>
            <li>Cancel the eligible booking</li>
            <li>For contract bookings cancelled 12+ hours in advance, the 50% refund is processed automatically</li>
            <li>For other refund requests, contact us directly</li>
          </ol>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">Contact</h2>
          <p>For refund questions:</p>
          <ul>
            <li>Email: <a href="mailto:GinasTennisWorld@gmail.com" className="text-green-600 hover:text-green-700">GinasTennisWorld@gmail.com</a></li>
            <li>Phone: 908-464-9591</li>
            <li>In person: 649 Springfield Ave, Berkeley Heights, NJ 07922</li>
          </ul>
        </div>
      </div>
    </div>
  );
}