import Header from "components/Header";
import Footer from "components/Footer";
import { FaBolt, FaCogs, FaUsers, FaRocket } from "react-icons/fa";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="flex-grow pt-32 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-6 mb-24 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-sm font-medium mb-6">
            <FaRocket className="mr-2 h-3 w-3" />
            <span>Our Mission</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Building the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">future of game development</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            We believe that small teams should be able to build big worlds. Arcane Forge unifies the fragmented AI landscape into a single, game-aware production pipeline.
          </p>
        </section>

        {/* The Problem vs Solution */}
        <section className="container mx-auto px-4 md:px-6 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                The Problem with "Magic"
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Most AI tools today sell the dream of "one prompt, one game." But for real developers, that's just gambling. The results are random, uncontrollable, and impossible to integrate into a real production pipeline.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                On the other hand, generic enterprise AI infrastructure is powerful but requires a team of ML experts to set up and tune.
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg flex items-center justify-center mr-3 text-sm">VS</span>
                Current AI Tools
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start text-gray-600 dark:text-gray-400">
                  <span className="mr-2 text-red-500">✕</span> Random "slot machine" outputs
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-400">
                  <span className="mr-2 text-red-500">✕</span> Disconnected workflows (Chat -> Photoshop -> IDE)
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-400">
                  <span className="mr-2 text-red-500">✕</span> Requires ML PhDs to optimize
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* The Arcane Forge Way */}
        <section className="bg-gray-50 dark:bg-gray-900/30 py-24 mb-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                The Arcane Forge Approach
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                We don't replace developers; we give them superpowers. Our platform handles the AI complexity so you can focus on the craft.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-black p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                  <FaCogs size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Precision Engineering</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Stop gambling with random prompts. We provide engineering-grade tools that give you fine-grained control over every asset and mechanic.
                </p>
              </div>
              <div className="bg-white dark:bg-black p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
                  <FaBolt size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Unified Pipeline</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Design, code, art, sound, and analytics—all in one place. No more context switching or scattered scripts.
                </p>
              </div>
              <div className="bg-white dark:bg-black p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-6">
                  <FaUsers size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Built for Teams</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Collaborative workspaces that scale from a single indie developer to a full AA studio.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Vision */}
        <section className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Our Vision
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-12">
            "We envision a future where a small team of 5 can build a world that used to take 500. Where creativity is the only bottleneck, not budget or technical overhead."
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

