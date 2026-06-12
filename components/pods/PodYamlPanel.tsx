import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPodYaml } from "../../lib/client/dashboard-api";
import YamlViewer from "../details/YamlViewer";

const PodYamlPanel = ({ enabled, namespace, name }) => {
  const { data, error, isFetching, isLoading } = useQuery({
    enabled,
    queryFn: () => fetchPodYaml(namespace, name),
    queryKey: ["podYaml", namespace, name],
  });

  return (
    <YamlViewer
      data={data}
      error={error}
      fill
      isLoading={isLoading || isFetching}
    />
  );
};

export default PodYamlPanel;
