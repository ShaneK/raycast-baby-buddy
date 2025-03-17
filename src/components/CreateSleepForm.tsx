import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { BabyBuddyAPI, Timer } from "../api";
import axios from "axios";

interface CreateSleepFormProps {
  timer: Timer;
  childName: string;
  onEventCreated: () => void;
}

export default function CreateSleepForm({ timer, childName, onEventCreated }: CreateSleepFormProps) {
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
  const [isNap, setIsNap] = useState(false);
  const [notes, setNotes] = useState("");
  const navigation = useNavigation();

  // Validate that end time is after start time
  const isTimeRangeValid = endTime > startTime;

  // Use useEffect to handle validation side effects
  useEffect(() => {
    // Empty effect to avoid linter warnings about dependencies
  }, [isTimeRangeValid]);

  async function handleSubmit() {
    if (!isTimeRangeValid) {
      showToast({
        style: Toast.Style.Failure,
        title: "Invalid time range",
        message: "End time must be after start time",
      });
      return;
    }

    try {
      setIsLoading(true);
      const api = new BabyBuddyAPI();

      // Format dates properly
      const startISOString = startTime.toISOString();
      const endISOString = endTime.toISOString();

      // Prepare the data
      const sleepData = {
        child: timer.child,
        start: startISOString,
        end: endISOString,
        nap: isNap,
        notes: notes || "",
      };

      // Create the sleep entry
      await api.createSleep(sleepData);

      // Only delete the timer if it's a real timer (id > 0)
      if (timer.id > 0) {
        await api.deleteTimer(timer.id);
      }

      await showToast({
        style: Toast.Style.Success,
        title: "Sleep Entry Created",
        message: `Sleep entry created for ${childName}`,
      });

      // Call the callback to refresh and navigate
      onEventCreated();
    } catch (error: unknown) {
      console.error("Failed to create sleep entry:", error);
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
        title: "Failed to Create Sleep Entry",
        message: errorMessage,
      });
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Sleep Entry" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={() => navigation.pop()} />
        </ActionPanel>
      }
    >
      <Form.Description title="Create Sleep Entry" text={`Create a sleep entry for ${childName}`} />

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

      <Form.Checkbox id="isNap" label="Is Nap" value={isNap} onChange={setIsNap} />

      <Form.TextArea
        id="notes"
        title="Notes"
        placeholder="Enter any notes about this sleep"
        value={notes}
        onChange={setNotes}
      />
    </Form>
  );
}
