import { tool } from "ai";
import { z } from "zod";

import motorcycles from "@/data/motorcycles";

const getMotorcycles = tool({
  description: "Get all motorcycles from the database",
  parameters: z.object({}),
  execute: async () => {
    return Promise.resolve(motorcycles);
  },
});

const recommendMotorcycle = tool({
  description: "Use this tool to recommend a motorcycle to the user",
  parameters: z.object({
    id: z.string().describe("The id of the motorcycle to recommend"),
  }),
});

export default async function getTools() {
  return {
    getMotorcycles,
    recommendMotorcycle,
  };
}
