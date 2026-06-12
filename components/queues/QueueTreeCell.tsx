import React from "react";
import { Box, IconButton, TableCell, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import { tableNameSx } from "../scheduling/tableDataStyles";
import { getQueueName } from "./queueViewModel";

const QueueTreeCell = ({
  expanded,
  hasChildren,
  level,
  node,
  onSelectQueue,
  onToggle,
}) => {
  const queueName = getQueueName(node);

  return (
    <TableCell>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          gap: 0.75,
          pl: level * 2.2,
          position: "relative",
        }}
      >
        {level > 0 && (
          <Box
            sx={{
              borderBottom: "1px solid #cfd5dc",
              borderLeft: "1px solid #cfd5dc",
              height: 22,
              left: level * 17 - 7,
              position: "absolute",
              top: -2,
              width: 14,
            }}
          />
        )}
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) onToggle(queueName);
          }}
          size="small"
          sx={{ height: 24, width: 24, zIndex: 1 }}
        >
          {hasChildren ? (
            expanded ? (
              <ExpandMoreIcon sx={{ fontSize: 15 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 15 }} />
            )
          ) : (
            <Box sx={{ width: 15 }} />
          )}
        </IconButton>
        {expanded && hasChildren ? (
          <FolderOpenOutlinedIcon sx={{ fontSize: 16, zIndex: 1 }} />
        ) : (
          <FolderOutlinedIcon sx={{ fontSize: 16, zIndex: 1 }} />
        )}
        <Typography
          onClick={(event) => {
            event.stopPropagation();
            onSelectQueue(node);
          }}
          sx={{
            color: level ? "#1677ff" : "text.primary",
            cursor: "pointer",
            zIndex: 1,
            ...tableNameSx,
          }}
        >
          {queueName}
        </Typography>
      </Box>
    </TableCell>
  );
};

export default QueueTreeCell;
