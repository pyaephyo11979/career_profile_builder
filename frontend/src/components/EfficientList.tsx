import { useEffect, useState } from "react";

type Card = {
  title: string;
  body: string;
};

const cardsData: Card[] = [
  {
    title: "Efficient Resume\nProcessing",
    body:
      "Automated resume processing to quickly analyze multiple resumes simultaneously, saving time and resources",
  },
  {
    title: "Standardized Data\nComparison",
    body:
      "Standardize data from various resume formats, making it easier to compare candidates' qualifications and experiences",
  },
  {
    title: "Organized Data Insights",
    body:
      "Organize resume data for easy analysis, enabling insights into talent pools, hiring trends, and recruitment effectiveness.",
  },
  {
    title: "Faster Hiring Decisions",
    body:
      "Enable faster response times and streamline the application process, expediting hiring decisions",
  },
];

export default function EfficientList() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return (
    <section className="w-full bg-[#090E34] relative z-10">
      <div className="mx-auto max-w-300 px-6">
        <div className="-mt-20 md:-mt-24 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {cardsData.map((c, index) => (
               <div
                key={c.title}
                style={{
                  transitionDelay: `${index * 150}ms`, // Stagger effect
                }}
                className={`
                  group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6
                  shadow-[0_18px_30px_rgba(0,0,0,0.35)]
                  transition-all duration-700 ease-out
                  hover:-translate-y-2 hover:bg-white/7 hover:border-white/15 hover:shadow-[0_28px_48px_rgba(0,0,0,0.45)]
                  ${isVisible 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 -translate-y-20 scale-100"}
                `}
              >
                <h3 className="text-white text-[20px] font-semibold leading-7 whitespace-pre-line">
                  {c.title}
                </h3>
                <p className="mt-4 text-white/65 text-[14px] leading-6">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}