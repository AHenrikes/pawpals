import { ReturnHeaderProvider } from "@/components/navigations/ReturnHeaderProvider";
import { type Metadata } from "next";
import ReturnHeader from "@/components/navigations/ReturnHeader";

export const metadata: Metadata = { title: "Dashboard" };

export default function ReturnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReturnHeaderProvider>
      <ReturnHeader />

      {children}
    </ReturnHeaderProvider>
  );
}
