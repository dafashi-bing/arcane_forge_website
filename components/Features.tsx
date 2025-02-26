import React from "react";
import FeatureCard from "./FeatureCard";
import { FaGamepad, FaBrain, FaChartLine, FaCloud, FaPalette, FaMusic } from "react-icons/fa";

const Features = () => {
  const features = [
    {
      icon: FaPalette,
      title: "AI-Generated Art & Assets",
      description: "Create stunning game visuals, characters, and environments in seconds with AI-powered tools.",
    },
    {
      icon: FaMusic,
      title: "AI Music & Sound Effects",
      description: "Generate immersive background music and sound effects tailored to your game’s theme.",
    },
    {
      icon: FaGamepad,
      title: "AI-Driven NPCs & Bots",
      description: "Train NPCs with LLMs for dynamic, player-aware interactions and intelligent behaviors.",
    },
    {
      icon: FaChartLine,
      title: "AI-Powered Analytics",
      description: "Understand player behavior, predict trends, and optimize engagement with AI insights.",
    },
    {
      icon: FaBrain,
      title: "Game AI & Reinforcement Learning",
      description: "Use AI to create adaptive, intelligent enemies and player challenges.",
    },
    {
      icon: FaCloud,
      title: "Cloud-Based AI Infrastructure",
      description: "Easily integrate AI into your game with scalable, no-code cloud AI services.",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 rounded-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">Why Arcane Forge?</h2>
          <p className="mt-8 text-xl text-gray-600 dark:text-gray-300 font-light">
            Empower your game studio with AI-driven tools that accelerate development, enhance creativity, and optimize player engagement.
          </p>
        </div>
        <div className="mt-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
