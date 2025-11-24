import React from "react";
import { FaPalette, FaMusic, FaRobot, FaCode, FaBrain, FaLayerGroup } from "react-icons/fa";

const Features = () => {
  const features = [
    {
      icon: FaBrain,
      title: "Game Intelligence Hub",
      description: "Auto-detects asset needs from your GDD. Guides you through design patterns and setup.",
      bullets: [
        "Context-aware suggestions",
        "Custom knowledge integration",
      ],
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: FaCode,
      title: "Production Agents (Code)",
      description: "Engine-aware context for reliable code generation. Supports MCP for deep framework integration.",
      bullets: [
        "Flame Engine (Available Now)",
        "Unity, Unreal & Godot (Soon)",
      ],
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: FaPalette,
      title: "Production Agents (Assets)",
      description: "Generates Art, SFX, and Music. Coming soon: 3D Models, Animations & NPCs.",
      bullets: [
        "Genre-specific styles",
        "Consistent asset batches",
      ],
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      icon: FaLayerGroup,
      title: "Studio Workspace",
      description: "Feedback loops connecting runtime data back to design. True co-creation with AI.",
      bullets: [
        "Unified project management",
        "Data-driven iteration",
      ],
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <section className="relative py-24 bg-gray-50 dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            AI tools for your <span className="text-blue-600 dark:text-blue-400">whole pipeline</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light">
            From Game Intelligence to Production Agents, Arcane Forge unifies every step of development.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-[80px]">
                {feature.description}
              </p>
              
              <ul className="space-y-3">
                {feature.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                    <span className={`mt-1 mr-2 w-1.5 h-1.5 rounded-full ${feature.color.replace('text-', 'bg-')}`}></span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
