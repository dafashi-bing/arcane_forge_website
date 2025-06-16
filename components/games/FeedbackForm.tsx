'use client';

import { useState } from 'react';
import { CreateFeedbackRequest } from '@/types';
import { validateEmail } from '@/lib/utils';

interface FeedbackFormProps {
  gameSlug: string;
}

export default function FeedbackForm({ gameSlug }: FeedbackFormProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [wantNotify, setWantNotify] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Feedback message is required');
      return;
    }

    if (email && !validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (wantNotify && !email) {
      setError('Email is required if you want to be notified');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const feedbackData: CreateFeedbackRequest = {
        message: message.trim(),
        want_notify: wantNotify,
      };

      if (email.trim()) {
        feedbackData.email = email.trim();
      }

      const response = await fetch(`/api/games/${gameSlug}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Reset form and show success
      setMessage('');
      setEmail('');
      setWantNotify(false);
      setSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6" data-feedback-form>
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          🎮 Feedback Received!
        </h3>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Thank you! We're already working on creating better games based on what you've shared. 
          {wantNotify && email && ' We\'ll let you know when we have new games that match your preferences!'}
        </p>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
          <p className="text-green-800 font-medium">
            ✨ Your input helps us craft gaming experiences that you'll truly love!
          </p>
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Share More Feedback
        </button>
      </div>
    );
  }

  return (
    <div data-feedback-form>
      <p className="text-gray-700 mb-6 leading-relaxed">
        Tell us what you love and what could be better! Your insights help us understand what makes games 
        truly enjoyable, so we can create more experiences that perfectly match your gaming style.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="feedback-message" className="block text-sm font-semibold text-gray-700 mb-2">
            Your Feedback *
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 resize-none"
            placeholder="Tell us what you think about this game. What did you like? What could be improved? Any bugs or issues?"
            rows={5}
            maxLength={5000}
            required
          />
          <div className="text-right text-sm text-gray-500 mt-2">
            {message.length}/5000
          </div>
        </div>

        <div>
          <label htmlFor="feedback-email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email (optional)
          </label>
          <input
            type="email"
            id="feedback-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            placeholder="your@email.com"
          />
          <p className="text-sm text-gray-500 mt-2">
            Optional. Only used if you want to be notified about updates to this game.
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
          <input
            type="checkbox"
            id="want-notify"
            checked={wantNotify}
            onChange={(e) => setWantNotify(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="want-notify" className="text-sm text-gray-700 leading-relaxed">
            Notify me when a new version of this game is available (requires email)
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting Feedback...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Submit Feedback
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 