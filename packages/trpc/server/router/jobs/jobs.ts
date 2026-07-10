import {
  createJob,
  deleteJob,
  getJob,
  getJobYaml,
  listAllJobs,
  listJobs,
  updateJob,
} from "../../resources/jobs";
import { procedure, router } from "../../trpc";
import {
  createJobInputSchema,
  deleteJobInputSchema,
  getJobInputSchema,
  getJobsInputSchema,
  updateJobInputSchema,
} from "./schema";

export const jobsRouter = router({
  getJobs: procedure.input(getJobsInputSchema).query(({ input }) => {
    const { page = 1, pageSize = 10 } = input;
    return listJobs(page, pageSize);
  }),
  getJob: procedure.input(getJobInputSchema).query(({ input }) => {
    return getJob(input.namespace, input.name);
  }),
  getJobYaml: procedure.input(getJobInputSchema).query(({ input }) => {
    return getJobYaml(input.namespace, input.name);
  }),
  getAllJobs: procedure.query(() => listAllJobs()),
  createJob: procedure.input(createJobInputSchema).mutation(({ input }) => {
    return createJob(input.jobManifest);
  }),
  updateJob: procedure.input(updateJobInputSchema).mutation(({ input }) => {
    return updateJob(input.namespace, input.name, input.patchData);
  }),
  deleteJob: procedure.input(deleteJobInputSchema).mutation(({ input }) => {
    return deleteJob(input.namespace, input.name);
  }),
});
