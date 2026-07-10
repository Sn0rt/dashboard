import {
  createPod,
  deletePod,
  getPodYaml,
  listAllPods,
  listPods,
  updatePod,
} from "../../resources/pods";
import { procedure, router } from "../../trpc";
import {
  createPodInputSchema,
  deletePodInputSchema,
  getPodsInputSchema,
  getPodYamlInputSchema,
  updatePodInputSchema,
} from "./schema";

export const podRouter = router({
  getPods: procedure.input(getPodsInputSchema).query(({ input }) => {
    const { page = 1, pageSize = 10 } = input;
    return listPods(page, pageSize);
  }),
  getPodYaml: procedure.input(getPodYamlInputSchema).query(({ input }) => {
    return getPodYaml(input.namespace, input.name);
  }),
  getAllPods: procedure.query(() => listAllPods()),
  createPod: procedure.input(createPodInputSchema).mutation(({ input }) => {
    return createPod(input.podManifest);
  }),
  updatePod: procedure.input(updatePodInputSchema).mutation(({ input }) => {
    return updatePod(input.namespace, input.name, input.patchData);
  }),
  deletePod: procedure.input(deletePodInputSchema).mutation(({ input }) => {
    return deletePod(input.namespace, input.name);
  }),
});
