import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import BestSelling from "../components/BestSelling"
import About from "../components/About"
import WhyChoose from "../components/WhyChoose"
import ShopByCategory from "../components/ShopByCategory"
import Reviews from "../components/Reviews"
import ContactUs from "../components/ContactUs"
import Footer from "../components/Footer"

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <BestSelling />
      <About />
      <WhyChoose />
      <ShopByCategory />
      <Reviews />
      <ContactUs />
      <Footer />
    </>
  )
}

export default LandingPage
