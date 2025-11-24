"use client";

import Link from "next/link";
import { useState } from "react";
import { AiOutlinePlayCircle } from "react-icons/ai";
import { FaBolt } from "react-icons/fa";

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          {/* Top Part: Text Content */}
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6 animate-fade-in-up">
            <FaBolt className="mr-2 h-3 w-3" />
            <span>Now in Early Access</span>
          </div>
          
          <h1 className="max-w-4xl font-sans text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-8 animate-fade-in-up">
            Unified <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              AI Platform
            </span>{" "}
            for Game Development
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed max-w-3xl mx-auto mb-10 animate-fade-in-up">
            Stop gambling with random prompts. Build real games with engineering precision. From Game Design to Code, Art, Sound, and Analytics — all in one pipeline.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up">
            <Link
              href="/contact"
              className="group relative inline-flex justify-center items-center px-8 py-4 text-base font-bold text-white bg-black dark:bg-white dark:text-black rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-white/25"
            >
              <span className="relative z-10">Request Early Access</span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            
            <button
              onClick={openModal}
              className="inline-flex justify-center items-center px-8 py-4 rounded-full text-base font-bold border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 text-gray-900 dark:text-white"
            >
              <AiOutlinePlayCircle className="w-5 h-5 mr-2" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Bottom Part: Huge Video */}
        <div className="relative w-full max-w-6xl mx-auto group animate-fade-in-up">
           {/* Glow effect behind video */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-gray-900 ring-1 ring-gray-900/10">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              src="https://p48lfkmkbw2fjadt.public.blob.vercel-storage.com/videos/hero%20banner.mp4"
            >
              Your browser does not support the video tag.
            </video>
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Video Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeModal}>
            <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <video
                className="w-full h-full"
                controls
                autoPlay
                src="https://p48lfkmkbw2fjadt.public.blob.vercel-storage.com/videos/hero%20banner.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
