import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-green-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-medium mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-extrabold text-green-900 mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 prose prose-green max-w-none">
          <p className="text-sm text-gray-500 mb-6">Last updated: June 2026</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">1. Information We Collect</h2>
          <p>When you create an account, book a court, or sign up for a class at Gina's Tennis World, we collect:</p>
          <ul>
            <li><strong>Personal Information:</strong> Name, email address, phone number, and date of birth (optional).</li>
            <li><strong>Booking & Payment Information:</strong> Court reservations, class enrollments, payment method details, and transaction history.</li>
            <li><strong>Communication Data:</strong> Messages sent through our contact form or chat widget.</li>
            <li><strong>Usage Data:</strong> How you interact with our website, including pages visited and features used.</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Process bookings, enrollments, and payments</li>
            <li>Send booking confirmations, reminders, and notifications</li>
            <li>Communicate about schedule changes, closures, or promotions</li>
            <li>Improve our services and website experience</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">3. Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share information with:</p>
          <ul>
            <li><strong>Payment processors</strong> (e.g., Stripe) to process payments securely</li>
            <li><strong>Service providers</strong> who help us operate our website and send communications</li>
            <li><strong>Legal authorities</strong> when required by law or to protect our rights</li>
          </ul>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">4. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal information, including encrypted data transmission (SSL/TLS), secure password storage (bcrypt hashing), and restricted access to personal data.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of promotional communications</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:GinasTennisWorld@gmail.com" className="text-green-600 hover:text-green-700">GinasTennisWorld@gmail.com</a>.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">6. Cookies</h2>
          <p>We use essential cookies to maintain your login session and preferences. We do not use tracking cookies or sell cookie data to advertisers.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">7. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify registered users via email of any significant changes.</p>

          <h2 className="text-xl font-bold text-green-900 mt-6 mb-3">8. Contact</h2>
          <p>If you have questions about this privacy policy, please contact us:</p>
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