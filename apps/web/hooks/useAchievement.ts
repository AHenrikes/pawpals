import { ProfileAchievement } from "@/types/fursona";

const achievements: Array<{
  id: ProfileAchievement;
  name: string;
  description: string;
  symbol: string;
}> = [
  {
    id: "early_paw",
    name: "Early Paw",
    description: "Joined Pawpals during its early days.",
    symbol: "🐾",
  },
  {
    id: "community_builder",
    name: "Community Builder",
    description: "Helped a community grow and thrive.",
    symbol: "🏕️",
  },
  {
    id: "event_explorer",
    name: "Event Explorer",
    description: "Took part in community events.",
    symbol: "🧭",
  },
  {
    id: "trusted_pal",
    name: "Trusted Pal",
    description: "Built a positive reputation on Pawpals.",
    symbol: "✨",
  },
];

export default function useAchievement() {
  return achievements;
}
