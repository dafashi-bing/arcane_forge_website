'use client';

import { useState, useRef, useEffect } from 'react';

interface GameEmbedProps {
  gameUrl: string;
  title: string;
  gameSlug: string;
}

export default function GameEmbed({ gameUrl, title, gameSlug }: GameEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [playRecorded, setPlayRecorded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | 'auto'>('16:9');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showFullscreenTip, setShowFullscreenTip] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const zoomOptions = [50, 75, 100, 125, 150];

  const recordPlay = async () => {
    if (playRecorded) return; // Only record once per session
    
    try {
      const response = await fetch(`/api/games/${gameSlug}/play`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setPlayRecorded(true);
        console.log('Play recorded for', gameSlug);
      }
    } catch (error) {
      console.error('Failed to record play:', error);
    }
  };

  const handleUserInteraction = () => {
    // Clear any existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    
    // Record play after 3 seconds of interaction (indicates actual gameplay)
    interactionTimeoutRef.current = setTimeout(() => {
      recordPlay();
    }, 3000);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    // Auto-focus the iframe when it loads
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.focus();
        setIsFocused(true);
      }
    }, 100);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Add timeout fallback for loading state
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, assuming game loaded');
        setIsLoading(false);
        // Try to focus iframe
        if (iframeRef.current) {
          iframeRef.current.focus();
          setIsFocused(true);
        }
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);

  const handleContainerClick = () => {
    // If still loading, try to dismiss loading state
    if (isLoading) {
      setIsLoading(false);
    }
    
    if (iframeRef.current) {
      iframeRef.current.focus();
      setIsFocused(true);
    }
    
    // Track user interaction
    handleUserInteraction();
  };

  const handleContainerBlur = () => {
    setIsFocused(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setShowFullscreenTip(false); // Hide tip when entering fullscreen
        // Focus iframe in fullscreen
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.focus();
          }
        }, 100);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Handle aspect ratio changes - preserve focus
  useEffect(() => {
    if (isFocused && iframeRef.current && !isLoading) {
      // Re-focus after aspect ratio change
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.focus();
        }
      }, 100);
    }
  }, [aspectRatio, isFocused, isLoading]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Re-focus when entering/exiting fullscreen
      if (iframeRef.current && !isLoading) {
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.focus();
            setIsFocused(true);
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isLoading]);

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
    // Re-focus iframe after zoom change
    if (isFocused && iframeRef.current && !isLoading) {
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.focus();
        }
      }, 100);
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-video'; // 16:9
      case '4:3': return 'aspect-[4/3]';  // 4:3
      case '1:1': return 'aspect-square';  // 1:1
      case 'auto': return 'aspect-video min-h-[400px] md:min-h-[500px] lg:min-h-[600px]';
      default: return 'aspect-video';
    }
  };

  return (
    <div className="card">
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="16:9">16:9 (Widescreen)</option>
            <option value="4:3">4:3 (Classic)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="auto">Auto (Responsive)</option>
          </select>
          
          <div className="flex items-center gap-1 border border-gray-300 rounded">
            <button
              onClick={() => {
                const currentIndex = zoomOptions.indexOf(zoomLevel);
                if (currentIndex > 0) {
                  handleZoomChange(zoomOptions[currentIndex - 1]);
                }
              }}
              disabled={zoomLevel <= zoomOptions[0]}
              className="px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            
            <select
              value={zoomLevel}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              className="text-sm border-0 bg-transparent px-1 py-1 min-w-[60px] text-center"
            >
              {zoomOptions.map(zoom => (
                <option key={zoom} value={zoom}>{zoom}%</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                const currentIndex = zoomOptions.indexOf(zoomLevel);
                if (currentIndex < zoomOptions.length - 1) {
                  handleZoomChange(zoomOptions[currentIndex + 1]);
                }
              }}
              disabled={zoomLevel >= zoomOptions[zoomOptions.length - 1]}
              className="px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleContainerClick}
            className={`btn-secondary text-sm ${isFocused ? 'bg-green-100 text-green-700' : ''}`}
            title="Focus game for keyboard controls"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 9.257a6 6 0 018.486-8.486L15 3v4z" />
            </svg>
            {isFocused ? 'Focused' : 'Focus Game'}
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="btn-primary text-sm font-semibold px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            title="Toggle Fullscreen for Best Experience"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            🚀 Fullscreen
          </button>
        </div>
      </div>

      {/* Animated Fullscreen Tip */}
      {showFullscreenTip && !isFullscreen && (
        <div 
          onClick={() => setShowFullscreenTip(false)}
          className="mb-3 cursor-pointer group"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse hover:animate-none transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="font-medium">💡 Use fullscreen for the best gaming experience!</span>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-75">
                <span>Click to dismiss</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Container */}
      <div 
        ref={containerRef}
        id="game-container"
        className={`bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer ${getAspectRatioClass()} ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
        } ${isFocused ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}`}
        onClick={handleContainerClick}
        onBlur={handleContainerBlur}
        onMouseDown={handleUserInteraction}
        onKeyDown={handleUserInteraction}
        tabIndex={0}
        style={{
          overflow: zoomLevel !== 100 ? 'auto' : 'hidden'
        }}
      >
        {/* Focus Indicator */}
        {!isFocused && !isLoading && !hasError && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-white bg-opacity-90 rounded-lg px-4 py-2 text-center">
              <p className="text-sm font-medium text-gray-800">Click to focus and enable keyboard controls</p>
              <p className="text-xs text-gray-600 mt-1">🎮 Game needs focus to receive keyboard input</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 mb-3">Loading game...</p>
              <button
                onClick={() => {
                  setIsLoading(false);
                  if (iframeRef.current) {
                    iframeRef.current.focus();
                    setIsFocused(true);
                  }
                }}
                className="btn-secondary text-xs"
              >
                Game Loaded? Click Here
              </button>
            </div>
          </div>
        )}
        
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Game not available</p>
              <p className="text-gray-500 text-sm mt-1">The game could not be loaded</p>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
                className="btn-primary mt-3"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
              width: `${(100 / zoomLevel) * 100}%`,
              height: `${(100 / zoomLevel) * 100}%`,
            }}
          >
            <iframe
              ref={iframeRef}
              src={gameUrl}
              title={title}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              onMouseEnter={() => {
                // If user hovers over iframe and it's still loading, assume it's ready
                if (isLoading) {
                  setTimeout(() => setIsLoading(false), 500);
                }
                // Track interaction
                handleUserInteraction();
              }}
              onMouseDown={handleUserInteraction}
              onKeyDown={handleUserInteraction}
              allow="fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; keyboard-map"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals"
              style={{
                width: '100%',
                height: '100%',
                minHeight: isFullscreen ? '100vh' : 'auto',
              }}
              tabIndex={0}
            />
          </div>
        )}
        
        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 z-10"
            title="Exit Fullscreen (ESC)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {isFocused ? '🎮 Game is focused - keyboard controls active' : '👆 Click the game area to enable keyboard controls'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          💡 Pro tip: Use the 🚀 Fullscreen button above for the ultimate gaming experience!
        </p>
      </div>
    </div>
  );
} 