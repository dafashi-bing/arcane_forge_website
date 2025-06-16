'use client';

import { useState } from 'react';
import { Stats } from '@/types';

interface StatsBarProps {
  gameSlug: string;
  stats: Stats;
  onStatsUpdate?: (stats: Stats) => void;
}

export default function StatsBar({ gameSlug, stats, onStatsUpdate }: StatsBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStats, setCurrentStats] = useState(stats);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [lastReaction, setLastReaction] = useState<'like' | 'dislike' | null>(null);

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/games/${gameSlug}/${type}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const { stats: newStats } = await response.json();
        setCurrentStats(newStats);
        onStatsUpdate?.(newStats);
        
        // Show feedback prompt after successful reaction
        setLastReaction(type);
        setShowFeedbackPrompt(true);
      }
    } catch (error) {
      console.error(`Failed to ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToFeedback = () => {
    setShowFeedbackPrompt(false);
    // Scroll to feedback form (it's in the sidebar)
    const feedbackSection = document.querySelector('[data-feedback-form]');
    if (feedbackSection) {
      feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight effect
      feedbackSection.classList.add('ring-2', 'ring-primary-500', 'ring-opacity-50');
      setTimeout(() => {
        feedbackSection.classList.remove('ring-2', 'ring-primary-500', 'ring-opacity-50');
      }, 3000);
    }
  };

  const totalReactions = currentStats.likes + currentStats.dislikes;
  const likePercentage = totalReactions > 0 ? Math.round((currentStats.likes / totalReactions) * 100) : 0;

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {currentStats.plays.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Plays</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {totalReactions > 0 ? `${likePercentage}%` : 'No ratings'}
              </div>
              <div className="text-sm text-gray-600">Positive</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleReaction('like')}
              disabled={isLoading}
              className="flex items-center gap-2 btn-ghost text-green-600 hover:bg-green-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {currentStats.likes}
            </button>
            
            <button
              onClick={() => handleReaction('dislike')}
              disabled={isLoading}
              className="flex items-center gap-2 btn-ghost text-red-600 hover:bg-red-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
              </svg>
              {currentStats.dislikes}
            </button>
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Play counts are automatically tracked when you interact with the game
          </p>
        </div>
      </div>

      {/* Feedback Prompt Modal */}
      {showFeedbackPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowFeedbackPrompt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {lastReaction === 'like' ? 'Thanks for the thumbs up! 👍' : 'Thanks for your feedback! 👎'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {lastReaction === 'like' 
                  ? "We're glad you enjoyed this game! Help us create even better games that match your taste."
                  : "Your feedback helps us improve! Tell us what didn't work so our AI can create better games for you."
                }
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">🎯 Personalized Game Creation</h4>
                  <p className="text-sm text-gray-700">
                    Your feedback helps us understand what makes games fun for you. The more you share, 
                    the better we become at creating games that perfectly match your interests and playing style!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={scrollToFeedback}
                className="btn-primary flex-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4.707 4.707z" />
                </svg>
                Share Feedback
              </button>
              
              <button
                onClick={() => setShowFeedbackPrompt(false)}
                className="btn-secondary"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 