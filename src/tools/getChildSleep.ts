import { BabyBuddyAPI } from "../api";

/**
 * Get the sleep data for a child
 *
 *
 */
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
    const lastSleep = await api.getLastSleep(child.id);
    return lastSleep;
  } else if (timeframe === "recent") {
    const recentSleep = await api.getRecentSleep(child.id);
    return recentSleep;
  } else {
    // Default to today
    const todaySleep = await api.getTodaySleep(child.id);

    // Calculate total sleep duration in minutes
    const totalMinutes = todaySleep.reduce((sum, sleep) => {
      const [hours, minutes] = sleep.duration.split(":").map(Number);
      return sum + (hours * 60 + minutes);
    }, 0);

    // Format total duration
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const formattedDuration = totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`;

    // Check if child is currently asleep
    const isCurrentlyAsleep = todaySleep.some((sleep) => {
      const endTime = new Date(sleep.end);
      const now = new Date();
      return endTime > now;
    });

    return {
      sleepEntries: todaySleep,
      totalDuration: formattedDuration,
      totalMinutes,
      count: todaySleep.length,
      isCurrentlyAsleep,
    };
  }
}
