import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI } from "../api";
import { findChildByName, formatTimeToISO } from "../utils/normalizers";

/**
 * Create a new timer for a child
 * @param childName - The name of the child  
 * @param name - Name for the timer (e.g., "Feeding", "Sleep", "Tummy Time")
 * @param time - The start time for the timer. If not provided, current time will be used.
 */
export default async function ({
  childName,
  name,
  time,
}: {
  childName: string;
  name: string;
  time?: string;
}) {
  const api = new BabyBuddyAPI();
  const children = await api.getChildren();
  
  // Find child using the utility function
  const child = findChildByName(children, childName);
  
  if (!child) {
    throw new Error(`Child with name ${childName} not found`);
  }
  
  // Format time to ISO using utility function
  const formattedTime = formatTimeToISO(time) || new Date().toISOString();
  
  try {
    // Call API with the correct parameters
    const newTimer = await api.createTimer(child.id, name, formattedTime);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Timer Created",
      message: `Started ${name} timer for ${child.first_name}`,
    });
    
    return newTimer;
  } catch (error) {
    let errorMessage = "Failed to create timer";
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
