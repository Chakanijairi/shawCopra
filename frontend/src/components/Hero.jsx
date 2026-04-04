import { Link } from "react-router-dom"

function Hero() {
  return (
    <section id="home" className="bg-[#664C36] rounded-2xl mx-4 mt-4 mb-8 md:mx-6 lg:mx-8 overflow-hidden relative">
      {/* Decorative floating circles */}
      <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-white/5 animate-float-slow pointer-events-none" />
      <div className="absolute bottom-16 left-10 w-20 h-20 rounded-full bg-white/5 animate-float-reverse pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-10 h-10 rounded-full bg-white/5 animate-float pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="text-white flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="block text-reveal" style={{ animationDelay: '0.1s' }}>From Coconut Farms</span>
              <span className="block border-b-2 border-sky-400 pb-1 w-fit text-reveal" style={{ animationDelay: '0.4s' }}>to Quality Copra</span>
            </h1>
            <div className="flex gap-8 mt-6">
              <div className="group cursor-default">
                <span className="text-2xl font-bold counter-glow group-hover:text-amber-300 transition-colors duration-300">20+</span>
                <br />
                <span className="text-white/90 text-sm">Coconut Products</span>
              </div>
              <div className="group cursor-default">
                <span className="text-2xl font-bold counter-glow group-hover:text-amber-300 transition-colors duration-300">1,500+</span>
                <br />
                <span className="text-white/90 text-sm">Trusted Buyers</span>
              </div>
            </div>
            <div className="mt-6 flex max-w-xl">
              <input
                type="text"
                placeholder="Search copra, coconut oil, dried coconut meat..."
                className="flex-1 px-4 py-3 rounded-l-lg bg-white border-2 border-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-amber-300 transition-shadow"
              />
              <button
                type="button"
                className="px-5 py-3 bg-white border-2 border-white border-l-0 rounded-r-lg text-gray-800 hover:bg-gray-100 transition-colors btn-press"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="hidden md:block flex-shrink-0 w-72 lg:w-80 relative">
            {/* Glow ring behind the image */}
            <div className="absolute inset-0 rounded-full bg-amber-400/20 pulse-ring" />
            <div className="aspect-square rounded-full bg-[#5a4230] overflow-hidden flex items-center justify-center text-white/40 text-sm animate-float-slow shadow-2xl border-4 border-white/10">
              Hero image
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

export default Hero
