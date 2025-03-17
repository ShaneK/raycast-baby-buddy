import { showToast, Toast } from "@raycast/api";
import axios from "axios";
import { BabyBuddyAPI } from "../api";

type DeleteFeedingInput = {
  /**
   * The ID of the feeding entry to delete
   */
  feedingId: number;
};

export default async function deleteFeeding({
  feedingId,
}: DeleteFeedingInput) {
  console.log(`deleteFeeding tool called with: feedingId=${feedingId}`);
  
  const api = new BabyBuddyAPI();
  
  try {
    await api.deleteFeeding(feedingId);
    
    console.log(`Successfully deleted feeding #${feedingId}`);
    
    await showToast({
      style: Toast.Style.Success,
      title: "Feeding Deleted",
      message: `Deleted feeding #${feedingId}`,
    });
    
    return { success: true, feedingId };
  } catch (error) {
    console.error("Failed to delete feeding:", error);
    
    let errorMessage = "Failed to delete feeding";
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