'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import CommentForm from './CommentForm';

interface CommentsThreadProps {
  gameSlug: string;
}

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

export default function CommentsThread({ gameSlug }: CommentsThreadProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/games/${gameSlug}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      const threaded = buildCommentTree(data.comments || []);
      setComments(threaded);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const buildCommentTree = (flatComments: Comment[]): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // Initialize all comments with empty replies array
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Build the tree structure
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    // Sort by creation date (newest first for root, oldest first for replies)
    rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const sortReplies = (comments: CommentWithReplies[]) => {
      comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      comments.forEach(comment => sortReplies(comment.replies));
    };
    
    rootComments.forEach(comment => sortReplies(comment.replies));
    
    return rootComments;
  };

  useEffect(() => {
    fetchComments();
  }, [gameSlug]);

  const handleCommentAdded = () => {
    setReplyingTo(null);
    fetchComments();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-purple-400 to-purple-600',
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-pink-400 to-pink-600',
      'from-teal-400 to-teal-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderComment = (comment: CommentWithReplies, depth: number = 0) => {
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-6 md:ml-8 border-l-2 border-gradient-to-b from-purple-200 to-blue-200 pl-4 md:pl-6' : ''}`}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${getAvatarColor(comment.name)} rounded-full flex items-center justify-center shadow-lg ring-2 ring-white`}>
                <span className="text-white font-bold text-sm">
                  {comment.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{comment.name}</span>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatRelativeTime(comment.created_at)}</span>
                </div>
              </div>
            </div>
            
            {depth < 3 && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Reply
              </button>
            )}
          </div>
          
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
          
          {replyingTo === comment.id && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <CommentForm
                gameSlug={gameSlug}
                parentId={comment.id}
                onCommentAdded={handleCommentAdded}
                onCancel={() => setReplyingTo(null)}
                placeholder={`Reply to ${comment.name}...`}
              />
            </div>
          )}
        </div>
        
        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/90 rounded-2xl p-6 shadow-lg animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Comments</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchComments}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalComments = comments.reduce((total, comment) => total + 1 + countReplies(comment), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          Comments ({totalComments})
        </h3>
      </div>
      
      {/* Comment Form */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <CommentForm
          gameSlug={gameSlug}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No comments yet</h3>
          <p className="text-gray-600">Be the first to share your thoughts about this game!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}

// Helper function to count total replies in a comment tree
function countReplies(comment: CommentWithReplies): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
} 