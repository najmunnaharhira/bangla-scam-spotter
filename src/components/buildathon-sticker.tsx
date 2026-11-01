const STICKER_SRC = "/aignite-sticker.png";
const STICKER_ALT = "Built For Ostad Presents YUNet AIgnite Buildathon 2026";
const DEVPOST_URL = "https://yunet-aignite26.devpost.com/";

/**
 * Official buildathon sticker. Must stay visible in the navbar on every page,
 * desktop and mobile. The image is used exactly as provided (no crop, no
 * recolor) on a white rounded background so it stays readable in dark mode.
 * It is served from /public so it works on any host, not only Lovable.
 */
export function BuildathonSticker({ className }: { className?: string }) {
  return (
    <a
      href={DEVPOST_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="YUNet AIgnite Buildathon 2026 on Devpost (opens in a new tab)"
      className={
        className ??
        "inline-flex shrink-0 items-center rounded-lg bg-white p-[3px] ring-1 ring-border shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      }
    >
      {/* 36px tall on mobile, 44px on desktop; width follows the 372x132 aspect ratio. */}
      <img
        src={STICKER_SRC}
        alt={STICKER_ALT}
        width={372}
        height={132}
        className="h-9 w-auto md:h-11"
      />
    </a>
  );
}
