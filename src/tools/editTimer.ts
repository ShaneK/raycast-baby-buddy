import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI } from "../api";
import { findChildByName, formatTimeToISO } from "../utils/normalizers";

type EditTimerInput = {
  /**
   * The ID of the timer to edit
   */
  timerId: number;
  /**
   * The name of the child this timer is for
   */
  childName?: string;
  /**
   * The name of the timer
   */
  timerName?: string;
  /**
   * Start time for the timer (ISO string or HH:MM:SS format)
   */
  startTime?: string;
  /**
   * End time for the timer (ISO string or HH:MM:SS format)
   */
  endTime?: string;
};

// Define extended update type to include child property
interface TimerUpdateData {
  name?: string;
  start?: string;
  end?: string;
  active?: boolean;
  child?: number;
}

export default async function editTimer({
  timerId,
  childName,
  timerName,
  startTime,
  endTime,
}: EditTimerInput) {
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
  
  // Build the update data using our extended interface
  const updateData: TimerUpdateData = {};
  
  if (timerName !== undefined) updateData.name = timerName;
  if (formattedStartTime !== undefined) updateData.start = formattedStartTime;
  if (formattedEndTime !== undefined) {
    updateData.end = formattedEndTime;
    updateData.active = false; // Set active to false if an end time is provided
  }
  
  // Add childId to updateData if present
  if (childId !== undefined) {
    updateData.child = childId;
  }
  
  // Only proceed if there's something to update
  if (Object.keys(updateData).length === 0) {
    return { message: "No updates provided" };
  }
  
  try {
    // Update timer with all data at once - we'll use the extended data but let updateTimer handle what it needs
    const updatedTimer = await api.updateTimer(timerId, updateData);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Timer Updated",
      message: `Updated timer #${timerId}`,
    });
    
    return updatedTimer;
  } catch (error) {
    let errorMessage = "Failed to update timer";
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