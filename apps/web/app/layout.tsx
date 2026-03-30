import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SmoothScroll } from "@/providers/SmoothScroll";
import HeaderSwitcher from "@/lib/headerSwitch";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import "./pawpal.css";

const defaultUrl = process.env.VERCEL_URL? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Pawpal",
  description: "A social app built for furry communities",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
          <div id="smooth-wrapper">
            <div id="smooth-content">
              <SmoothScroll />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <Suspense fallback={null}>
                  <HeaderSwitcher />
                </Suspense>
                {children}
                <Footer />
              </ThemeProvider>
            </div>
          </div>
      </body>
    </html>
  );
}
