import type { Metadata } from "next";
import SettingsPage from "@/components/pages/settings/SettingsPage";
import ReturnHeader from "@/components/navigations/ReturnHeader";

export const metadata: Metadata = { title: "Settings · Pawpals" };

export default function Settings() {
  return (
    <>
      <ReturnHeader />
      <div className="gradientBG flex flex-col h-dvh pt-16 mx-auto overflow-hidden md:flex-row">
        <SettingsPage mobileNavigation />
      </div>
    </>
  );
}
