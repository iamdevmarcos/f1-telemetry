"use client";

import Link from "next/link";

type Mode = "replay" | "compare" | "news";

function ModeLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="select-control !w-auto cursor-pointer px-4 font-[family-name:var(--font-teko)] text-xl uppercase tracking-wide"
      style={
        active
          ? {
              borderColor: "var(--accent)",
              background: "var(--accent)",
              color: "white",
            }
          : undefined
      }
    >
      {label}
    </Link>
  );
}

export function ModeNav({ active }: { active: Mode }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      <ModeLink href="/" label="Race replay" active={active === "replay"} />
      <ModeLink
        href="/?mode=compare"
        label="Compare lap"
        active={active === "compare"}
      />
      <ModeLink href="/news" label="News" active={active === "news"} />
    </div>
  );
}
