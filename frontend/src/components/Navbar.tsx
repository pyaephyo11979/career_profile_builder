import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b border-[#EEF2F7]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="h-[72px] flex items-center justify-between">
          {/* Left: Brand (kept minimal like screenshot) */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-[20px] font-semibold"> Career Profile Builder </Link>
            </div>
          </div>

          {/* Right: Search + Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/register"
              className="h-10 px-5 inline-flex items-center justify-center rounded-full bg-[#4F46E5] text-white text-[14px] font-semibold hover:bg-[#4338CA] transition-colors"
            >
              Sign up
            </Link>

            <Link
              to="/login"
              className="h-10 px-5 inline-flex items-center justify-center rounded-full border-2 border-[#4F46E5] text-[#4F46E5] text-[14px] font-semibold hover:bg-[#EEF2FF] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}