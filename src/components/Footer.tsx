import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import { clubInfo } from '@/data/staff';

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/Logo.png"
                alt="Gina's Tennis World"
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-lg">Gina's Tennis World</p>
                <p className="text-green-300 text-xs uppercase tracking-wider">
                  Indoor Tennis Club
                </p>
              </div>
            </div>
            <p className="text-green-200 text-sm leading-relaxed">
              {clubInfo.tagline}. Offering clinics, court rentals, and the exclusive ACE Attack
              training system — the first and only one in New Jersey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-yellow-400 mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/videos', label: 'Videos' },
                { href: '/book', label: 'Book a Court' },
                { href: '/classes', label: 'Schedule a Class' },
                { href: '/staff', label: 'Our Staff' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-green-200 hover:text-yellow-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-semibold text-yellow-400 mb-4 text-sm uppercase tracking-wider">
              Programs
            </h3>
            <ul className="space-y-2">
              {[
                'Junior Clinics',
                'Adult Clinics',
                'Private Lessons',
                'ACE Attack Training',
                'Ball Machine Sessions',
                'Court Rentals',
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/classes"
                    className="text-green-200 hover:text-yellow-400 text-sm transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-yellow-400 mb-4 text-sm uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <span className="text-green-200 text-sm">{clubInfo.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-yellow-400 shrink-0" />
                <a
                  href={`tel:${clubInfo.phone}`}
                  className="text-green-200 hover:text-yellow-400 text-sm transition-colors"
                >
                  {clubInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-yellow-400 shrink-0" />
                <a
                  href={`mailto:${clubInfo.email}`}
                  className="text-green-200 hover:text-yellow-400 text-sm transition-colors break-all"
                >
                  {clubInfo.email}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a
                href={clubInfo.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-green-800 hover:bg-yellow-500 hover:text-green-900 text-green-200 rounded-full flex items-center justify-center transition-colors text-sm font-bold"
              >
                f
              </a>
              <a
                href={clubInfo.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-green-800 hover:bg-yellow-500 hover:text-green-900 text-green-200 rounded-full flex items-center justify-center transition-colors text-sm font-bold"
              >
                ▶
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-green-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-green-400 text-xs">
            © {new Date().getFullYear()} Gina's Tennis World. All rights reserved.
          </p>
          <p className="text-green-500 text-xs">
            Designed with ❤️ for the Berkeley Heights tennis community
          </p>
        </div>
      </div>
    </footer>
  );
}