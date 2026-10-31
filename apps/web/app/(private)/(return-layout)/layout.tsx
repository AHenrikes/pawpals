import { ReturnHeaderProvider } from "@/components/navigations/ReturnHeaderProvider";
import { type Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function ReturnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReturnHeaderProvider>
      {children}
    </ReturnHeaderProvider>
  );
}
