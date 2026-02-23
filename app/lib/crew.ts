export const CREW = [
  { id: "ian", name: "Ian", emoji: "🧠", color: "green" },
  { id: "tyler", name: "Tyler", emoji: "💪", color: "blue" },
  { id: "james", name: "James", emoji: "👑", color: "purple" },
] as const;

export type CrewMember = (typeof CREW)[number];
export type CrewId = CrewMember["id"];

export function getCrewMember(id: string): CrewMember | undefined {
  return CREW.find((m) => m.id === id);
}

export const CREW_COLORS: Record<CrewId, string> = {
  ian: "#22c55e",    // green-500
  tyler: "#3b82f6",  // blue-500
  james: "#a855f7",  // purple-500
};
