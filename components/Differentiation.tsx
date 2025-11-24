import React from "react";
import { FaGamepad, FaLink, FaSlidersH, FaUserCheck } from "react-icons/fa";

const Differentiation = () => {
  const reasons = [
    {
      icon: FaLink,
      title: "Unified Pipeline",
      description: "Game Design → Code → Art → Sound → Analytics. All connected in one pipeline.",
    },
    {
      icon: FaGamepad,
      title: "Game-Specific AI",
      description: "Models and workflows are game-design-aware, not generic tools trying to make games.",
    },
    {
      icon: FaSlidersH,
      title: "Engineering, Not Gambling",
      description: "One-prompt tools are random slots. We provide controlled iteration from Graybox V1 to Polished V3.",
    },
    {
      icon: FaUserCheck,
      title: "No AI Experts Needed",
      description: "We abstract the AI stack. You focus on building games, not managing ML infra.",
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Why teams choose <span className="text-purple-600 dark:text-purple-400">Arcane Forge</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white mb-6 shadow-lg shadow-gray-200/50 dark:shadow-none rotate-3 hover:rotate-0 transition-transform duration-300">
                <reason.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {reason.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Differentiation;
