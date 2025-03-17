import { Detail } from "@raycast/api";
import { useState, useEffect } from "react";
import { BabyBuddyAPI } from "./api";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const api = new BabyBuddyAPI();
        await api.getChildren(); // Just to verify API connection works
        setIsLoading(false);
      } catch (error) {
        console.error("Error connecting to Baby Buddy:", error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <Detail
      markdown={`# Baby Buddy Assistant

Ask questions about your children's activities or log new entries.

## Example Questions
- Which of my kids is asleep?
- What timers are ongoing?
- How much has Emma eaten today?
- Log a wet diaper change for Noah
- Add a feeding entry for breast milk for Emma
- Start a sleep timer for Noah
- Stop Noah's feeding timer
- How long did Emma sleep today?
- How many diaper changes has Noah had today?
      `}
      isLoading={isLoading}
    />
  );
}
