import { showToast, Toast } from "@raycast/api";
import { BabyBuddyAPI } from "../api";

export default async function ({
  childName,
  notes = "",
  startTime,
  endTime,
}: {
  childName: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
}) {
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

  // Set default times if not provided
  const now = new Date();
  const defaultStartTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

  const start = startTime || defaultStartTime.toISOString();
  const end = endTime || now.toISOString();

  // Calculate duration
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();

  // Format duration as HH:MM:SS
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  const duration = `${durationHours.toString().padStart(2, "0")}:${durationMinutes.toString().padStart(2, "0")}:${durationSeconds.toString().padStart(2, "0")}`;

  // Create the sleep entry
  const sleepData = {
    child: child.id,
    start,
    end,
    duration,
    notes,
  };

  const newSleep = await api.createSleep(sleepData);

  await showToast({
    style: Toast.Style.Success,
    title: "Sleep Created",
    message: `Recorded sleep for ${child.first_name}`,
  });

  return newSleep;
}
