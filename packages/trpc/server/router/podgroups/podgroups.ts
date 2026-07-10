import {
  getPodGroup,
  getPodGroupYaml,
  listPodGroups,
} from "../../resources/podgroups";
import { procedure, router } from "../../trpc";
import {
  getPodGroupInputSchema,
  getPodGroupsInputSchema,
  getPodGroupYamlInputSchema,
} from "./schema";

export const podgroupsRouter = router({
  getPodGroups: procedure.input(getPodGroupsInputSchema).query(({ input }) => {
    const {
      namespace = "",
      search = "",
      status = "",
      page = 1,
      pageSize = 10,
    } = input;

    return listPodGroups(page, pageSize, { namespace, search, status });
  }),
  getPodGroup: procedure.input(getPodGroupInputSchema).query(({ input }) => {
    return getPodGroup(input.namespace, input.name);
  }),
  getPodGroupYaml: procedure
    .input(getPodGroupYamlInputSchema)
    .query(({ input }) => {
      return getPodGroupYaml(input.namespace, input.name);
    }),
});
