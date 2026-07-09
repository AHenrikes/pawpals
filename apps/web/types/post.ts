export interface MediaItem {
  url: string;
  width: number;
  height: number;
  type: "image" | "video";
}

export type PostType = {
  id: string;
  fursona_id: string;
  title: string;
  content?: string;
  media_urls?: MediaItem[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  bookmarks_count: number;
  shares_count: number;
  is_published: boolean;
  created_at: Date;
};

export type PostCreate = {
  fursona_id: string;
  content?: string;
  media_urls?: MediaItem[];
  is_published: boolean;
};

export type PostWithDetail = PostType & {
  updated_at: Date;
};
