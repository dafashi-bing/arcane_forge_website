import { getPostData, getSortedPostsData } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FaArrowLeft } from 'react-icons/fa';

export function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default function Post({ params }: { params: { slug: string } }) {
  const post = getPostData(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black overflow-hidden">
      <Header />
      
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

      <main className="flex-grow pt-32 pb-24 relative">
        <article className="container mx-auto px-4 md:px-6 max-w-3xl">
          
          {/* Back Button */}
          <div className="mb-12">
            <Link 
              href="/blog"
              className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
            >
              <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                 ←
              </span>
              Back to Blog
            </Link>
          </div>

          {/* Header */}
          <div className="mb-12 border-b border-gray-200 dark:border-gray-800 pb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight tracking-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <span>•</span>
              <span>By Arcane Forge Team</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-lg
            prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-blue-900/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          ">
            <MDXRemote source={post.content} />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
