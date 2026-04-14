import useScrollReveal from "../hooks/useScrollReveal"

function ContactUs() {
  const sectionRef = useScrollReveal()

  return (
    <section id="contact" className="bg-white-100/50 py-12 md:py-16 border-l-4 border-amber-400 border-b-4 border-amber-400">
      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 fade-in-up">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-900 mb-2">Contact Us</h2>
        <p className="text-center text-gray-600 mb-10">
          Feel free to contact us and we will get back to you as soon as we can.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-50">
          {/* Form */}
          <div>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)] transition-all duration-200"
              />
              <input
                type="email"
                placeholder="Enter your email..."
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)] transition-all duration-200"
              />
              <textarea
                rows={4}
                placeholder="Enter your message..."
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)] transition-all duration-200 resize-none"
              />
              <button
                type="submit"
                className="w-127 px-6 py-3 rounded-lg bg-[#664C36] text-white font-semibold uppercase tracking-wide hover:bg-amber-800 transition-all duration-300 btn-press hover:shadow-lg"
              >
                SEND
              </button>
            </form>
          </div>
          {/* Contact info */}
          <div className="text-center space-y-6">
            <div className="group">
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#664C36] transition-colors">Visit us</h3>
              <p className="text-gray-700">Pagadian City, Zamboanga Del Sur</p>
            </div>
            <div className="group">
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#664C36] transition-colors">Talk to us</h3>
              <p className="text-gray-700">+63 9538893345</p>
            </div>
            <div className="group">
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#664C36] transition-colors">Location</h3>
              <p className="text-gray-700">Baganian, Tabina, Zamboanga Del Sur</p>
            </div>
            <div className="justify-center flex gap-8 pt-2">
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:bg-[#166FE5] transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-300/40" aria-label="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-300/40 bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#962FBF]" aria-label="Instagram">
                <svg className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
              {/* TikTok */}
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-lg bg-black flex items-center justify-center text-white border-2 border-[#00F2EA] shadow-[inset_0_0_0_1px_#FF0050] transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-300/40 hover:border-[#00F2EA]" aria-label="TikTok">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactUs
