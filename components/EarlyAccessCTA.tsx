import Link from "next/link";
import React from "react";

const EarlyAccessCTA = () => {
  return (
    <section className="relative py-24 bg-black overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
          Ready to ship fast <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            and stand out?
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Join indie devs and small teams building with Arcane Forge. Speed up your dev cycle by 20x.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-5 mb-12">
          <Link
            href="https://app.arcaneforge.ai/"
            target="_blank"
            className="group relative inline-flex justify-center items-center px-8 py-4 text-lg font-bold text-black bg-white rounded-full overflow-hidden transition-transform duration-300 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            Try Web Version
          </Link>
          <Link
            href="https://github.com/arcane-forge-ai/arcane-forge-studio/releases"
            target="_blank"
            className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold text-white border border-white/30 bg-white/5 backdrop-blur-sm rounded-full hover:bg-white/10 transition-all duration-300"
          >
            Download Desktop
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Ideal for indie and small teams shipping PC, console or mobile titles.
        </p>
      </div>
    </section>
  );
};

export default EarlyAccessCTA;
