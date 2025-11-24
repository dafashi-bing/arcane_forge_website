import React from "react";

const DemoVideo = () => {
  const points = [
    "Project and workspace setup",
    "Image and audio generation",
    "Using the game assistant",
    "Exporting assets into your game",
  ];

  return (
    <section className="py-24 bg-white dark:bg-black" id="demo">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            See it in <span className="text-blue-600 dark:text-blue-400">action</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-light">
            Want to see the full flow? This 8-minute demo walks through planning, generating assets and connecting them to a game project.
          </p>
          
          <div className="mb-12">
            <a 
              href="https://youtu.be/U93DMCSNaEg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <span className="mr-2">⏱️</span> Short on time? Watch the 1-minute summary
            </a>
          </div>

          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 mb-12 bg-gray-900 ring-4 ring-gray-100 dark:ring-gray-800">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/K2xUo5lfLgQ"
              title="Arcane Forge Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoVideo;
