import Header from "components/Header";
import Footer from "components/Footer";
import ContactForm from "components/ContactForm";
import { siteConfig } from "config/site";

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-gray-900 dark:text-white mb-8 text-center">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center font-light">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
          
          <ContactForm 
            formspreeId={siteConfig.formspreeId} 
          />
        </div>
      </main>
      <Footer />
    </div>
  );
} 