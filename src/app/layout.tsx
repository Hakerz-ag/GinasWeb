import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: "Gina's Tennis World — Indoor Tennis Club, Berkeley Heights NJ",
  description: 'Indoor tennis club offering clinics, court rentals, ACE Attack training, and private lessons in Berkeley Heights, NJ. Spring 2026 clinic signups now open!',
  keywords: 'tennis, indoor tennis, Berkeley Heights, NJ, clinics, ACE Attack, court rental, lessons',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}