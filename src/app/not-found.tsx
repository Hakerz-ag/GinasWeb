import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-extrabold text-green-900 mb-4">404</div>
        <h1 className="text-3xl font-bold text-green-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}