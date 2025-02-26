import Header from "components/Header";
import Hero from "components/Hero";
import Features from "components/Features";
import Section from "components/Section";
import Footer from "components/Footer";
// import Customers from "components/Customers";
// import Image from "next/image";
import Accordion from "components/Accordion";
// import Reviews from "components/Reviews";
// import Download from "components/Download";
import ContactSection from "components/ContactSection";
import { siteConfig } from "config/site";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main>
        <Hero />
        <Features />
        {/* <Section
          leftHalf={
            <>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
                Effortlessly highlight the key features of your app
              </h2>
              <p className="text-xl font-light">
                Our app makes it easy to showcase your key features. With customizable sections, you can highlight the
                most important aspects of your product. More to come.
              </p>
            </>
          }
          rightHalf={
            <Image src={"/products/phone.png"} alt="section-image" width={500} height={100} className="w-1/2 h-auto" />
          }
        /> */}
        {/* <Customers /> */}
        <Section
          leftHalf={<Accordion />}
          rightHalf={
            <div className="flex flex-col justify-end">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
                Transform Game Development with AI
              </h2>
              <p className="text-xl font-light">
                Discover how Arcane Forge accelerates game creation, enhances player experiences, and streamlines AI
                integration for game studios.
              </p>
            </div>
          }
        />
        {/* <Reviews /> */}
        {/* <Download /> */}
        <ContactSection formspreeId={siteConfig.formspreeId} />
      </main>
      <Footer />
    </div>
  );
}
