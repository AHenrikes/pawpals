import type { Metadata } from "next";
import SettingsPage from "@/components/pages/settings/SettingsPage";
import ReturnHeader from "@/components/navigations/ReturnHeader";

export const metadata: Metadata = { title: "Settings · Pawpals" };

export default function Settings() {
  return (
    <>
      <ReturnHeader />
      <div className="flex h-dvh flex-col overflow-hidden bg-background pt-16 md:flex-row">
        <SettingsPage mobileNavigation />
      </div>
    </>
  );
}
