"use client";

import { useState } from "react";

export function NewsShareButtons({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  function resolveUrl(): string {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (typeof window === "undefined") {
      return url;
    }
    return new URL(url, window.location.origin).toString();
  }

  async function handleShare(): Promise<void> {
    const absoluteUrl = resolveUrl();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url: absoluteUrl, text: title });
        return;
      } catch {
        // Fall through to copy.
      }
    }

    await handleCopy();
  }

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(resolveUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          void handleShare();
        }}
        className="select-control !w-auto cursor-pointer px-4 text-xs uppercase tracking-[0.14em]"
      >
        Share
      </button>
      <button
        type="button"
        onClick={() => {
          void handleCopy();
        }}
        className="select-control !w-auto cursor-pointer px-4 text-xs uppercase tracking-[0.14em]"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
