import Link from "next/link"

export default function SignFooter() {
  const links = [
    {href: "#", label: "PRIVACY POLICY"},
    {href: "#", label: "TERMS OF SERVICE"},
    {href: "#", label: "SYSTEM STATUS"}
  ]

  return (
    <footer className="absolute bottom-0 left-0 flex justify-between items-center w-full h-16 px-4">
      <p className="text-secondary text-sm">
        2026 PAWPALL. ALL RIGHTS RESERVED.
      </p>

      <div className="flex gap-4">
        { links.map((li,idx) => (
          <Link
            key={idx}
            className="text-gray-600 text-sm duration-200 hover:delay-150 hover:text-gray-400"
            href={li.href}
          >
            {li.label}
          </Link>
        ))}
      </div>
    </footer>
  )
}