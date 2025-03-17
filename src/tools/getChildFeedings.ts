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
    const lastFeeding = await api.getLastFeeding(child.id);
    return lastFeeding;
  } else if (timeframe === "recent") {
    const recentFeedings = await api.getRecentFeedings(child.id);
    return recentFeedings;
  } else {
    // Default to today
    const todayFeedings = await api.getTodayFeedings(child.id);

    // Calculate total amount
    const totalAmount = todayFeedings.reduce((sum, feeding) => {
      return sum + (feeding.amount || 0);
    }, 0);

    return {
      feedings: todayFeedings,
      totalAmount,
      count: todayFeedings.length,
    };
  }
}
