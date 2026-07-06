import { PostCards } from "@/components/cards/PostCards";

export default function Dashboard() {

  return (
    <main className="flex">
      <div className="w-full border-x border-border">
        <PostCards />
      </div>
    
      <aside className="sticky top-16 flex flex-col w-[500px] h-[calc(100svh-64px)] p-4 gap-5">
        <div className="bg-muted animate-pulse w-full h-80 rounded-md" />

        <div className="bg-muted animate-pulse w-full h-full rounded-md" />
      </aside>
    </main>
  );
}
