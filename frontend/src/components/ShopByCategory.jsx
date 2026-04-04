import { Link } from "react-router-dom"
import useScrollReveal from "../hooks/useScrollReveal"
import copra from "../images/copra.jpg"
import Oil from "../images/oil.jpg"
import shell from "../images/shell.jpg"

function ShopByCategory() {
  const sectionRef = useScrollReveal()

  const categories = [
    { name: "Copra & Dried Coconut", img: copra },
    { name: "Shell, Husk & Charcoal Products", img: shell },
    { name: "Coconut Oil & By-products", img: Oil },
  ]

  return (
    <section id="categories">
      {/* HEADER */}
      <div className="bg-white pt-10 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center uppercase tracking-wide">
          Shop by Category
        </h2>
        <p className="text-center text-sm text-gray-600 mt-1">
          Explore Our Products
        </p>
      </div>

      {/* CARD + BROWN BACKGROUND WRAPPER */}
      <div className="relative">
        <div className="absolute inset-x-0 top-15 bottom-0 bg-[#6b4f3a] z-0 rounded-t-[2rem]" />

        <div ref={sectionRef} className="relative max-w-6xl mx-auto px-6 z-10 fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start stagger-children">

            {/* LEFT CARD */}
            <div className="rounded-xl overflow-hidden bg-white shadow-lg card-tilt img-zoom group">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={categories[0].img}
                  alt={categories[0].name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-center text-sm font-medium py-3 group-hover:text-[#664C36] transition-colors">
                {categories[0].name}
              </p>
            </div>

            {/* MIDDLE CARD */}
            <div className="rounded-xl overflow-hidden bg-white shadow-lg mt-28 card-tilt img-zoom group">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={categories[1].img}
                  alt={categories[1].name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-center text-sm font-medium py-3 group-hover:text-[#664C36] transition-colors">
                {categories[1].name}
              </p>
            </div>

            {/* RIGHT CARD */}
            <div className="rounded-xl overflow-hidden bg-white shadow-lg card-tilt img-zoom group">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={categories[2].img}
                  alt={categories[2].name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-center text-sm font-medium py-3 group-hover:text-[#664C36] transition-colors">
                {categories[2].name}
              </p>
            </div>

          </div>

          <div className="flex justify-center mt-12 pb-12">
            <Link
              to="/products"
              className="px-6 py-3 border-2 border-black bg-white text-black rounded-md font-medium hover:bg-black hover:text-white transition-all duration-300 inline-flex items-center gap-2 btn-press group"
            >
              Explore Products
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShopByCategory
