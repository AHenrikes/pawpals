// export type PostMediaType = "image" | "gif" | "video";

// export interface MediaItem {
//   id?: string;
//   url: string;
//   width?: number;
//   height?: number;
//   // type?: "image" | "gif" | "video";
//   media_type?: PostMediaType;
//   poster_url?: string | null;
//   duration_seconds?: number | null;
//   file_size_bytes?: number | null;
//   order_index?: number;
// }

// export type GalleryType = {
//   id: string;
//   fursona_id: string;
//   content?: string | null;
//   media_urls: MediaItem[];
//   likes_count: number;
//   comments_count: number;
//   views_count: number;
//   shares_count: number;
//   is_private?: boolean;
//   created_at: Date;
// };

// export type GalleryCreate = {
//   fursona_id: string;
//   content?: string;
//   media_urls: MediaItem[];
//   is_private: boolean;
// };

// export type PostWithDetail = GalleryType & {
//   updated_at: Date;
// };
