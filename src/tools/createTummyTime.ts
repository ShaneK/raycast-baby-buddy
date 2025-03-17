import { showToast, Toast } from "@raycast/api";
import { BabyBuddyAPI } from "../api";

export default async function ({
  childName,
  milestone = "",
  startTime,
  endTime,
}: {
  childName: string;
  milestone?: string;
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
  const defaultStartTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

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

  // Create the tummy time entry
  const tummyTimeData = {
    child: child.id,
    start,
    end,
    duration,
    milestone,
  };

  const newTummyTime = await api.createTummyTime(tummyTimeData);

  await showToast({
    style: Toast.Style.Success,
    title: "Tummy Time Created",
    message: `Recorded tummy time for ${child.first_name}`,
  });

  return newTummyTime;
}
