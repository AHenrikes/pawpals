import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { TypographyP } from "@repo/ui/typography";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
      <TypographyP>
        Powered by{" "}
        <Link
          href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Supabase
        </Link>
      </TypographyP>
      <ThemeSwitcher />
    </footer>
  );
}
