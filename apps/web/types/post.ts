export type PostType = {
  title: string;
  content: string;
  media_urls?: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  bookmarks_count: number;
  shares_count: number;
  is_published: boolean;
  created_at: Date;
}

export type PostCreate = {
  fursona_id: string;
  content: string;
  media_urls?: string[];
  is_published: boolean;
}

export type PostWithId = PostType & {
  id: string;
  fursona_id: string;
  updated_at: Date;
}
