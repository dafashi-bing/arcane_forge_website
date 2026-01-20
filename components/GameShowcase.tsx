"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";

type Game = {
  id: string;
  title: string;
  screenshot_url: string;
  icon_url: string;
  game_url: string;
};

export default function GameShowcase() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(`${siteConfig.gamesApiHost}/api/games`);
        const data = await response.json();
        
        // Strictly use API data, no inferred tags or icons
        const mappedGames = data.games.map((game: any) => ({
          id: game.id,
          title: game.title,
          screenshot_url: game.screenshot_url,
          icon_url: game.icon_url,
          game_url: game.game_url,
        }));

        setGames(mappedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <section className="relative py-24 overflow-hidden min-h-[600px] flex items-center justify-center">
        <div className="animate-pulse text-blue-500 text-xl font-medium">Loading Games...</div>
      </section>
    );
  }

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10 mix-blend-screen animate-blob"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10 mix-blend-screen animate-blob animation-delay-2000"></div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-6">
            Built with Arcane Forge
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Play games fully generated and powered by our platform. <br className="hidden md:inline"/>
            From concept art to runtime logic, AI makes it real.
          </p>
        </div>

        {/* Evolution Story */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">From Graybox to Gold: The Evolution</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">See how our AI helps you iterate from a rough prototype to a polished release.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-gray-200 via-blue-500 to-purple-500 -z-10 transform -translate-y-1/2 opacity-30"></div>

            {/* V1 */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative group hover:-translate-y-1 transition-transform">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-200 dark:bg-gray-800 px-4 py-1 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border border-white dark:border-gray-700">
                Version 1
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-2">The Graybox</h4>
              <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <video 
                  src="https://p48lfkmkbw2fjadt.public.blob.vercel-storage.com/videos/shape_rogue_v1.mp4" 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                "Simple shapes, 5 heroes, basic mechanics. It's not perfect, but it's a start."
              </p>
              <div className="h-1 w-12 bg-gray-300 rounded-full"></div>
            </div>

            {/* V2 */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border-2 border-blue-500/20 shadow-md relative group hover:-translate-y-1 transition-transform">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-100 dark:bg-blue-900/50 px-4 py-1 rounded-full text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider border border-white dark:border-gray-700">
                Version 2
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-2">Playable Build</h4>
              <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-blue-200 dark:border-blue-900/50">
                <video 
                  src="https://p48lfkmkbw2fjadt.public.blob.vercel-storage.com/videos/shape_rogue_v2.mp4" 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                "More heroes, balanced economy, improved UI. Less broken, more enjoyable."
              </p>
              <div className="h-1 w-24 bg-blue-500 rounded-full"></div>
            </div>

            {/* V3 */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border-2 border-purple-500 shadow-xl relative group hover:-translate-y-1 transition-transform">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-100 dark:bg-purple-900/50 px-4 py-1 rounded-full text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider border border-white dark:border-gray-700">
                Version 3
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-2">Polished Release</h4>
              <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-purple-200 dark:border-purple-900/50">
                <video 
                  src="https://p48lfkmkbw2fjadt.public.blob.vercel-storage.com/videos/immune_rogue_preview.mp4" 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                "Cleaner interface, animations, wingman system. Dynamic, strategic, unpredictable."
              </p>
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <Link 
              href={game.game_url}
              target="_blank"
              key={game.id} 
              className="group relative bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-[320px]"
            >
              {/* Image Area */}
              <div className="relative h-full w-full overflow-hidden bg-gray-800">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10" />
                {game.screenshot_url && (
                  <Image
                    src={game.screenshot_url}
                    alt={game.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                
                {/* Game Info overlaid on screenshot */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                   <div className="flex items-center space-x-4 mb-4">
                     {game.icon_url && (
                       <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-black/50 backdrop-blur-sm">
                          <Image 
                            src={game.icon_url}
                            alt={`${game.title} icon`}
                            fill
                            className="object-cover"
                          />
                       </div>
                     )}
                     <h3 className="text-xl font-bold text-white drop-shadow-md truncate flex-1">
                      {game.title}
                     </h3>
                   </div>
                   
                   <div className="w-full py-3 px-4 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white text-center text-sm font-bold rounded-xl transition-all duration-300">
                    Play Now
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <a 
            href={`${siteConfig.gamesApiHost}/games`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white bg-black dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            View All Games
          </a>
        </div>
      </div>
    </section>
  );
}
