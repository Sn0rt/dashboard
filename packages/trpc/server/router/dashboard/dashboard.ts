import {
  getDashboardSummary,
  getJobStatusMetrics,
  getQueueResourcesMetrics,
} from "../../resources/dashboard";
import { procedure, router } from "../../trpc";

export const dashboardRouter = router({
  getSummary: procedure.query(() => getDashboardSummary()),
  getJobStatusMetrics: procedure.query(() => getJobStatusMetrics()),
  getQueueMetrics: procedure.query(() => getQueueResourcesMetrics()),
});
