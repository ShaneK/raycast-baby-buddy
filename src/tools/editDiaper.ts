import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI, DiaperEntry } from "../api";
import { findChildByName, formatTimeToISO } from "../utils/normalizers";

type EditDiaperInput = {
  /**
   * The ID of the diaper change entry to edit
   */
  diaperId: number;
  /**
   * The name of the child this diaper change is for
   */
  childName?: string;
  /**
   * Whether the diaper was wet
   */
  wet?: boolean;
  /**
   * Whether the diaper contained solid waste
   */
  solid?: boolean;
  /**
   * The color of solid waste, if applicable
   */
  color?: string;
  /**
   * The amount, if applicable
   */
  amount?: string;
  /**
   * Notes about the diaper change
   */
  notes?: string;
  /**
   * Time of the diaper change (ISO string or HH:MM:SS format)
   */
  time?: string;
};

export default async function editDiaper({
  diaperId,
  childName,
  wet,
  solid,
  color,
  amount,
  notes,
  time,
}: EditDiaperInput) {
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
  
  // Format time to ISO using utility function
  const formattedTime = formatTimeToISO(time);
  
  // Convert amount to number or null if provided
  const numericAmount = amount !== undefined ? (amount ? parseFloat(amount) : null) : undefined;
  
  // Build the update data
  const updateData: Partial<DiaperEntry> = {};
  
  if (childId !== undefined) updateData.child = childId;
  if (formattedTime !== undefined) updateData.time = formattedTime;
  if (wet !== undefined) updateData.wet = wet;
  if (solid !== undefined) updateData.solid = solid;
  if (color !== undefined) updateData.color = color;
  if (numericAmount !== undefined) updateData.amount = numericAmount;
  if (notes !== undefined) updateData.notes = notes;
  
  // Only proceed if there's something to update
  if (Object.keys(updateData).length === 0) {
    return { message: "No updates provided" };
  }
  
  try {
    const updatedDiaper = await api.updateDiaper(diaperId, updateData);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Diaper Change Updated",
      message: `Updated diaper change #${diaperId}`,
    });
    
    return updatedDiaper;
  } catch (error) {
    let errorMessage = "Failed to update diaper change";
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