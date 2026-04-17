import { useState } from "react"
import useScrollReveal from "../hooks/useScrollReveal"

function Reviews() {
  const [showAll, setShowAll] = useState(false)
  const sectionRef = useScrollReveal()

  const testimonials = [
    {
      text: "Dugay na mi ga negosyo ug copra, ug sa Shaw's Copra ra gyud mi naka-experience ug consistent nga kalidad. Limpyo ang copra, uga og tarong, ug walay sagol nga hugaw. Klaro kaayo nga tarong ang ilang proseso gikan sa pagkuha sa niyog hangtod sa pagbaligya. Nindot sad kaayo ilang pakig-istorya ug patas ang presyo, mao nga salig gyud mi ani nila.",
      name: "Jasper Ayawan",
      role: "Youtuber",
      rating: 4.5,
    },
    {
      text: "Maayo kaayo ang serbisyo ug patas ang presyo. Salig gyud mi ani nila.",
      name: "Mukhayr Ladjabuan",
      role: "Software Engineer",
      rating: 5,
    },
    {
      text: "First time nako naka-order ug copra online ug wala gyud ko na-disappoint. Tarong ang packaging, wala ma-damage during delivery, ug ang quality sa copra mismo — uga, limpyo, ug way baho. Balik-balik na gyud ko diri.",
      name: "Maria Santos",
      role: "Business Owner",
      rating: 5,
    },
    {
      text: "Ang coconut oil nila lahi ra gyud ug quality compared sa uban. Pure virgin coconut oil gyud, bibo ang humot ug klaro ang lami. Ga-gamit ko ani for cooking ug for skin care. Worth every peso!",
      name: "Carlo Reyes",
      role: "Health Enthusiast",
      rating: 4.5,
    },
    {
      text: "Nindot kaayo ang charcoal nila para sa grilling. Dugay mag-aso, taas og init, ug dili dali mahanaw. Mas maayo pa kaysa sa mga charcoal sa merkado. Recommended gyud for restaurants ug catering.",
      name: "Pedro Villanueva",
      role: "Restaurant Owner",
      rating: 5,
    },
    {
      text: "Na-try nako ang ilang coco coir ug shell products para sa akong garden. Super effective ug eco-friendly pa gyud. Supportive sad kaayo ang team nila — nag-guide pa ko unsaon pag-gamit. Daghan kaayo salamat Shaw's Copra!",
      name: "Ana Dela Cruz",
      role: "Urban Farmer",
      rating: 4.5,
    },
  ]

  const visibleReviews = showAll ? testimonials : testimonials.slice(0, 2)

  return (
    <section id="reviews" className="bg-white py-12 md:py-16 border-b-25 border-[#CCBEB1]">
      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 fade-in-up">
        <div className="border-l-4 border-blue-500 pl-4 mb-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            What Our Customers Say
          </h2>
        </div>
        <p className="text-gray-600 mb-10">Real feedback from farmers, traders, and buyers.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleReviews.map((t) => (
            <div
              key={t.name}
              className="border border-gray-800 rounded-xl p-6 bg-white shadow-sm card-lift hover:border-[#664C36] transition-colors duration-300"
            >
              <p className="text-gray-700 mb-4">{t.text}</p>

              {/* Conditional layout for rating */}
              {t.rating === 5 ? (
                // 5-star: stacked below name
                <div>
                  <p className="font-bold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-600">{t.role}</p>
                  <div className="flex items-center gap-1 mt-3">
                    <span className="font-semibold text-gray-900">{t.rating}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${star <= t.rating ? "text-gray-900" : "text-gray-300"}`}
                          fill={star <= t.rating ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // 4.5-star: keep rating on the right
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-600">{t.role}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">{t.rating}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${star <= t.rating ? "text-gray-900" : "text-gray-300"}`}
                          fill={star <= t.rating ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="px-5 py-2.5 border-2 border-gray-800 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-800 hover:text-white transition-all duration-300 inline-flex items-center gap-2 btn-press"
          >
            {showAll ? "Show Less" : `View More Reviews (${testimonials.length - 2}+)`}
            <span aria-hidden="true" className={`transition-transform duration-300 ${showAll ? "rotate-90" : ""}`}>→</span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default Reviews
