import Banner from '@/components/games/Banner';
import GameCard from '@/components/games/GameCard';
import { Game } from '@/types';
import { supabase } from '@/lib/supabase';

async function getGames(): Promise<Game[]> {
  const { data: games, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching games:', error);
    return [];
  }

  return games || [];
}

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="min-h-screen">
      <Banner totalGames={games.length} />
      
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/80 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {games.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-lg mx-auto">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-400 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-sm">⚡</span>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  🎮 Games Loading Soon!
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Our AI is working around the clock to create amazing games for you. 
                  Each game is uniquely crafted with innovative mechanics and engaging gameplay.
                </p>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <p className="text-purple-800 font-medium">
                    💡 AI is generating new games every day. Check back soon for fresh experiences!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Section Header */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{games.length}</span>
                  </div>
                  <span className="font-semibold text-gray-700">Available Games</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  🎮 Game Library
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Choose from our collection of AI-generated games. Each one offers a unique experience 
                  crafted by artificial intelligence with innovative gameplay mechanics.
                </p>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
                {games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="text-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-12 shadow-xl border border-white/20 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-xs">✨</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    🚀 More Games Coming Soon!
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                    Our AI is constantly creating new and exciting games. 
                    Each release brings fresh gameplay mechanics and innovative experiences you've never seen before.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-white/30 hover:shadow-md transition-shadow">
                      <div className="text-2xl mb-1">🎯</div>
                      <span className="text-sm font-medium text-gray-700">Strategy</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-white/30 hover:shadow-md transition-shadow">
                      <div className="text-2xl mb-1">🧩</div>
                      <span className="text-sm font-medium text-gray-700">Puzzle</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-white/30 hover:shadow-md transition-shadow">
                      <div className="text-2xl mb-1">🏃</div>
                      <span className="text-sm font-medium text-gray-700">Action</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-white/30 hover:shadow-md transition-shadow">
                      <div className="text-2xl mb-1">🎨</div>
                      <span className="text-sm font-medium text-gray-700">Creative</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const revalidate = 60; // Revalidate every minute 