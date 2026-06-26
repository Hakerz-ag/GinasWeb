import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-green-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-medium mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-extrabold text-green-900 mb-8">Terms of Service</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 prose prose-green max-w-none">
          <p className="text-sm text-gray-500 mb-6">Last updated: June 2026</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">1. Acceptance of Terms</h2>
          <p>By using Gina's Tennis World website and services, you agree to these Terms of Service. If you do not agree, please do not use our services.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">2. Services</h2>
          <p>Gina's Tennis World provides indoor tennis court rentals, group clinics, private lessons, and related tennis services at 649 Springfield Ave, Berkeley Heights, NJ 07922. Services include:</p>
          <ul>
            <li>Court rentals (single sessions and contract time)</li>
            <li>Junior and adult group clinics</li>
            <li>Private and semi-private lessons</li>
            <li>ACE Attack training system sessions</li>
            <li>Ball machine rentals</li>
            <li>Party and event bookings</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">3. Accounts & Registration</h2>
          <p>You must create an account to book courts, enroll in classes, or make payments. You are responsible for keeping your login credentials secure and for all activity under your account.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">4. Payments</h2>
          <p>We accept the following payment methods:</p>
          <ul>
            <li><strong>Venmo</strong> and <strong>Zelle</strong> — preferred methods, processed immediately</li>
            <li><strong>Cash</strong> and <strong>Check</strong> — reservation only; payment must be made in full on the first day of class or your spot may be forfeited and your account may be suspended</li>
            <li><strong>Credit/Debit Card</strong> (via Stripe) — when available</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">5. Cancellation & Refund Policy</h2>
          <ul>
            <li><strong>Contract bookings (30-week / 15-week):</strong> If you cancel at least 12 hours before your scheduled start time, you are eligible for a 50% refund of completed payments. Cancellations within 12 hours are non-refundable.</li>
            <li><strong>Open-time (single) bookings:</strong> Non-refundable.</li>
            <li><strong>Clinics and classes:</strong> Refunds are at the discretion of management. Please contact us as soon as possible if you need to cancel.</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">6. Conduct & Liability</h2>
          <p>By participating in activities at Gina's Tennis World, you acknowledge that tennis and related physical activities carry inherent risks. You agree to:</p>
          <ul>
            <li>Follow all safety rules and instructions from staff</li>
            <li>Use equipment properly and respectfully</li>
            <li>Not hold Gina's Tennis World liable for injuries sustained during normal participation in tennis activities</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">7. Facility Rules</h2>
          <ul>
            <li>Proper tennis attire and non-marking shoes are required on courts</li>
            <li>No food or drink on courts (water bottles permitted)</li>
            <li>Children under 12 must be supervised by an adult</li>
            <li>Respect other players and staff at all times</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">8. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the updated terms.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">9. Contact</h2>
          <p>For questions about these terms, contact us:</p>
          <ul>
            <li>Email: <a href="mailto:GinasTennisWorld@gmail.com" className="text-green-600 hover:text-green-700">GinasTennisWorld@gmail.com</a></li>
            <li>Phone: 908-464-9591</li>
            <li>Address: 649 Springfield Ave, Berkeley Heights, NJ 07922</li>
          </ul>
        </div>
      </div>
    </div>
  );
}