import UnAuthHeader from "@/components/headers/Header";
import React from "react";

export default function PublicShell({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <>
      <UnAuthHeader />
      {children}
    </>
  );
}
