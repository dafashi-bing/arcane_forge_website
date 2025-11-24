import React from "react";
import { FaLightbulb, FaTools, FaTruckLoading, FaChartLine, FaUnity, FaReact } from "react-icons/fa";
import { SiUnrealengine, SiGodotengine } from "react-icons/si";

const Workflow = () => {
  const steps = [
    {
      icon: FaLightbulb,
      title: "Ideation",
      description: "Use the game intelligence hub to outline mechanics, world ideas, and initial designs.",
    },
    {
      icon: FaTools,
      title: "Creation",
      description: "Production agents generate code, assets, and sound to build your game content.",
    },
    {
      icon: FaTruckLoading,
      title: "Delivery",
      description: "Export assets and code directly into your engine of choice for assembly.",
    },
    {
      icon: FaChartLine,
      title: "Optimization",
      description: "Analyze performance and use AI to iterate and balance your game.",
    },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent hidden md:block"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Seamlessly fits your workflow
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center group">
              {/* Step Number Background */}
              <div className="absolute -top-8 -right-4 text-9xl font-bold text-gray-200 dark:text-gray-800/50 -z-10 select-none">
                {index + 1}
              </div>

              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center mb-8 text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-700 transform group-hover:scale-110 transition-transform duration-300">
                <step.icon size={32} />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <div className="inline-flex flex-col items-center p-8 rounded-3xl bg-white dark:bg-black border border-gray-100 dark:border-gray-800 shadow-2xl">
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-6">
              Works alongside your favorite engines
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-gray-400 dark:text-gray-500 grayscale hover:grayscale-0 transition-all duration-500">
               <div className="flex flex-col items-center gap-2 hover:text-orange-500 transition-colors group">
                 <img src="/logos/flame_logo.png" alt="Flame" className="w-10 h-auto opacity-60 group-hover:opacity-100 transition-opacity filter grayscale group-hover:grayscale-0" />
                 <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Flame</span>
               </div>
               
               <div className="flex flex-col items-center gap-2 hover:text-[#478cbf] transition-colors group">
                 <SiGodotengine size={40} />
                 <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Godot</span>
               </div>

               <div className="flex flex-col items-center gap-2 hover:text-black dark:hover:text-white transition-colors group">
                  <FaUnity size={40} />
                  <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Unity</span>
               </div>

               <div className="flex flex-col items-center gap-2 hover:text-black dark:hover:text-white transition-colors group">
                  <SiUnrealengine size={40} />
                  <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Unreal</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;
