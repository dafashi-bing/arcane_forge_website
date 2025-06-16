import { notFound } from 'next/navigation';
import { GameWithStats } from '@/types';
import { supabase } from '@/lib/supabase';
import GameEmbed from '@/components/games/GameEmbed';
import StatsBar from '@/components/games/StatsBar';
import CommentsThread from '@/components/games/CommentsThread';
import FeedbackForm from '@/components/games/FeedbackForm';

async function getGameWithStats(slug: string): Promise<GameWithStats | null> {
  try {
    // Fetch game details
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .single();

    if (gameError || !game) {
      return null;
    }

    // Fetch or create stats
    let { data: stats, error: statsError } = await supabase
      .from('stats')
      .select('*')
      .eq('game_slug', slug)
      .single();

    if (statsError || !stats) {
      // Stats don't exist yet, return game with default stats
      stats = {
        id: 'temp',
        game_slug: slug,
        plays: 0,
        likes: 0,
        dislikes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return { ...game, stats };
  } catch (error) {
    console.error('Error fetching game:', error);
    return null;
  }
}

export default async function GameDetailPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const gameWithStats = await getGameWithStats(params.slug);

  if (!gameWithStats) {
    notFound();
  }

  const { stats, ...game } = gameWithStats;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={game.icon_url}
                alt={`${game.title} icon`}
                className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-white/20"
              />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm">✨</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold">{game.title}</h1>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                  AI Game
                </div>
              </div>
              <p className="text-xl text-blue-100 leading-relaxed max-w-3xl">{game.description}</p>
              <div className="flex items-center gap-6 mt-4 text-blue-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>{stats.plays.toLocaleString()} plays</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {stats.likes + stats.dislikes > 0
                      ? `${Math.round((stats.likes / (stats.likes + stats.dislikes)) * 100)}% liked`
                      : 'No ratings yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* Game Embed */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <GameEmbed 
                  gameUrl={game.game_url} 
                  title={game.title} 
                  gameSlug={game.slug}
                />
              </div>
              
              {/* Stats Bar */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <StatsBar gameSlug={game.slug} stats={stats} />
              </div>
              
              {/* Comments */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <CommentsThread gameSlug={game.slug} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Feedback Form - Most Important */}
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Help Us Improve!</h3>
                      <p className="text-blue-100 text-sm">Your feedback powers our AI game creation</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <FeedbackForm gameSlug={game.slug} />
                </div>
              </div>

              {/* Game Info */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Game Info</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Created</span>
                    <span className="text-gray-600">
                      {new Date(game.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Last Updated</span>
                    <span className="text-gray-600">
                      {new Date(game.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Total Plays</span>
                    <span className="font-bold text-purple-600">
                      {stats.plays.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-700">Rating</span>
                    <span className="font-bold text-blue-600">
                      {stats.likes + stats.dislikes > 0
                        ? `${Math.round((stats.likes / (stats.likes + stats.dislikes)) * 100)}% positive`
                        : 'No ratings yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const gameWithStats = await getGameWithStats(params.slug);
  
  if (!gameWithStats) {
    return {
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
    };
  }

  return {
    title: `${gameWithStats.title} - Arcane Forge Games`,
    description: gameWithStats.description,
    openGraph: {
      title: gameWithStats.title,
      description: gameWithStats.description,
      images: [gameWithStats.screenshot_url],
    },
  };
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 300; // Revalidate every 5 minutes 