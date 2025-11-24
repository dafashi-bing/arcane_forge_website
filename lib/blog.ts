import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  [key: string]: any;
};

export function getSortedPostsData(): Post[] {
  // Create directory if it doesn't exist
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.filter(fileName => fileName.endsWith('.mdx') || fileName.endsWith('.md')).map((fileName) => {
    const slug = fileName.replace(/\.mdx?$/, '');

    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const { data, content } = matter(fileContents);

    return {
      slug,
      content,
      ...(data as { title: string; date: string; excerpt: string }),
    };
  });

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getPostData(slug: string): Post | null {
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
  const mdPath = path.join(postsDirectory, `${slug}.md`);
  
  let fullPath;
  if (fs.existsSync(mdxPath)) {
    fullPath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    fullPath = mdPath;
  } else {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    content,
    ...(data as { title: string; date: string; excerpt: string }),
  };
}

