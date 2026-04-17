import { useState } from "react"
import { useNavigate } from "react-router-dom"
import HeroTransparentImage from "./HeroTransparentImage"

function Hero() {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      navigate(`/products?q=${encodeURIComponent(q)}`)
    } else {
      navigate("/products")
    }
  }

  return (
    <section
      id="home"
      className="relative bg-[#664C36] rounded-xl sm:rounded-2xl mx-3 sm:mx-4 mt-3 sm:mt-4 mb-6 sm:mb-8 md:mx-6 lg:mx-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-stretch md:justify-between gap-6 md:gap-8">
          <div className="text-white flex-1 min-w-0">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="block text-reveal" style={{ animationDelay: "0.1s" }}>
                From Coconut Farms
              </span>
              <span
                className="block border-b-2 border-sky-400 pb-1 w-fit text-reveal"
                style={{ animationDelay: "0.4s" }}
              >
                to Quality Copra
              </span>
            </h1>

            <div className="flex gap-8 mt-6">
              <div className="group cursor-default">
                <span className="text-2xl font-bold counter-glow group-hover:text-amber-300 transition-colors duration-300">
                  20+
                </span>
                <br />
                <span className="text-white/90 text-sm">Coconut Products</span>
              </div>
              <div className="group cursor-default">
                <span className="text-2xl font-bold counter-glow group-hover:text-amber-300 transition-colors duration-300">
                  1,500+
                </span>
                <br />
                <span className="text-white/90 text-sm">Trusted Buyers</span>
              </div>
            </div>

            <form onSubmit={handleSearch} className="mt-6 flex max-w-xl min-w-0">
              <input
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search copra, oil..."
                autoComplete="off"
                className="flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-l-lg bg-white border-2 border-white text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-amber-300 transition-shadow"
              />
              <button
                type="submit"
                className="shrink-0 px-4 sm:px-5 py-3 bg-white border-2 border-white border-l-0 rounded-r-lg text-gray-800 hover:bg-gray-100 transition-colors btn-press min-w-[44px]"
                aria-label="Search products"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
          </div>

          <div className="hidden md:block w-72 lg:w-80 flex-shrink-0" />
        </div>
      </div>

      <div className="absolute right-35 top-0 bottom-0 hidden md:block w-72 lg:w-80 pointer-events-none">
        <HeroTransparentImage className="h-full w-full object-cover object-top scale-125 origin-bottom" />
      </div>
    </section>
  )
}

export default Hero
