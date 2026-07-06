"use client";

import { useEffect, useReducer, useRef, useCallback } from "react";
import { uploadPostMedia } from "@/lib/uploads/postMedia";
import { api } from "@/lib/api/api-client";
import { MediaItem } from "@/types/post";

export const POST_MAX_MEDIA = 4;
export const POST_MAX_CHARS = 2200;
export const POST_WARN_CHARS = 1800;
export const POST_DANGER_CHARS = 2100;

export type Visibility =
  | "everyone"
  | "verified"
  | "followers"
  | "mutuals"
  | "mentioned";

interface PostState {
  content: string;
  mediaPreviews: MediaItem[];
  postMedia: File[];
  isNSFW: boolean;
  visibility: Visibility;
  loading: boolean;
}

type PostAction =
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_VISIBILITY"; payload: Visibility }
  | { type: "TOGGLE_NSFW" }
  | { type: "ADD_MEDIA"; previews: MediaItem[]; files: File[] }
  | { type: "REMOVE_MEDIA"; index: number }
  | { type: "CLEAR_ALL" }
  | { type: "SET_LOADING"; payload: boolean };

function postReducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case "SET_CONTENT":
      return { ...state, content: action.payload };
    case "SET_VISIBILITY":
      return { ...state, visibility: action.payload };
    case "TOGGLE_NSFW":
      return { ...state, isNSFW: !state.isNSFW };

    case "ADD_MEDIA": {
      const slots = POST_MAX_MEDIA - state.mediaPreviews.length;
      return {
        ...state,
        mediaPreviews: [
          ...state.mediaPreviews,
          ...action.previews.slice(0, slots),
        ],
        postMedia: [...state.postMedia, ...action.files.slice(0, slots)],
      };
    }

    case "REMOVE_MEDIA":
      return {
        ...state,
        mediaPreviews: state.mediaPreviews.filter((_, i) => i !== action.index),
        postMedia: state.postMedia.filter((_, i) => i !== action.index),
      };

    case "CLEAR_ALL":
      return { ...state, mediaPreviews: [], postMedia: [] };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

const initialState: PostState = {
  content: "",
  mediaPreviews: [],
  postMedia: [],
  isNSFW: false,
  visibility: "everyone",
  loading: false,
};

// ─── Dimension readers ────────────────────────────────────────────────────────
function readImageDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new globalThis.Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = url;
  });
}

function readVideoDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.onloadedmetadata = () =>
      resolve({ width: video.videoWidth, height: video.videoHeight });
    video.onerror = () => resolve({ width: 16, height: 9 });
    video.src = url;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePostForm(onClose: () => void) {
  const [state, dispatch] = useReducer(postReducer, initialState);
  const mediaRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<MediaItem[]>([]);
  previewsRef.current = state.mediaPreviews;

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  const addMedia = useCallback(
    async (newFiles: File[]) => {
      const slots = POST_MAX_MEDIA - state.mediaPreviews.length;
      if (slots <= 0) return;
      const toAdd = newFiles.slice(0, slots);

      const previews: MediaItem[] = await Promise.all(
        toAdd.map(async (file) => {
          const isVideo = file.type.startsWith("video/");
          const url = URL.createObjectURL(file);
          const dims = isVideo
            ? await readVideoDimensions(url)
            : await readImageDimensions(url);
          return {
            url,
            ...dims,
            type: isVideo ? "video" : "image",
          };
        }),
      );

      dispatch({ type: "ADD_MEDIA", previews, files: toAdd });
    },
    [state.mediaPreviews.length],
  );

  const removeMedia = useCallback(
    (index: number) => {
      const preview = state.mediaPreviews[index];
      if (preview) URL.revokeObjectURL(preview.url);
      dispatch({ type: "REMOVE_MEDIA", index });
    },
    [state.mediaPreviews],
  );

  const clearAll = useCallback(() => {
    state.mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    dispatch({ type: "CLEAR_ALL" });
  }, [state.mediaPreviews]);

  const handleSubmit = useCallback(
    async (accountId: string, fursonaId: string) => {
      if (!state.content.trim() && state.postMedia.length === 0) return;
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const mediaItems = await Promise.all(
          state.postMedia.map((file) =>
            uploadPostMedia(file, accountId, fursonaId),
          ),
        );

        await api.post(`/api/core/fursonas/${fursonaId}/posts`, {
          fursona_id: fursonaId,
          content: state.content,
          media_urls: mediaItems,
          is_published: true,
        });

        clearAll();
        onClose();
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state, clearAll, onClose],
  );

  return {
    content: state.content,
    mediaPreviews: state.mediaPreviews,
    postMedia: state.postMedia,
    isNSFW: state.isNSFW,
    visibility: state.visibility,
    loading: state.loading,
    setContent: (v: string) => dispatch({ type: "SET_CONTENT", payload: v }),
    setVisibility: (v: Visibility) =>
      dispatch({ type: "SET_VISIBILITY", payload: v }),
    toggleNSFW: () => dispatch({ type: "TOGGLE_NSFW" }),
    mediaRef,
    addMedia,
    removeMedia,
    clearAll,
    handleSubmit,
  };
}
