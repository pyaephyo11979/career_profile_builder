import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="w-full bg-[#090E34] pb-2 pt-4 sm:pt-6 flex justify-center">
      <div className="mx-auto w-full max-w-300 px-4 sm:px-6">
        <div className="rounded-2xl sm:rounded-full border border-white/10 bg-white/10 backdrop-blur-md flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:px-6">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-[20px] font-bold text-white tracking-tight">
              Career Profile Builder
            </Link>
          </div>

          {/* Right: Auth actions */}
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="h-10 px-3 sm:px-5 inline-flex items-center justify-center rounded-xl sm:rounded-full border border-white/15 bg-white/10 text-white text-[13px] sm:text-[14px] font-semibold hover:bg-white/15 transition-all"
                >
                  Profile
                </Link>
                <Link
                  to="/upload"
                  className="h-10 px-3 sm:px-5 inline-flex items-center justify-center rounded-xl sm:rounded-full bg-[#3B5BFF] text-white text-[13px] sm:text-[14px] font-semibold hover:bg-[#2F4CF5] transition-all"
                >
                  Upload
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="col-span-2 h-10 px-3 sm:px-5 inline-flex items-center justify-center rounded-xl sm:rounded-full border border-white/15 bg-white/10 text-white text-[13px] sm:text-[14px] font-semibold hover:bg-white/15 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-10 px-3 sm:px-6 inline-flex items-center justify-center rounded-xl sm:rounded-full border border-white/15 bg-white/10 text-white text-[13px] sm:text-[14px] font-semibold hover:bg-white/15 transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="h-10 px-3 sm:px-6 inline-flex items-center justify-center rounded-xl sm:rounded-full bg-[#3B5BFF] text-white text-[13px] sm:text-[14px] font-semibold hover:bg-[#2F4CF5] transition-all shadow-md"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
