import useScrollReveal from "../hooks/useScrollReveal"

function About() {
  const sectionRef = useScrollReveal()

  return (
    <section id="about" className="bg-white py-12 md:py-16 border-y-25 border-[#CCBEB1]">
      <div ref={sectionRef} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center fade-in-up">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">About us</h2>
        <p className="text-gray-700 text-left mb-4 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed sm:leading-snug">
          At Shaw&apos;s Copra, we are committed to preserving the rich coconut culture of the Philippines. Our copra and coconut products are responsibly sourced from local farmers in Zamboanga del Sur, ensuring quality, sustainability, and fair livelihood.
        </p>
        <p className="text-gray-700 text-left font-medium text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed sm:leading-snug">
          From harvest to processing — handled with integrity.
        </p>
      </div>
    </section>
  )
}

export default About
