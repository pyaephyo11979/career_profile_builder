import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="w-full pt-6 bg-[#F3F5F7] flex justify-center">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-between px-6 py-3">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-[20px] font-bold text-[#0F172A] tracking-tight">
              Career Profile Builder
            </Link>
          </div>

          {/* Right: Login Button */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="h-10 px-6 inline-flex items-center justify-center rounded-full bg-[#032b2b] text-white text-[14px] font-semibold hover:bg-[#043d3d] transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="h-10 px-6 inline-flex items-center justify-center rounded-full bg-[#032b2b] text-white text-[14px] font-semibold hover:bg-[#043d3d] transition-all hover:-translate-y-0.5 shadow-md"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}