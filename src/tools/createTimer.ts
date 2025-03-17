import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI } from "../api";

export default async function ({
  childName,
  timerName,
  startTime,
}: {
  childName: string;
  timerName: string;
  startTime?: string;
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

  // Handle the startTime parameter
  let formattedStartTime: string;

  if (!startTime) {
    // If no startTime provided, use current time
    formattedStartTime = new Date().toISOString();
  } else if (startTime.includes("T") && startTime.includes("-")) {
    // If startTime is already in ISO format, use it directly
    formattedStartTime = startTime;
  } else if (startTime.includes(":")) {
    // If startTime is in HH:MM:SS or HH:MM format, convert to ISO
    const today = new Date();
    const [hours, minutes, seconds = "00"] = startTime.split(":").map((part) => part.trim());

    today.setHours(parseInt(hours, 10));
    today.setMinutes(parseInt(minutes, 10));
    today.setSeconds(parseInt(seconds, 10));
    today.setMilliseconds(0);

    formattedStartTime = today.toISOString();
  } else {
    // Default to current time if format is unrecognized
    formattedStartTime = new Date().toISOString();
  }

  try {
    // Create the timer
    const newTimer = await api.createTimer(child.id, timerName, formattedStartTime);

    await showToast({
      style: Toast.Style.Success,
      title: "Timer Started",
      message: `Started ${timerName} timer for ${child.first_name}`,
    });

    return newTimer;
  } catch (error) {
    console.error("Failed to create timer:", error);

    let errorMessage = "Failed to create timer";
    if (axios.isAxiosError(error) && error.response) {
      errorMessage += `: ${JSON.stringify(error.response.data)}`;
      console.error("API error response:", error.response.data);
    }

    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: errorMessage,
    });

    throw error;
  }
}
