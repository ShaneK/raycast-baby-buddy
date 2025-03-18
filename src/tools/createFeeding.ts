import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI } from "../api";
import { calculateDuration, findChildByName, formatTimeToISO, normalizeMethod, normalizeType } from "../utils/normalizers";

/**
 * Create a new feeding entry for a child
 * @param childName - The name of the child
 * @param type - The type of feeding (breast milk, formula, solid food, fortified breast milk)
 * @param method - The feeding method (bottle, left breast, right breast, both breasts)
 * @param amount - The amount fed, if applicable
 * @param notes - Any notes about the feeding
 * @param startTime - The start time of the feeding (ISO string). If not provided, 5 minutes ago will be used.
 * @param endTime - The end time of the feeding (ISO string). If not provided, current time will be used.
 */
export default async function ({
  childName,
  type,
  method = "bottle",
  amount = "",
  notes = "",
  startTime,
  endTime,
}: {
  childName: string;
  type: string;
  method?: string;
  amount?: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
}) {
  const api = new BabyBuddyAPI();
  const children = await api.getChildren();
  
  // Find child using the utility function
  const child = findChildByName(children, childName);
  
  if (!child) {
    throw new Error(`Child with name ${childName} not found`);
  }
  
  // Set default times if not provided
  const now = new Date();
  const defaultStartTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
  
  // Format times to ISO using utility function
  const formattedStartTime = formatTimeToISO(startTime) || defaultStartTime.toISOString();
  const formattedEndTime = formatTimeToISO(endTime) || now.toISOString();
  
  // Calculate duration using utility function
  const duration = calculateDuration(formattedStartTime, formattedEndTime);
  
  // Convert amount to number or null
  const numericAmount = amount ? parseFloat(amount) : null;
  
  // Normalize type and method values using utility functions
  const normalizedType = normalizeType(type);
  const normalizedMethod = normalizeMethod(method);
  
  // Create the feeding entry
  const feedingData = {
    child: child.id,
    start: formattedStartTime,
    end: formattedEndTime,
    duration,
    type: normalizedType,
    method: normalizedMethod,
    amount: numericAmount,
    notes,
  };
  
  try {
    const newFeeding = await api.createFeeding(feedingData);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Feeding Created",
      message: `Recorded ${normalizedType} feeding for ${child.first_name}`,
    });
    
    return newFeeding;
  } catch (error) {
    let errorMessage = "Failed to create feeding";
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
