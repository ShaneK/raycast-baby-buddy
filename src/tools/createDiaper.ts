import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI } from "../api";
import { findChildByName, formatTimeToISO, getContentsDescription, normalizeContents } from "../utils/normalizers";

/**
 * Create a new diaper change entry for a child
 * 
 * If asked to create a diaper change with 2 different amount values,
 * create multiple diapers. E.g. "log a wet 1 and solid 2" should create 
 * 2 diaper changes.
 * 
 * @param childName - The name of the child
 * @param contents - Contents of the diaper (wet, solid, both)
 * @param color - Color of the diaper contents
 * @param amount - Amount description
 * @param notes - Any notes about the diaper change
 * @param time - The time of the diaper change (ISO string). If not provided, current time will be used.
 */
export default async function ({
  childName,
  contents,
  color = "",
  amount = "",
  notes = "",
  time,
}: {
  childName: string;
  contents: string;
  color?: string;
  amount?: string;
  notes?: string;
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
  
  // Normalize contents using utility function
  const normalizedContents = normalizeContents(contents);
  
  // Convert amount to number or null
  const numericAmount = amount ? parseFloat(amount) : null;
  
  // Create the diaper change entry
  const diaperData = {
    child: child.id,
    time: formattedTime,
    wet: normalizedContents.wet,
    solid: normalizedContents.solid,
    color,
    amount: numericAmount,
    notes,
  };
  
  try {
    const newDiaper = await api.createDiaper(diaperData);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Diaper Change Created",
      message: `Recorded ${getContentsDescription(normalizedContents)} diaper for ${child.first_name}`,
    });
    
    return newDiaper;
  } catch (error) {
    let errorMessage = "Failed to create diaper change";
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