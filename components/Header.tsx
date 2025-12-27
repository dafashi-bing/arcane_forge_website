"use client";

import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";
import { useEffect, useState } from "react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-800/50 py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold dark:text-white flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Arcane Forge Logo" 
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span>Arcane Forge</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          {['Games', 'Docs', 'Blog', 'About'].map((item) => (
            <Link 
              key={item}
              href={
                item === 'Docs' ? "https://docs.arcaneforge.ai" : 
                item === 'Games' ? "https://games.arcaneforge.ai/" :
                `/${item.toLowerCase()}`
              }
              target={item === 'Docs' ? "_blank" : undefined}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Link 
            href="/contact" 
            className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            Contact
          </Link>

          <Link
            href="https://app.arcaneforge.ai/"
            target="_blank"
            className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg shadow-blue-500/10"
          >
            Launch Web Beta
          </Link>
          
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
