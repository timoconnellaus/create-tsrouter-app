import { tool } from "ai";
import { z } from "zod";
import guitars from "../data/example-guitars";

const getGuitars = tool({
  description: "Get all products from the database",
  parameters: z.object({}),
  execute: async () => {
    return Promise.resolve(guitars);
  },
});

const recommendGuitar = tool({
  description: "Use this tool to recommend a guitar to the user",
  parameters: z.object({
    id: z.string().describe("The id of the guitar to recommend"),
  }),
});

export default async function getTools() {
  return {
    getGuitars,
    recommendGuitar,
  };
}
