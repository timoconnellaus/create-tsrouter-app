import { defineCollection, defineConfig } from "@content-collections/core";

const jobs = defineCollection({
  name: "jobs",
  directory: "content/jobs",
  include: "**/*.md",
  schema: (z) => ({
    jobTitle: z.string(),
    summary: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    company: z.string(),
    location: z.string(),
    tags: z.array(z.string()),
  }),
});

const education = defineCollection({
  name: "education",
  directory: "content/education",
  include: "**/*.md",
  schema: (z) => ({
    school: z.string(),
    summary: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    tags: z.array(z.string()),
  }),
});

export default defineConfig({
  collections: [jobs, education],
});
