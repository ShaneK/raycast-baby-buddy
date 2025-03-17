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
    const lastTummyTime = await api.getLastTummyTime(child.id);
    return lastTummyTime;
  } else if (timeframe === "recent") {
    const recentTummyTime = await api.getRecentTummyTime(child.id);
    return recentTummyTime;
  } else {
    // Default to today
    const todayTummyTime = await api.getTodayTummyTime(child.id);

    // Calculate total tummy time duration in minutes
    const totalMinutes = todayTummyTime.reduce((sum, entry) => {
      const [hours, minutes] = entry.duration.split(":").map(Number);
      return sum + (hours * 60 + minutes);
    }, 0);

    // Format total duration
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const formattedDuration = totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`;

    return {
      tummyTimeEntries: todayTummyTime,
      totalDuration: formattedDuration,
      totalMinutes,
      count: todayTummyTime.length,
    };
  }
}
