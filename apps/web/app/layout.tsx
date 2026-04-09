import type { Metadata } from "next";
import { Be_Vietnam_Pro, Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SmoothScroll } from "@/lib/SmoothScroll";
import "./pawpal.css";

const defaultUrl = process.env.VERCEL_URL? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Pawpal",
  description: "A social app built for furry communities",
};

const displayFont = Manrope({
  variable: "--font-display",
  display: "swap",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const bodyFont = Be_Vietnam_Pro({
  variable: "--font-body",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
          <div id="smooth-wrapper">
            <div id="smooth-content">
              <SmoothScroll />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </div>
          </div>
      </body>
    </html>
  );
}
