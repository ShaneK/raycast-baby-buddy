import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI } from "../api";

type Input = {
  childName: string;
  /**
   * Valid options are Breast Milk, Formula, Fortified Breast Milk, Solid Food
   * If the user does not specify, please ask them to clarify the food type
   */
  type: string;
  /**
   * Valid options are Bottle, left breast, right breast, both breasts
   * If the user does not specify, please ask them to clarify the method
   */
  method?: string;
  /**
   * The amount of food or milk
   */
  amount?: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
};

export default async function ({
  childName,
  type,
  method = "bottle",
  amount = "",
  notes = "",
  startTime,
  endTime,
}: Input) {
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

  // Set default times if not provided
  const now = new Date();
  const defaultStartTime = new Date(now.getTime() - 1000); // 1 second ago

  const start = startTime || defaultStartTime.toISOString();
  const end = endTime || now.toISOString();

  // Calculate duration
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();

  // Format duration as HH:MM:SS
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  const duration = `${durationHours.toString().padStart(2, "0")}:${durationMinutes.toString().padStart(2, "0")}:${durationSeconds.toString().padStart(2, "0")}`;

  // Convert amount to number or null
  const numericAmount = amount ? parseFloat(amount) : null;

  // Normalize type and method values
  // Baby Buddy expects specific values for type and method
  const normalizedType = normalizeType(type);
  const normalizedMethod = normalizeMethod(method);

  // Create the feeding entry
  const feedingData = {
    child: child.id,
    start,
    end,
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
    console.error("Failed to create feeding:", error);

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
