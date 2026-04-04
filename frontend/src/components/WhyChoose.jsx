import useScrollReveal from "../hooks/useScrollReveal"

function WhyChoose() {
  const sectionRef = useScrollReveal()

  const pillars = [
    {
      title: "Premium Coconut Selection",
      description: "Only mature, high-quality coconuts are processed",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      title: "Community-Centered Business",
      description: "Supporting local coconut farmers and families",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      title: "Traditional & Sustainable Methods",
      description: "Sun-dried and carefully processed copra",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ]

  return (
    <section className="bg-white py-12 md:py-16 border-b-25 border-[#CCBEB1]">
      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 fade-in-up">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center uppercase tracking-wide mb-12">
          Why Choose Shaw&apos;s Copra
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 stagger-children">
          {pillars.slice(0, 2).map((item) => (
            <div key={item.title} className="text-center group cursor-default">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-400 border-2 border-white shadow-sm text-white mb-4 icon-bounce group-hover:bg-teal-500 group-hover:shadow-teal-200/50">
                <span className="text-white">{item.icon}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#664C36] transition-colors">{item.title}</h3>
              <p className="text-gray-600 text-sm max-w-xs mx-auto">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-10 md:mt-14">
          <div className="text-center max-w-xs group cursor-default">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-400 border-2 border-white shadow-sm text-white mb-4 icon-bounce group-hover:bg-teal-500 group-hover:shadow-teal-200/50">
              <span className="text-white">{pillars[2].icon}</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#664C36] transition-colors">{pillars[2].title}</h3>
            <p className="text-gray-600 text-sm">{pillars[2].description}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyChoose
