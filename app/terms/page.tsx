import Header from "components/Header";
import Footer from "components/Footer";

export default function Terms() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-32 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Use</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Last updated: November 23, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              By accessing and using Arcane Forge (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Service Description</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Arcane Forge provides an AI-powered platform for game development, including but not limited to asset generation, code assistance, and project management tools. We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. User Conduct</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Generate content that is illegal, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically or otherwise objectionable.</li>
              <li>Harm minors in any way.</li>
              <li>Impersonate any person or entity.</li>
              <li>Upload, post, email, transmit or otherwise make available any content that you do not have a right to make available under any law or under contractual or fiduciary relationships.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Intellectual Property</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Arcane Forge and its licensors. The Service is protected by copyright, trademark, and other laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Disclaimer</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

