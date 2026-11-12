import { Suspense } from "react";
import MessagesPage from "@/components/pages/messages/MessagesPage";

export const metadata = { title: "Messages" };

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-8 text-text-muted">Loading messages…</div>}
    >
      <MessagesPage />
    </Suspense>
  );
}
