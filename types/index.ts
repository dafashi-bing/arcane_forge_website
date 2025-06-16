export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string;
  screenshot_url: string;
  game_url: string;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  id: string;
  game_slug: string;
  plays: number;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  game_slug: string;
  parent_id: string | null;
  name: string;
  text: string;
  created_at: string;
}

export interface FeedbackRequest {
  id: string;
  game_slug: string;
  message: string;
  email: string | null;
  want_notify: boolean;
  created_at: string;
}

export interface GameWithStats extends Game {
  stats: Stats;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface CreateCommentRequest {
  parent_id?: string;
  name: string;
  text: string;
}

export interface CreateFeedbackRequest {
  message: string;
  email?: string;
  want_notify?: boolean;
}

export interface CreateGameRequest {
  slug?: string;
  title: string;
  description: string;
  icon_url: string;
  screenshot_url: string;
  game_url: string;
} 