// import { createServer } from "@repo/supabase/server";

// interface CreatePostInput {
//   fursonaId: string;
//   content: string;
//   mediaUrls: string[];
//   // isNSFW: boolean;
//   // visibility: string;
// }

// export async function createPost(input: CreatePostInput) {
//   const supabase = await createServer();

//   const { data, error } = await supabase
//     .schema("social")
//     .from("posts")
//     .insert({
//       fursona_id: input.fursonaId,
//       content: input.content,
//       media_urls: input.mediaUrls,
//       is_published: true,
//     })
//     .select("id")
//     .single();

//   if (error) throw error;
//   return data;
// }
