import React, { useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { buildQueueSummary } from "./queueViewModel";

const QueueSummaryCards = ({ queues, totalQueues }) => {
  const summary = useMemo(
    () => buildQueueSummary(queues, totalQueues),
    [queues, totalQueues],
  );

  const cards = [
    {
      label: "Total Queues",
      meta: "Total configured queues",
      value: summary.total,
    },
    {
      dot: "#16a34a",
      label: "Active Queues",
      meta: "Open queues",
      value: summary.active,
    },
    {
      color: "#ef4444",
      label: "Hot Queues",
      meta: "Allocated > 110% of deserved",
      value: summary.hot,
    },
    {
      color: "#f97316",
      label: "Starving Queues",
      meta: "Requested resources are not allocated",
      value: summary.starving,
    },
    {
      color: "#69707a",
      label: "Idle Queues",
      meta: "No requested or allocated resources",
      value: summary.idle,
    },
    {
      color: "#64748b",
      label: "Invalid Queues",
      meta: "Configuration issues",
      value: summary.invalid,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(6, minmax(0, 1fr))",
        },
        mb: 2,
      }}
    >
      {cards.map((card) => (
        <Paper
          key={card.label}
          sx={{
            border: "1px solid #dfe3e8",
            borderRadius: 1.5,
            boxShadow: "none",
            p: 2,
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              gap: 1,
              mb: 1,
            }}
          >
            {card.dot && (
              <Box
                sx={{
                  bgcolor: card.dot,
                  borderRadius: "50%",
                  height: 10,
                  width: 10,
                }}
              />
            )}
            <Typography
              color="text.secondary"
              sx={{ fontSize: 13, fontWeight: 700 }}
            >
              {card.label}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gap: 0.5,
            }}
          >
            <Typography
              sx={{
                color: card.color || "text.primary",
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: -0.5,
              }}
            >
              {card.value}
            </Typography>
            {card.meta && (
              <Typography
                color="text.secondary"
                sx={{ fontSize: 12, lineHeight: 1.3 }}
              >
                {card.meta}
              </Typography>
            )}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default QueueSummaryCards;
