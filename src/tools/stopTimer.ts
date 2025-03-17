import { showToast, Toast, Tool } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI } from "../api";

/**
 * Deletes a timer for the specified child by the timer name
 */
export default async function ({ childName, timerName }: { childName: string; timerName?: string }) {
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
    console.error(`Child with name "${childName}" not found in children list`);
    throw new Error(`Child with name ${childName} not found`);
  }

  // Get active timers for the child
  const activeTimers = await api.getActiveTimers();
  const childTimers = activeTimers.filter((timer) => timer.child === child.id);
  if (childTimers.length === 0) {
    throw new Error(`No active timers found for ${childName}`);
  }

  let timerToDelete;
  if (timerName) {
    // Find the specific timer by name
    timerToDelete = childTimers.find((timer) => timer.name.toLowerCase() === timerName.toLowerCase());

    if (!timerToDelete) {
      console.error(`No active timer with name "${timerName}" found for ${childName}`);
      throw new Error(`No active ${timerName} timer found for ${childName}`);
    }
  } else {
    // If no timer name specified, delete the most recent timer
    timerToDelete = childTimers[0];
  }

  try {
    // Delete the timer
    await api.deleteTimer(timerToDelete.id);

    // Verify the timer was deleted
    await showToast({
      style: Toast.Style.Success,
      title: "Timer Deleted",
      message: `Deleted ${timerToDelete.name} timer for ${child.first_name}`,
    });

    return {
      success: true,
      message: `Deleted ${timerToDelete.name} timer for ${child.first_name}`,
      timerName: timerToDelete.name,
      childName: child.first_name,
    };
  } catch (error: unknown) {
    console.error(`Error deleting timer:`, error);

    // Check if the error is related to the API call
    if (axios.isAxiosError(error) && error.response) {
      console.error(`API Error Status: ${error.response.status}`);
      console.error(`API Error Data:`, error.response.data);
    }

    throw new Error(`Failed to delete timer. Please try again.`);
  }
}

/**
 * Confirmation function for the stopTimer tool
 * This will be called before the tool is executed to confirm the destructive action
 */
export const confirmation: Tool.Confirmation<{ childName: string; timerName?: string }> = async (input) => {
  const { childName, timerName } = input;

  return {
    message: timerName
      ? `Are you sure you want to delete the "${timerName}" timer for ${childName}?`
      : `Are you sure you want to delete the most recent timer for ${childName}?`,
  };
};
