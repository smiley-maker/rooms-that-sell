import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Run every 5 minutes to check for stuck staging jobs
crons.interval(
  "process-stuck-jobs",
  { minutes: 5 },
  api.stagingJobs.processStuckJobs
);

// Run every 10 minutes to check for stuck processing jobs
crons.interval(
  "process-stuck-processing-jobs",
  { minutes: 10 },
  api.stagingJobs.processStuckJobs
);

// Note: Cleanup functionality can be added to main stagingJobs module if needed

export default crons;