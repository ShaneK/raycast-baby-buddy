import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI, SleepEntry } from "../api";
import { calculateDuration, findChildByName, formatTimeToISO } from "../utils/normalizers";

type EditSleepInput = {
  /**
   * The ID of the sleep entry to edit
   */
  sleepId: number;
  /**
   * The name of the child this sleep is for
   */
  childName?: string;
  /**
   * Whether this is a nap (true) or night sleep (false)
   */
  isNap?: boolean;
  /**
   * Notes about the sleep
   */
  notes?: string;
  /**
   * Start time for the sleep (ISO string or HH:MM:SS format)
   */
  startTime?: string;
  /**
   * End time for the sleep (ISO string or HH:MM:SS format)
   */
  endTime?: string;
};

export default async function editSleep({
  sleepId,
  childName,
  isNap,
  notes,
  startTime,
  endTime,
}: EditSleepInput) {
  const api = new BabyBuddyAPI();
  
  let childId: number | undefined;
  
  // If childName is provided, look up the child ID
  if (childName) {
    const children = await api.getChildren();
    const child = findChildByName(children, childName);
    
    if (!child) {
      throw new Error(`Child with name ${childName} not found`);
    }
    
    childId = child.id;
  }
  
  // Format times to ISO using utility function
  const formattedStartTime = formatTimeToISO(startTime);
  const formattedEndTime = formatTimeToISO(endTime);
  
  // Calculate duration if both start and end times are provided
  let duration: string | undefined;
  if (formattedStartTime && formattedEndTime) {
    duration = calculateDuration(formattedStartTime, formattedEndTime);
  }
  
  // Build the update data
  const updateData: Partial<SleepEntry> = {};
  
  if (childId !== undefined) updateData.child = childId;
  if (formattedStartTime !== undefined) updateData.start = formattedStartTime;
  if (formattedEndTime !== undefined) updateData.end = formattedEndTime;
  if (duration !== undefined) updateData.duration = duration;
  if (isNap !== undefined) updateData.nap = isNap;
  if (notes !== undefined) updateData.notes = notes;
  
  // Only proceed if there's something to update
  if (Object.keys(updateData).length === 0) {
    return { message: "No updates provided" };
  }
  
  try {
    const updatedSleep = await api.updateSleep(sleepId, updateData);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Sleep Updated",
      message: `Updated sleep #${sleepId}`,
    });
    
    return updatedSleep;
  } catch (error) {
    let errorMessage = "Failed to update sleep";
    if (axios.isAxiosError(error) && error.response) {
      errorMessage += `: ${JSON.stringify(error.response.data)}`;
    }
    
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: errorMessage,
    });
    
    throw error;
  }
} 