import Header from "components/Header";
import Footer from "components/Footer";
import ContactForm from "components/ContactForm";
import { siteConfig } from "config/site";
import { FaDiscord, FaEnvelope } from "react-icons/fa";

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="flex-grow pt-32 pb-16 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto items-start">
            {/* Left Column: Info */}
            <div className="space-y-12 pt-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                  Let's build something <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">incredible.</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                  We're currently onboarding select studios for Early Access. Tell us about your team and what you're building.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-white shrink-0">
                    <FaEnvelope size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Us</h3>
                    <p className="text-gray-600 dark:text-gray-400">For general inquiries and partnerships.</p>
                    <a href="mailto:contact@arcaneforge.ai" className="text-blue-600 hover:underline mt-1 block">contact@arcaneforge.ai</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FaDiscord size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Join the Community</h3>
                    <p className="text-gray-600 dark:text-gray-400">Get help, share your work, and chat with devs.</p>
                    <a href="https://discord.gg/J4Nb8qRR7q" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline mt-1 block">Join Discord &rarr;</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl">
              <ContactForm formspreeId={siteConfig.formspreeId} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
