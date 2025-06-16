'use client';

import { useState } from 'react';
import { CreateCommentRequest } from '@/types';

interface CommentFormProps {
  gameSlug: string;
  parentId?: string;
  onCommentAdded?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({ 
  gameSlug, 
  parentId, 
  onCommentAdded, 
  onCancel,
  placeholder = "Share your thoughts about this game..." 
}: CommentFormProps) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !text.trim()) {
      setError('Name and comment are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const commentData: CreateCommentRequest = {
        name: name.trim(),
        text: text.trim(),
      };

      if (parentId) {
        commentData.parent_id = parentId;
      }

      const response = await fetch(`/api/games/${gameSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      // Reset form
      setName('');
      setText('');
      onCommentAdded?.();
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`name-${parentId || 'main'}`} className="block text-sm font-semibold text-gray-700 mb-2">
            Your Name
          </label>
          <div className="relative">
            <input
              type="text"
              id={`name-${parentId || 'main'}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 pl-11"
              placeholder="Your nickname"
              maxLength={100}
              required
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="md:flex md:items-end">
          <div className="w-full">
            <div className="text-sm font-semibold text-gray-700 mb-2 md:opacity-0">
              Character Count
            </div>
            <div className="text-right text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-3">
              {name.length}/100 characters
            </div>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor={`comment-${parentId || 'main'}`} className="block text-sm font-semibold text-gray-700 mb-2">
          Your Comment
        </label>
        <div className="relative">
          <textarea
            id={`comment-${parentId || 'main'}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 resize-none"
            placeholder={placeholder}
            rows={parentId ? 3 : 4}
            maxLength={2000}
            required
          />
          <div className="absolute bottom-3 right-3 text-sm text-gray-400 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
            {text.length}/2000
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !text.trim()}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Posting...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {parentId ? 'Post Reply' : 'Post Comment'}
            </div>
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
} 