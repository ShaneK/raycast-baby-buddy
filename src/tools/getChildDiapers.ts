import { BabyBuddyAPI } from "../api";

export default async function ({ childName, timeframe = "today" }: { childName: string; timeframe?: string }) {
  const api = new BabyBuddyAPI();
  const children = await api.getChildren();

  // More flexible child name matching
  const child = children.find(
    (c) =>
      c.first_name.toLowerCase() === childName.toLowerCase() ||
      c.first_name.toLowerCase().includes(childName.toLowerCase()) ||
      `${c.first_name} ${c.last_name}`.toLowerCase() === childName.toLowerCase() ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(childName.toLowerCase()),
  );

  if (!child) {
    throw new Error(`Child with name ${childName} not found`);
  }

  if (timeframe === "last") {
    const lastDiaper = await api.getLastDiaper(child.id);
    return lastDiaper;
  } else if (timeframe === "recent") {
    const recentDiapers = await api.getRecentDiapers(child.id);
    return recentDiapers;
  } else {
    // Default to today
    const todayDiapers = await api.getTodayDiapers(child.id);

    // Count wet and solid diapers
    const wetCount = todayDiapers.filter((d) => d.wet).length;
    const solidCount = todayDiapers.filter((d) => d.solid).length;

    return {
      diapers: todayDiapers,
      count: todayDiapers.length,
      wetCount,
      solidCount,
    };
  }
}
