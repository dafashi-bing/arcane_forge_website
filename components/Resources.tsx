import Link from "next/link";
import React from "react";
import { FaBook, FaEnvelope, FaDiscord } from "react-icons/fa";

const Resources = () => {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Learn more & stay connected
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Docs */}
          <div className="group bg-white dark:bg-black p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <FaBook size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Docs</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Read quickstart guides, examples and API references.
            </p>
            <a 
              href="https://docs.arcaneforge.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              View Docs <span className="ml-2">&rarr;</span>
            </a>
          </div>

          {/* Contact */}
          <div className="group bg-white dark:bg-black p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <FaEnvelope size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Contact</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tell us about your studio and what you’re building.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center text-purple-600 dark:text-purple-400 font-medium hover:underline"
            >
              Contact Us <span className="ml-2">&rarr;</span>
            </Link>
          </div>

          {/* Community */}
          <div className="group bg-white dark:bg-black p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <FaDiscord size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Community</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join our Discord for updates and early feedback.
            </p>
            <a 
              href="https://discord.gg/J4Nb8qRR7q" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Join Discord <span className="ml-2">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Resources;
