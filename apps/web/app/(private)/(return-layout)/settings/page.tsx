import type { Metadata } from "next";
import SettingsPage from "@/components/pages/settings/SettingsPage";

export const metadata: Metadata = { title: "Settings · Pawpals" };

export default function Settings() {
  return (
    <main className="gradientBG min-h-dvh pt-16">
      <SettingsPage />
    </main>
  );
}
