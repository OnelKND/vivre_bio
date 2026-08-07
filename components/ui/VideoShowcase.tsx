import { getVideoAsset, VIDEO_SLOTS, type VideoSlot } from "@/lib/media";

interface VideoShowcaseProps {
  slot: VideoSlot;
  aspect?: "video" | "square";
  caption?: boolean;
}

export default function VideoShowcase({
  slot,
  aspect = "video",
  caption = true,
}: VideoShowcaseProps) {
  const { title, caption: defaultCaption } = VIDEO_SLOTS[slot];
  const { src } = getVideoAsset(slot);
  const aspectClass = aspect === "video" ? "aspect-video" : "aspect-square";

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`group relative ${aspectClass} w-full overflow-hidden rounded-box bg-base-200`}
      >
        {src ? (
          <video
            controls
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed border-base-300 text-base-content/50">
            <i
              className="fa-solid fa-circle-play text-3xl transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            />
            <span className="text-sm font-medium">Vidéo à venir : {title}</span>
          </div>
        )}
      </div>
      {caption && (
        <p className="text-sm text-base-content/70 text-center">{defaultCaption}</p>
      )}
    </div>
  );
}
