interface BannerProps {
  totalGames: number;
}

export default function Banner({ totalGames }: BannerProps) {
  return (
    <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black bg-opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center">
          {/* Animated Game Count */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-6 py-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg font-semibold">
                {totalGames} AI-Generated Games
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Arcane Forge Games
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Discover incredible gaming experiences crafted by artificial intelligence. 
            Each game is unique, innovative, and designed to surprise you.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              🎮 Instant Play
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              🚀 No Downloads
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              ✨ AI-Powered
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              🆓 Free to Play
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="animate-bounce">
            <svg className="w-6 h-6 mx-auto text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 