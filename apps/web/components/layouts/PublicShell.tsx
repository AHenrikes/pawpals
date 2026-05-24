import UnAuthHeader from "@/components/navigation/Header";
import React from "react";

export default function PublicShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <UnAuthHeader />
      {children}
    </>
  );
}
