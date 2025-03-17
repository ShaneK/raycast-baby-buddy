import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { BabyBuddyAPI, Timer } from "../api";
import axios from "axios";

interface CreateFeedingFormProps {
  timer: Timer;
  childName: string;
  onEventCreated: () => void;
}

// Feeding types and methods from Baby Buddy
const FEEDING_TYPES = [
  { id: "breast milk", name: "Breast Milk" },
  { id: "formula", name: "Formula" },
  { id: "solid food", name: "Solid Food" },
  { id: "fortified breast milk", name: "Fortified Breast Milk" },
];

const FEEDING_METHODS = [
  { id: "bottle", name: "Bottle" },
  { id: "left breast", name: "Left Breast" },
  { id: "right breast", name: "Right Breast" },
  { id: "both breasts", name: "Both Breasts" },
  { id: "parent fed", name: "Parent Fed" },
  { id: "self fed", name: "Self Fed" },
];

export default function CreateFeedingForm({ timer, childName, onEventCreated }: CreateFeedingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date>(() => {
    // Ensure start time is before end time
    const start = new Date(timer.start);
    const end = timer.end ? new Date(timer.end) : new Date();

    // If start time is not before end time, set it 1 second before
    if (start >= end) {
      const newStart = new Date(end);
      newStart.setSeconds(newStart.getSeconds() - 1);
      return newStart;
    }

    return start;
  });
  const [endTime, setEndTime] = useState<Date>(timer.end ? new Date(timer.end) : new Date());
  const navigation = useNavigation();

  async function handleSubmit(values: { type: string; method: string; amount?: string; notes?: string }) {
    try {
      setIsLoading(true);
      const api = new BabyBuddyAPI();

      // Format dates properly
      const startISOString = startTime.toISOString();
      const endISOString = endTime.toISOString();

      // Prepare the data
      const feedingData = {
        child: timer.child,
        start: startISOString,
        end: endISOString,
        type: values.type,
        method: values.method,
        amount: values.amount ? parseFloat(values.amount) : null,
        notes: values.notes || "",
      };

      // Create the feeding entry
      await api.createFeeding(feedingData);

      // Only delete the timer if it's a real timer (id > 0)
      if (timer.id > 0) {
        await api.deleteTimer(timer.id);
      }

      await showToast({
        style: Toast.Style.Success,
        title: "Feeding Created",
        message: `Feeding created for ${childName}`,
      });

      // Call the callback to refresh and navigate
      onEventCreated();
    } catch (error: unknown) {
      console.error("Failed to create feeding:", error);
      setIsLoading(false);

      let errorMessage = "Please try again";

      // Check if it's an Axios error with response data
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === "object") {
          // Join all error messages
          const messages = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
          if (messages) {
            errorMessage = messages;
          }
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      }

      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Create Feeding",
        message: errorMessage,
      });
    }
  }

  // Validate that end time is after start time
  const isTimeRangeValid = endTime > startTime;

  // Use useEffect to handle validation side effects
  useEffect(() => {
    // Empty effect to avoid linter warnings about dependencies
  }, [isTimeRangeValid]);

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Feeding" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={() => navigation.pop()} />
        </ActionPanel>
      }
    >
      <Form.Description title="Create Feeding" text={`Create a feeding entry for ${childName}`} />

      <Form.Separator />

      <Form.DatePicker
        id="startTime"
        title="Start Time"
        value={startTime}
        onChange={(newValue) => newValue && setStartTime(newValue)}
      />

      <Form.DatePicker
        id="endTime"
        title="End Time"
        value={endTime}
        onChange={(newValue) => newValue && setEndTime(newValue)}
      />

      {!isTimeRangeValid && <Form.Description title="Error" text="⚠️ End time must be after start time" />}

      <Form.Separator />

      <Form.Dropdown id="type" title="Type" defaultValue="breast milk">
        {FEEDING_TYPES.map((type) => (
          <Form.Dropdown.Item key={type.id} value={type.id} title={type.name} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown id="method" title="Method" defaultValue="bottle">
        {FEEDING_METHODS.map((method) => (
          <Form.Dropdown.Item key={method.id} value={method.id} title={method.name} />
        ))}
      </Form.Dropdown>

      <Form.TextField id="amount" title="Amount" placeholder="Enter amount" />

      <Form.TextArea id="notes" title="Notes" placeholder="Enter any notes about this feeding" />
    </Form>
  );
}
