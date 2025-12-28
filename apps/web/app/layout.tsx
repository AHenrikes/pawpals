import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SmoothScroll } from "@/providers/SmoothScroll";
import { ThemeProvider } from "next-themes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./pawpall.css";

const defaultUrl = process.env.VERCEL_URL? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
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
                <Header />
                {children}
                <Footer />
              </ThemeProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
