import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="w-full bg-[#090E34]">
      <div className="w-full">
        <div className="mx-auto max-w-300 px-6">
          <div className="py-30 pb-20 md:py-40">
            {/* Optional: Add a small tag/pill here if you want the "Resources" look from the image */}
            
            <h1 className="text-white text-[44px] md:text-[64px] font-bold tracking-tight leading-[1.1]">
              Career Profile builder
            </h1>

            <p className="mt-6 max-w-160 text-white/70 text-[18px] md:text-[20px] leading-8">
              Scan your content, structure, and formatting, highlighting strengths, missing keywords, and opportunities to tighten your message.
            </p>

            <Link to="/register">
              <button
                type="button"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#3B5BFF] px-8 py-4 text-white text-[16px] font-medium shadow-lg hover:bg-[#2F4CF5] transition-all hover:-translate-y-0.5"
              >
                Parse a Resume
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}