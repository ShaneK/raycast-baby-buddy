import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { BabyBuddyAPI, Timer } from "../api";
import axios from "axios";

// Define the available diaper colors
const DIAPER_COLORS = [
  { id: "black", name: "Black" },
  { id: "brown", name: "Brown" },
  { id: "green", name: "Green" },
  { id: "yellow", name: "Yellow" },
  { id: "white", name: "White" },
];

interface CreateDiaperFormProps {
  timer: Timer;
  childName: string;
  onEventCreated: () => void;
}

export default function CreateDiaperForm({ timer, childName, onEventCreated }: CreateDiaperFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [time, setTime] = useState<Date>(timer.end ? new Date(timer.end) : new Date());
  const [isWet, setIsWet] = useState(false);
  const [isSolid, setIsSolid] = useState(false);
  const [color, setColor] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState("");
  const navigation = useNavigation();

  async function handleSubmit() {
    // Validate that at least one of wet or solid is selected
    if (!isWet && !isSolid) {
      showToast({
        style: Toast.Style.Failure,
        title: "Invalid diaper change",
        message: "At least one of Wet or Solid must be selected",
      });
      return;
    }

    try {
      setIsLoading(true);
      const api = new BabyBuddyAPI();

      // Format date properly
      const timeISOString = time.toISOString();

      // Parse amount to number or null
      const amountValue = amount ? parseFloat(amount) : null;

      // Prepare the data
      const diaperData = {
        child: timer.child,
        time: timeISOString,
        wet: isWet,
        solid: isSolid,
        color: isSolid ? color : "",
        amount: amountValue,
        notes: notes || "",
      };

      // Create the diaper entry
      await api.createDiaper(diaperData);

      // Only delete the timer if it's a real timer (id > 0)
      if (timer.id > 0) {
        await api.deleteTimer(timer.id);
      }

      await showToast({
        style: Toast.Style.Success,
        title: "Diaper Change Created",
        message: `Diaper change created for ${childName}`,
      });

      // Call the callback to refresh and navigate
      onEventCreated();
    } catch (error: unknown) {
      console.error("Failed to create diaper change:", error);
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
        title: "Failed to Create Diaper Change",
        message: errorMessage,
      });
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Diaper Change" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={() => navigation.pop()} />
        </ActionPanel>
      }
    >
      <Form.Description title="Create Diaper Change" text={`Create a diaper change for ${childName}`} />

      <Form.Separator />

      <Form.DatePicker id="time" title="Time" value={time} onChange={(newValue) => newValue && setTime(newValue)} />

      <Form.Separator />

      <Form.Checkbox id="isWet" label="Wet" value={isWet} onChange={setIsWet} />

      <Form.Checkbox id="isSolid" label="Solid" value={isSolid} onChange={setIsSolid} />

      {isSolid && (
        <Form.Dropdown id="color" title="Color" value={color} onChange={setColor}>
          <Form.Dropdown.Item value="" title="Select a color" />
          {DIAPER_COLORS.map((colorOption) => (
            <Form.Dropdown.Item key={colorOption.id} value={colorOption.id} title={colorOption.name} />
          ))}
        </Form.Dropdown>
      )}

      <Form.TextField
        id="amount"
        title="Amount"
        placeholder="Enter amount (optional)"
        value={amount}
        onChange={setAmount}
      />

      <Form.TextArea
        id="notes"
        title="Notes"
        placeholder="Enter any notes about this diaper change"
        value={notes}
        onChange={setNotes}
      />
    </Form>
  );
}
