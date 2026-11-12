import { ReturnHeaderProvider } from "@/components/navigations/ReturnHeaderProvider";
import { HeaderSearchProvider } from "@/components/navigations/HeaderSearchProvider";
import { type Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function ReturnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <HeaderSearchProvider>
      <ReturnHeaderProvider>{children}</ReturnHeaderProvider>
    </HeaderSearchProvider>
  );
}
