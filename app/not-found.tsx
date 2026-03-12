import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center max-w-md">
        
        {/* 404 number */}
        <h1 className="text-7xl font-bold text-gray-900">
          404
        </h1>

        {/* Title */}
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">
          Page not found
        </h2>

        {/* Description */}
        <p className="mt-2 text-gray-500">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>

        {/* Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <Link
            href="/"
            className="px-5 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition"
          >
            Go Home
          </Link>

          <Link
            href="/"
            className="px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
          >
            Back
          </Link>
        </div>

      </div>
    </div>
  );
}