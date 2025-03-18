import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI, FeedingEntry } from "../api";
import { calculateDuration, findChildByName, formatTimeToISO, normalizeMethod, normalizeType } from "../utils/normalizers";

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
  const api = new BabyBuddyAPI();
  
  // Fetch the existing feeding to have a reference
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
  
  // Only proceed if there's something to update
  if (Object.keys(updateData).length === 0) {
    return { message: "No updates provided" };
  }
  
  try {
    const updatedFeeding = await api.updateFeeding(feedingId, updateData);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Feeding Updated",
      message: `Updated feeding #${feedingId}`,
    });
    
    return updatedFeeding;
  } catch (error) {
    let errorMessage = "Failed to update feeding";
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