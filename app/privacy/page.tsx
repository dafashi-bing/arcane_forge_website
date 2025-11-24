import Header from "components/Header";
import Footer from "components/Footer";

export default function Privacy() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-32 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Last updated: November 23, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Welcome to Arcane Forge ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. The Data We Collect</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Identity Data</strong> includes first name, maiden name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Data</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400">
              If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:contact@arcaneforge.ai" className="text-blue-600 hover:underline">contact@arcaneforge.ai</a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

