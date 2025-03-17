import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI, FeedingEntry } from "../api";

type EditFeedingInput = {
  /**
   * The ID of the feeding entry to edit
   */
  feedingId: number;
  /**
   * The name of the child this feeding is for
   */
  childName?: string;
  /**
   * Valid options are Breast Milk, Formula, Fortified Breast Milk, Solid Food
   */
  type?: string;
  /**
   * Valid options are Bottle, left breast, right breast, both breasts
   */
  method?: string;
  /**
   * The amount of food or milk
   */
  amount?: string;
  /**
   * Notes about the feeding
   */
  notes?: string;
  /**
   * Start time for the feeding (ISO string or HH:MM:SS format)
   */
  startTime?: string;
  /**
   * End time for the feeding (ISO string or HH:MM:SS format)
   */
  endTime?: string;
};

export default async function editFeeding({
  feedingId,
  childName,
  type,
  method,
  amount,
  notes,
  startTime,
  endTime,
}: EditFeedingInput) {
  console.log("editFeeding tool called with:", 
    JSON.stringify({ feedingId, childName, type, method, amount, notes, startTime, endTime }, null, 2)
  );
  
  const api = new BabyBuddyAPI();
  
  // Fetch the existing feeding to have a reference
  let childId: number | undefined;
  
  // If childName is provided, look up the child ID
  if (childName) {
    const children = await api.getChildren();
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
    
    childId = child.id;
    console.log("Found child:", child);
  }
  
  // Handle time formats for startTime and endTime
  let formattedStartTime: string | undefined;
  let formattedEndTime: string | undefined;
  
  if (startTime) {
    if (startTime.includes('T') && startTime.includes('-')) {
      // Already in ISO format
      formattedStartTime = startTime;
    } else if (startTime.includes(':')) {
      // HH:MM:SS or HH:MM format
      const today = new Date();
      const [hours, minutes, seconds = '00'] = startTime.split(':').map(part => part.trim());
      
      today.setHours(parseInt(hours, 10));
      today.setMinutes(parseInt(minutes, 10));
      today.setSeconds(parseInt(seconds, 10));
      today.setMilliseconds(0);
      
      formattedStartTime = today.toISOString();
    }
  }
  
  if (endTime) {
    if (endTime.includes('T') && endTime.includes('-')) {
      // Already in ISO format
      formattedEndTime = endTime;
    } else if (endTime.includes(':')) {
      // HH:MM:SS or HH:MM format
      const today = new Date();
      const [hours, minutes, seconds = '00'] = endTime.split(':').map(part => part.trim());
      
      today.setHours(parseInt(hours, 10));
      today.setMinutes(parseInt(minutes, 10));
      today.setSeconds(parseInt(seconds, 10));
      today.setMilliseconds(0);
      
      formattedEndTime = today.toISOString();
    }
  }
  
  // Calculate duration if both start and end times are provided
  let duration: string | undefined;
  if (formattedStartTime && formattedEndTime) {
    const startDate = new Date(formattedStartTime);
    const endDate = new Date(formattedEndTime);
    const durationMs = endDate.getTime() - startDate.getTime();
    
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    duration = `${durationHours.toString().padStart(2, "0")}:${durationMinutes.toString().padStart(2, "0")}:${durationSeconds.toString().padStart(2, "0")}`;
  }
  
  // Normalize type and method if provided
  const normalizedType = type ? normalizeType(type) : undefined;
  const normalizedMethod = method ? normalizeMethod(method) : undefined;
  
  // Convert amount to number or null if provided
  const numericAmount = amount !== undefined ? (amount ? parseFloat(amount) : null) : undefined;
  
  // Build the update data
  const updateData: Partial<FeedingEntry> = {};
  
  if (childId !== undefined) updateData.child = childId;
  if (formattedStartTime !== undefined) updateData.start = formattedStartTime;
  if (formattedEndTime !== undefined) updateData.end = formattedEndTime;
  if (duration !== undefined) updateData.duration = duration;
  if (normalizedType !== undefined) updateData.type = normalizedType;
  if (normalizedMethod !== undefined) updateData.method = normalizedMethod;
  if (numericAmount !== undefined) updateData.amount = numericAmount;
  if (notes !== undefined) updateData.notes = notes;
  
  console.log("Updating feeding with data:", updateData);
  
  // Only proceed if there's something to update
  if (Object.keys(updateData).length === 0) {
    return { message: "No updates provided" };
  }
  
  try {
    const updatedFeeding = await api.updateFeeding(feedingId, updateData);
    
    console.log("Feeding updated successfully:", updatedFeeding);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Feeding Updated",
      message: `Updated feeding #${feedingId}`,
    });
    
    return updatedFeeding;
  } catch (error) {
    console.error("Failed to update feeding:", error);
    
    let errorMessage = "Failed to update feeding";
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

// Helper functions to normalize type and method values
function normalizeType(type: string): string {
  type = type.toLowerCase();
  
  // Valid types in Baby Buddy: breast milk, formula, fortified breast milk, solid food
  if (type.includes("breast") && type.includes("milk")) {
    return "breast milk";
  } else if (type.includes("formula")) {
    return "formula";
  } else if (type.includes("fortified")) {
    return "fortified breast milk";
  } else if (type.includes("solid")) {
    return "solid food";
  }
  
  // Default to breast milk if no match
  return "breast milk";
}

function normalizeMethod(method: string): string {
  method = method.toLowerCase();
  
  // Valid methods in Baby Buddy: bottle, left breast, right breast, both breasts
  if (method.includes("bottle")) {
    return "bottle";
  } else if (method.includes("left")) {
    return "left breast";
  } else if (method.includes("right")) {
    return "right breast";
  } else if (method.includes("both")) {
    return "both breasts";
  } else if (method.includes("breast")) {
    // If just "breast" is specified, default to "both breasts"
    return "both breasts";
  }
  
  // Default to bottle if no match
  return "bottle";
} 