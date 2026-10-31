import stickerPointer from "@/assets/aignite-sticker.png.asset.json";

const STICKER_ALT = "Built For Ostad Presents YUNet AIgnite Buildathon 2026";
const DEVPOST_URL = "https://yunet-aignite26.devpost.com/";

/**
 * Official buildathon sticker. Must stay visible in the navbar on every page,
 * desktop and mobile. The image is used exactly as provided (no crop, no
 * recolor) on a white rounded background so it stays readable in dark mode.
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
        "inline-flex shrink-0 items-center rounded-lg bg-card p-[3px] ring-1 ring-border shadow-sm transition-shadow hover:shadow-md"
      }
    >
      <img
        src={stickerPointer.url}
        alt={STICKER_ALT}
        width={123}
        height={34}
        className="h-[34px] w-auto md:h-11 md:width-auto"
        style={{ height: undefined }}
        // 34px on mobile, 44px on desktop; width scales with the aspect ratio.
      />
    </a>
  );
}
