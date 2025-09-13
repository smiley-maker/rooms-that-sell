import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Run every 5 minutes to check for stuck staging jobs
crons.interval(
  "process-stuck-jobs",
  { minutes: 5 },
  api.stagingJobsSimple.processStuckJobs
);

// Run every hour to clean up old completed jobs (optional)
crons.interval(
  "cleanup-old-jobs",
  { hours: 1 },
  api.stagingJobsSimple.cleanupOldJobs
);

export default crons;