import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-6">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0F766E] to-[#06B6D4] flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-xl">
        404
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="px-6 py-3 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white font-semibold rounded-xl shadow hover:opacity-90 transition-opacity">
        Go to Dashboard
      </Link>
    </div>
  );
}
