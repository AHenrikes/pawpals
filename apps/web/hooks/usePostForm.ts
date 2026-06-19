"use client"

import { useEffect, useReducer, useRef, useCallback } from "react"

// ─── Constants ────────────────────────────────────────────────────────────────
export const POST_MAX_MEDIA   = 5
export const POST_MAX_CHARS   = 2200
export const POST_WARN_CHARS  = 1800
export const POST_DANGER_CHARS = 2100

// ─── Types ────────────────────────────────────────────────────────────────────
export type Visibility = "everyone" | "verified" | "followers" | "mutuals" | "mentioned"

interface PostState {
  content: string
  mediaPreviews: string[]
  postMedia: File[]
  isNSFW: boolean
  visibility: Visibility
  loading: boolean
}

type PostAction =
  | { type: "SET_CONTENT";    payload: string }
  | { type: "SET_VISIBILITY"; payload: Visibility }
  | { type: "TOGGLE_NSFW" }
  | { type: "ADD_MEDIA";      previews: string[]; files: File[] }
  | { type: "REMOVE_MEDIA";   index: number }
  | { type: "CLEAR_ALL" }
  | { type: "SET_LOADING";    payload: boolean }

// ─── Reducer ──────────────────────────────────────────────────────────────────
function postReducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case "SET_CONTENT":
      return { ...state, content: action.payload }

    case "SET_VISIBILITY":
      return { ...state, visibility: action.payload }

    case "TOGGLE_NSFW":
      return { ...state, isNSFW: !state.isNSFW }

    case "ADD_MEDIA": {
      const slots = POST_MAX_MEDIA - state.mediaPreviews.length
      return {
        ...state,
        mediaPreviews: [...state.mediaPreviews, ...action.previews.slice(0, slots)],
        postMedia:     [...state.postMedia,     ...action.files.slice(0, slots)],
      }
    }

    case "REMOVE_MEDIA":
      return {
        ...state,
        mediaPreviews: state.mediaPreviews.filter((_, i) => i !== action.index),
        postMedia:     state.postMedia.filter((_, i) => i !== action.index),
      }

    case "CLEAR_ALL":
      return { ...state, mediaPreviews: [], postMedia: [] }

    case "SET_LOADING":
      return { ...state, loading: action.payload }

    default:
      return state
  }
}

const initialState: PostState = {
  content: "",
  mediaPreviews: [],
  postMedia: [],
  isNSFW: false,
  visibility: "everyone",
  loading: false,
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePostForm(onClose: () => void) {
  const [state, dispatch] = useReducer(postReducer, initialState)
  const mediaRef          = useRef<HTMLInputElement>(null)
  // Keep a ref to previews so the unmount cleanup always sees the latest list
  const previewsRef       = useRef<string[]>([])
  previewsRef.current     = state.mediaPreviews

  // Revoke all blob URLs on unmount
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const addMedia = useCallback(
    (newFiles: File[]) => {
      const slots = POST_MAX_MEDIA - state.mediaPreviews.length
      if (slots <= 0) return
      const toAdd    = newFiles.slice(0, slots)
      const previews = toAdd.map((f) => URL.createObjectURL(f))
      dispatch({ type: "ADD_MEDIA", previews, files: toAdd })
    },
    [state.mediaPreviews.length],
  )

  const removeMedia = useCallback(
    (index: number) => {
      const url = state.mediaPreviews[index]
      if (url) URL.revokeObjectURL(url)
      dispatch({ type: "REMOVE_MEDIA", index })
    },
    [state.mediaPreviews],
  )

  const clearAll = useCallback(() => {
    state.mediaPreviews.forEach((url) => URL.revokeObjectURL(url))
    dispatch({ type: "CLEAR_ALL" })
  }, [state.mediaPreviews])

  const handleSubmit = useCallback(async () => {
    if (!state.content.trim() && state.postMedia.length === 0) return
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const formData = new FormData()
      formData.append("content",  state.content)
      formData.append("isNSFW",   String(state.isNSFW))
      formData.append("visibility", state.visibility)
      state.postMedia.forEach((f) => formData.append("media", f))

      // TODO: replace with your actual API call
      // await yourApiCall(formData)
      console.log("Submitting post:", {
        content:    state.content,
        isNSFW:     state.isNSFW,
        visibility: state.visibility,
        files:      state.postMedia.length,
      })

      clearAll()
      onClose()
    } catch (err) {
      console.error("Post failed:", err)
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state, clearAll, onClose])

  return {
    // State
    content:       state.content,
    mediaPreviews: state.mediaPreviews,
    postMedia:     state.postMedia,
    isNSFW:        state.isNSFW,
    visibility:    state.visibility,
    loading:       state.loading,
    // Dispatchers
    setContent:    (v: string)     => dispatch({ type: "SET_CONTENT",    payload: v }),
    setVisibility: (v: Visibility) => dispatch({ type: "SET_VISIBILITY", payload: v }),
    toggleNSFW:    ()              => dispatch({ type: "TOGGLE_NSFW" }),
    // Actions
    mediaRef,
    addMedia,
    removeMedia,
    clearAll,
    handleSubmit,
  }
}
