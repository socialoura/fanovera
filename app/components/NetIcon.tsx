import type { NetworkId } from "../lib/networks";

type Props = { kind: NetworkId; color: string; size?: number };

export default function NetIcon({ kind, color, size = 26 }: Props) {
  const s = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "instagram":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="5" {...s} />
          <circle cx="12" cy="12" r="4" {...s} />
          <circle cx="17.5" cy="6.5" r="1.1" fill={color} />
        </svg>
      );
    case "tiktok":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" {...s} />
          <path d="M14 4c0 2.5 2 4.5 4.5 4.5" {...s} />
        </svg>
      );
    case "youtube":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x="2.5" y="6" width="19" height="12" rx="3" {...s} />
          <path d="M10 9.5v5l4.5-2.5z" fill={color} />
        </svg>
      );
    case "spotify":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" {...s} />
          <path d="M7.5 10c3-1 7-1 9.5 1M8 13c2.5-.8 5-.5 7 1M9 16c1.8-.5 3.5-.3 5 .8" {...s} />
        </svg>
      );
    case "twitter":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M5 5l14 14M19 5L5 19" {...s} />
        </svg>
      );
    case "facebook":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" {...s} />
          <path
            d="M13.5 21V13h2.5l.5-3h-3V8.2c0-.9.3-1.5 1.6-1.5H17V4.1c-.3 0-1.4-.1-2.5-.1-2.5 0-4 1.4-4 4v2H8v3h2.5v8"
            {...s}
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="3" {...s} />
          <circle cx="7.5" cy="8" r="1.1" fill={color} />
          <path
            d="M7 11v6M11 11v6M11 13.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5V17"
            {...s}
          />
        </svg>
      );
    case "twitch":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M5 4h14v10l-4 4h-3l-3 3v-3H5z" {...s} />
          <path d="M11 8v4M15 8v4" {...s} />
        </svg>
      );
  }
}
