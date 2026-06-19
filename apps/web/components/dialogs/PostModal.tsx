"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom";
import PostForm from "@/components/forms/PostForms"

interface PostModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PostModal({ isOpen, onClose }: Readonly<PostModalProps>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    globalThis.addEventListener("keydown", onKey)
    return () => globalThis.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          // Click backdrop to close
          onClick={onClose}
          // aria-modal so screen readers know this is a dialog
          role="dialog"
          aria-modal="true"
          aria-label="Create post"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1,    opacity: 1, y: 0 }}
            exit={{   scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            // Stop click from bubbling to the backdrop
            onClick={(e) => e.stopPropagation()}
            // Responsive: full-width on mobile, 70vw on desktop
            className="w-full h-full md:max-w-[70svw] md:h-[70svh] bg-background md:rounded-[22px]"
          >
            <PostForm onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
