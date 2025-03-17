import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { BabyBuddyAPI, Timer } from "../api";

interface EditTimerFormProps {
  timer: Timer;
  childName: string;
  onTimerUpdated: () => void;
}

export default function EditTimerForm({ timer, childName, onTimerUpdated }: EditTimerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [timerName, setTimerName] = useState<string>(timer.name);
  const [startDateTime, setStartDateTime] = useState<Date>(new Date(timer.start));
  const { pop } = useNavigation();

  async function handleSubmit() {
    try {
      setIsLoading(true);
      const api = new BabyBuddyAPI();

      // Update the timer with new name and start time
      await api.updateTimer(timer.id, {
        name: timerName,
        start: startDateTime.toISOString(),
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Timer Updated",
        message: `${timerName} timer updated`,
      });

      onTimerUpdated();
      pop();
    } catch (error) {
      console.error("Failed to update timer:", error);
      setIsLoading(false);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Update Timer",
        message: "Please try again",
      });
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update Timer" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={() => pop()} />
        </ActionPanel>
      }
    >
      <Form.Description title="Edit Timer" text={`Edit the "${timer.name}" timer for ${childName}`} />

      <Form.TextField
        id="timerName"
        title="Timer Name"
        placeholder="Enter timer name"
        value={timerName}
        onChange={setTimerName}
      />

      <Form.DatePicker
        id="startDateTime"
        title="Start Time"
        value={startDateTime}
        onChange={(newValue) => newValue && setStartDateTime(newValue)}
      />
    </Form>
  );
}
