export type PostTypeValue = "yap" | "reel" | "gallery";
export type PostMediaType = "image" | "gif" | "video";
export type PostVisibility =
  "everyone" | "followers" | "mutuals" | "private" | "archived";

export interface MediaItem {
  id?: string;
  // type?: "image" | "gif" | "video";
  media_type?: PostMediaType;
  poster_url?: string | null;
  url: string;
  width?: number;
  height?: number;
  duration_seconds?: number | null;
  file_size_bytes?: number | null;
  order_index?: number;
}

export type PostType = {
  id: string;
  fursona_id: string;
  post_type: PostTypeValue;
  content?: string | null;
  // media_urls?: MediaItem["url"];
  media_urls?: MediaItem[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  bookmarks_count: number;
  visibility: PostVisibility;
  created_at: string;
  updated_at?: string;
};

export type PostCreate = {
  fursona_id?: string;
  post_type?: PostTypeValue;
  content?: string;
  media_urls?: MediaItem["url"];
  media?: MediaItem[];
  visibility?: PostVisibility;
};
