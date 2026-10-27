import type { Metadata } from "next";
import SettingsPage from "@/components/pages/settings/SettingsPage";

export const metadata: Metadata = { title: "Settings · Pawpals" };

export default function Settings() {
  return ( 
    <div className="gradientBG flex w-full flex-1 flex-col max-h-dvh pt-16 mx-auto overflow-hidden md:flex-row">
      <SettingsPage mobileNavigation />
    </div>
  );
}
