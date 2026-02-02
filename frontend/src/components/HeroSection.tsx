import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="w-full">
      <div className="w-full bg-[linear-gradient(90deg,#0B4B6B_0%,#3F7C5A_42%,#CBE800_100%)]">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="py-[80px] md:py-[96px] pb-[120px] md:pb-[140px]">
            <h1 className="text-white text-[44px] md:text-[56px] font-semibold tracking-[-0.02em]">
              Career Profile builder
            </h1>

            <p className="mt-6 max-w-[840px] text-white/90 text-[16px] md:text-[18px] leading-7">
              Scan your content, structure, and formatting, highlighting strengths, missing keywords, and opportunities to tighten your message.
            </p>

            <Link to="/register">
              <button
                type="button"
                className="mt-8 inline-flex items-center gap-3 rounded-md bg-[#BFE000] px-6 py-3 text-[#0B1B22] text-[16px] font-medium shadow-[0_10px_22px_rgba(0,0,0,0.18)] hover:bg-[#CFF200] transition-colors"
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
