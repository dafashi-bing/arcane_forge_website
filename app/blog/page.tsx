import Link from 'next/link';
import { getSortedPostsData } from '@/lib/blog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function formatDate(dateString: string): string {
  // Parse date string as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function Blog() {
  const posts = getSortedPostsData();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black overflow-hidden">
      <Header />
      
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
      
      <main className="flex-grow pt-32 pb-24 relative">
        {/* Header Section */}
        <div className="container mx-auto px-4 md:px-6 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-6">
              <span>The Blog</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
              Latest from <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Arcane Forge</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Insights, updates, and stories from the team building the future of game development.
            </p>
          </div>
        </div>

        {/* Posts List */}
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            {posts.length > 0 ? (
              <div className="space-y-12">
                {posts.map((post) => (
                  <Link 
                    key={post.slug} 
                    href={`/blog/${post.slug}`}
                    className="group block border-b border-gray-200 dark:border-gray-800 pb-12 last:border-0"
                  >
                    <article className="flex flex-col md:flex-row gap-6 md:items-baseline">
                      <div className="md:w-1/4 flex-shrink-0">
                        <time className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {formatDate(post.date)}
                        </time>
                      </div>
                      
                      <div className="md:w-3/4">
                        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:underline">
                          Read article →
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-600 dark:text-gray-400 text-lg">No posts found yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
