import {
  createQueue,
  deleteQueue,
  getQueue,
  getQueueYaml,
  listAllQueues,
  listQueues,
  updateQueue,
} from "../../resources/queues";
import { procedure, router } from "../../trpc";
import {
  createQueueInputSchema,
  deleteQueueInputSchema,
  getQueueInputSchema,
  getQueuesInputSchema,
  updateQueueInputSchema,
} from "./schema";

export const queueRouter = router({
  getQueue: procedure.input(getQueueInputSchema).query(({ input }) => {
    return getQueue(input.name);
  }),
  getQueueYaml: procedure.input(getQueueInputSchema).query(({ input }) => {
    return getQueueYaml(input.name);
  }),
  getQueues: procedure.input(getQueuesInputSchema).query(({ input }) => {
    const { page = 1, pageSize = 10 } = input;
    return listQueues(page, pageSize);
  }),
  getAllQueues: procedure.query(() => listAllQueues()),
  createQueue: procedure.input(createQueueInputSchema).mutation(({ input }) => {
    return createQueue(input.queueManifest);
  }),
  updateQueue: procedure.input(updateQueueInputSchema).mutation(({ input }) => {
    return updateQueue(input.name, input.updatedBody);
  }),
  deleteQueue: procedure.input(deleteQueueInputSchema).mutation(({ input }) => {
    return deleteQueue(input.name);
  }),
});
