import { Suspense } from "react";
import MessagesPage from "@/components/pages/messages/MessagesPage";

export const metadata = { title: "Conversation · Pawpals" };

export default async function ConversationPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="pt-20 text-center text-text-muted">
          Loading conversation…
        </div>
      }
    >
      <MessagesPage conversationId={id} standalone />
    </Suspense>
  );
}
