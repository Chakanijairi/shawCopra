import { Link } from "react-router-dom"
import useScrollReveal from "../hooks/useScrollReveal"
import dried from "../images/dried.jpg"
import virgin from "../images/virgin.jpeg"
import charcoal from "../images/charcoal.jpg"

function BestSelling() {
  const sectionRef = useScrollReveal()

  const products = [
    { name: "Sun-Dried Copra", price: "₱65.00", unit: "/ kg", img: dried },
    { name: "Virgin Coconut Oil", price: "₱420.00", unit: " / liter", img: virgin },
    { name: "Coconut Shell Charcoal", price: "₱280.00", unit: " / sack", img: charcoal },
  ]

  return (
    <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div ref={sectionRef} className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12 fade-in-up">
        <div className="lg:max-w-sm shrink-0">
          <h2 className="text-2xl md:text-3xl text-gray-900">
            <span className="block font-normal">Best Selling</span>
            <span className="block font-bold text-2xl md:text-3xl mt-0.5">Copra Products</span>
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            <span className="block">High-quality coconut products</span>
            <span className="block">prepared using traditional and</span>
            <span className="block">sustainable methods.</span>
          </p>
          <Link
            to="/products"
            className="mt-4 px-5 py-2.5 border-2 border-gray-800 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-800 hover:text-white transition-all duration-300 inline-flex items-center gap-2 btn-press group"
          >
            View Products
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-w-0 stagger-children">
          {products.map((product) => (
            <div
              key={product.name}
              className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm card-lift img-zoom group cursor-pointer"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-sm overflow-hidden relative">
                {product.img ? (
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  product.name
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-[#664C36] transition-colors">{product.name}</h3>
                <p className="text-gray-700 mt-1">
                  {product.price}
                  <span className="text-gray-600">{product.unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default BestSelling
