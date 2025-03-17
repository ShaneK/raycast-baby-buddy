import { BabyBuddyAPI, FeedingEntry } from "../api";

type GetFeedingsInput = {
  /**
   * The name of the child to get feedings for
   */
  childName: string;
  /**
   * Number of feedings to retrieve (default: 10)
   */
  limit?: number;
  /**
   * Whether to return only today's feedings (default: false)
   */
  todayOnly?: boolean;
};

export default async function getFeedings({
  childName,
  limit = 10,
  todayOnly = false,
}: GetFeedingsInput): Promise<(FeedingEntry & { childName: string })[]> {
  console.log(`getFeedings tool called with: childName=${childName}, limit=${limit}, todayOnly=${todayOnly}`);
  
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
  
  console.log(`Found child: ${child.first_name} ${child.last_name} (ID: ${child.id})`);
  
  let feedings: FeedingEntry[];
  
  if (todayOnly) {
    feedings = await api.getTodayFeedings(child.id);
  } else {
    // Get recent feedings
    feedings = await api.getRecentFeedings(child.id, limit);
  }
  
  // Add child name to each feeding
  const enhancedFeedings = feedings.map(feeding => ({
    ...feeding,
    childName: `${child.first_name} ${child.last_name}`
  }));
  
  console.log(`Retrieved ${enhancedFeedings.length} feedings`);
  
  return enhancedFeedings;
} 