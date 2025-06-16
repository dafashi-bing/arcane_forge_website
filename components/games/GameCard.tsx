import Image from 'next/image';
import Link from 'next/link';
import { Game } from '@/types';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/games/${game.slug}`}>
      <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
        {/* Screenshot with overlay */}
        <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <Image
            src={game.screenshot_url}
            alt={`${game.title} screenshot`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
              <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Game type badge */}
          <div className="absolute top-3 right-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm bg-opacity-90">
              ✨ AI Game
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            {/* Game icon */}
            <div className="w-12 h-12 relative flex-shrink-0 rounded-lg overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-200 transition-colors duration-300">
              <Image
                src={game.icon_url}
                alt={`${game.title} icon`}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            
            {/* Game info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors duration-300">
                {game.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {game.description}
              </p>
            </div>
          </div>
          
          {/* Play button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Instant Play</span>
              </div>
              
              <div className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors duration-300">
                <span>Play Now</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 