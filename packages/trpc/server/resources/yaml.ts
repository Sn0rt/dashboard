import yaml from "js-yaml";

export function dumpResourceYaml(resource: unknown): string {
  return yaml.dump(resource, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}
