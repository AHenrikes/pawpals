import { ProfileSocialPlatform } from "@/types/fursona";

const platformOptions: Array<{ value: ProfileSocialPlatform; label: string }> =
  [
    { value: "website", label: "Website" },
    { value: "bluesky", label: "Bluesky" },
    { value: "discord", label: "Discord" },
    { value: "instagram", label: "Instagram" },
    { value: "telegram", label: "Telegram" },
    { value: "tiktok", label: "TikTok" },
    { value: "twitch", label: "Twitch" },
    { value: "x", label: "X" },
    { value: "youtube", label: "YouTube" },
  ];

export default function usePlatformOption() {
  return platformOptions;
}
