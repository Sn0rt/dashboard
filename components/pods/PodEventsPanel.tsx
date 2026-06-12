import React from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPodEvents,
  getApiErrorMessage,
} from "../../lib/client/dashboard-api";
import { ResourceEventsTable } from "../details/ResourceEventsPanel";

const PodEventsPanel = ({ name, namespace }) => {
  const { data, error, isFetching, isLoading } = useQuery({
    enabled: Boolean(namespace && name),
    queryFn: () => fetchPodEvents(namespace, name),
    queryKey: ["podEvents", namespace, name],
  });

  if (isLoading || isFetching) {
    return (
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          minHeight: 220,
        }}
      >
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ boxShadow: "none" }}>
        {getApiErrorMessage(error, "Failed to fetch pod events")}
      </Alert>
    );
  }

  return (
    <ResourceEventsTable
      emptyText="No pod events available."
      events={data?.items || []}
      formatTimestamps
    />
  );
};

export default PodEventsPanel;
