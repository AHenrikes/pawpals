"use client"

import { usePosts } from "@/hooks/social/posts/usePosts";
import Image from "next/image";
import { useEffect } from "react";

export default function ProfilePost({ username }: Readonly<{ username: string }>) {
  const { posts, hasMore, fetchPosts, fetchMore } = usePosts(username)
  
  useEffect(() => { fetchPosts() }, [fetchPosts])

  return (
    <div className="grid grid-cols-4">
      {posts.map((post) => (
        <div key={post.id}>
          {post.content}
          {post.media_urls?.map((img) => (
            <div key={img} className="w-20 h-40 overflow-hidden">
              <Image
                src={img}
                alt="the post media"
                quality={100}
                height={100}
                width={400}
              />
            </div>
          ))}
        </div>
      ))}
      {hasMore && <button onClick={fetchMore}>Load more</button>}
    </div>
  )
}
