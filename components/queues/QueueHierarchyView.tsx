import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import QueuePagination from "./QueuePagination";
import QueueDetailsPanel from "./QueueDetailsPanel";
import QueueTreeCell from "./QueueTreeCell";
import { QueueResourceUsageBars } from "./QueueResourceUsageView";
import { QueueHealthBadge, QueueStatusBadge } from "./QueueStatusBadges";
import { tableNumericSx } from "../scheduling/tableDataStyles";
import { ResourceStatusLegend } from "../scheduling/ResourceStatus";
import {
  getHealth,
  getPendingInqueuePodGroups,
  getPriorityWeight,
  getQueueName,
  getRunningPodGroups,
  getStatus,
} from "./queueViewModel";

const QueueHeaderWithTooltip = ({ label, tooltip }) => (
  <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}>
    <span>{label}</span>
    <Tooltip title={tooltip}>
      <InfoOutlinedIcon sx={{ color: "text.disabled", fontSize: 14 }} />
    </Tooltip>
  </Box>
);

const QueueLegendPanel = () => (
  <Box
    sx={{
      display: "grid",
      gap: 2,
      gridTemplateColumns: { xs: "1fr", lg: "0.9fr 1.4fr" },
      mt: 2,
    }}
  >
    <Paper
      sx={{
        border: "1px solid #dfe3e8",
        borderRadius: 1.5,
        boxShadow: "none",
        p: 2,
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>
        Resource Bar Explanation
      </Typography>
      <Box sx={{ px: 1 }}>
        <Box
          sx={{
            bgcolor: "#d8dadd",
            borderRadius: 999,
            height: 6,
            mb: 1,
            overflow: "visible",
            position: "relative",
          }}
        >
          <Box
            sx={{
              bgcolor: "#16a34a",
              height: "100%",
              left: 0,
              position: "absolute",
              width: "28%",
            }}
          />
          <Box
            sx={{
              bgcolor: "#3b82f6",
              height: "100%",
              left: "28%",
              position: "absolute",
              width: "32%",
            }}
          />
          <Box
            sx={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "8px solid #7c3aed",
              height: 0,
              left: "74%",
              position: "absolute",
              top: -8,
              width: 0,
            }}
          />
        </Box>
        <Box
          sx={{
            color: "text.secondary",
            display: "flex",
            fontSize: 12,
            justifyContent: "space-between",
          }}
        >
          <span>Guarantee (G)</span>
          <span>Deserved</span>
          <span>Allocated / Capability</span>
        </Box>
      </Box>
    </Paper>
    <Paper
      sx={{
        border: "1px solid #dfe3e8",
        borderRadius: 1.5,
        boxShadow: "none",
        p: 2,
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>
        Health Status
      </Typography>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {[
          ["#cf2727", "Overused: allocated / deserved > 110%"],
          ["#d86b00", "Starving: requested resources are not allocated"],
          ["#a16207", "Underused: allocated / requested < 50%"],
          ["#12833f", "Healthy: usage between 70% and 110%"],
          ["#69707a", "Idle: no requested or allocated resources"],
          ["#ef4444", "Invalid: invalid configuration"],
        ].map(([color, label]) => (
          <Box
            key={label}
            sx={{
              alignItems: "center",
              display: "flex",
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                bgcolor: color,
                borderRadius: "50%",
                height: 8,
                width: 8,
              }}
            />
            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  </Box>
);

const QueueHierarchyView = ({
  canWrite = true,
  treeData,
  selectedQueue,
  queueMap,
  onSelectQueue,
  pagination,
  totalQueues,
  onPageChange,
  onRowsPerPageChange,
  onCloseQueueDetails,
  onYamlSaved,
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    const expandable = new Set();
    const collect = (nodes) => {
      nodes.forEach((node) => {
        if (node.children?.length > 0) {
          expandable.add(getQueueName(node));
          collect(node.children);
        }
      });
    };
    collect(treeData);
    setExpandedNodes(expandable);
  }, [treeData]);

  const handleToggle = (queueName) => {
    setExpandedNodes((previous) => {
      const next = new Set(previous);
      if (next.has(queueName)) next.delete(queueName);
      else next.add(queueName);
      return next;
    });
  };

  const visibleRows = useMemo(() => {
    const rows = [];
    const visit = (nodes, level = 0) => {
      nodes.forEach((node) => {
        rows.push({ node, level });
        if (node.children?.length && expandedNodes.has(getQueueName(node))) {
          visit(node.children, level + 1);
        }
      });
    };
    visit(treeData);
    return rows;
  }, [expandedNodes, treeData]);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          xl: "minmax(820px, 1fr)",
        },
      }}
    >
      <Paper
        sx={{
          border: "1px solid #dfe3e8",
          borderRadius: 1.5,
          boxShadow: "none",
          minHeight: 680,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
            Queue Hierarchy ({totalQueues || visibleRows.length})
          </Typography>
          <IconButton size="small">
            <SettingsOutlinedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    color: "text.secondary",
                    fontSize: 12,
                    fontWeight: 700,
                  },
                }}
              >
                <TableCell
                  sx={{
                    bgcolor: "#ffffff",
                    borderBottom: "1px solid #dfe3e8",
                    minWidth: 210,
                  }}
                >
                  Queue Name
                </TableCell>
                <TableCell sx={{ minWidth: 104 }}>Status</TableCell>
                <TableCell sx={{ minWidth: 70 }}>Priority / Weight</TableCell>
                <TableCell align="center" sx={{ minWidth: 420 }}>
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "grid",
                      gap: 0.75,
                    }}
                  >
                    <span>Resources (CPU / Memory / GPU)</span>
                    <ResourceStatusLegend />
                  </Box>
                </TableCell>
                <TableCell sx={{ minWidth: 140 }}>
                  <QueueHeaderWithTooltip
                    label="Running"
                    tooltip="Running PodGroups from Volcano scheduler metric volcano_queue_pod_group_running_count."
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 105 }}>
                  <QueueHeaderWithTooltip
                    label="Pending / Inqueue"
                    tooltip="Pending/Inqueue PodGroups from Volcano scheduler metrics."
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 110 }}>Health</TableCell>
                {canWrite && <TableCell sx={{ width: 72 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canWrite ? 8 : 7}>
                    No queues found.
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map(({ node, level }) => {
                  const queueName = getQueueName(node);
                  const hasChildren = node.children?.length > 0;
                  const expanded = expandedNodes.has(queueName);
                  const selected = getQueueName(selectedQueue) === queueName;
                  const health = getHealth(node);

                  return (
                    <TableRow
                      hover
                      key={queueName}
                      onClick={() => onSelectQueue(node)}
                      sx={{
                        bgcolor: selected ? "#fff7f3" : "inherit",
                        cursor: "pointer",
                        height: 64,
                        "& td": {
                          borderBottom: "1px solid #e6e9ed",
                          color: "text.primary",
                          fontSize: 13,
                        },
                      }}
                    >
                      <QueueTreeCell
                        expanded={expanded}
                        hasChildren={hasChildren}
                        level={level}
                        node={node}
                        onSelectQueue={onSelectQueue}
                        onToggle={handleToggle}
                      />
                      <TableCell>
                        <QueueStatusBadge state={getStatus(node)} />
                      </TableCell>
                      <TableCell sx={tableNumericSx}>
                        {getPriorityWeight(node)}
                      </TableCell>
                      <TableCell sx={{ minWidth: 420 }}>
                        <QueueResourceUsageBars queue={node} />
                      </TableCell>
                      <TableCell sx={tableNumericSx}>
                        {getRunningPodGroups(node)}
                      </TableCell>
                      <TableCell sx={tableNumericSx}>
                        {getPendingInqueuePodGroups(node)}
                      </TableCell>
                      <TableCell>
                        <QueueHealthBadge health={health} />
                      </TableCell>
                      {canWrite && (
                        <TableCell>
                          <IconButton size="small">
                            <MoreVertIcon
                              sx={{
                                fontSize: 16,
                              }}
                            />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box
          sx={{
            alignItems: "center",
            borderTop: "1px solid #dfe3e8",
            display: "flex",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 13 }}>
            Total {totalQueues || visibleRows.length}
          </Typography>
          <QueuePagination
            pagination={pagination}
            totalQueues={totalQueues || visibleRows.length}
            handleChangeRowsPerPage={onRowsPerPageChange}
            handleChangePage={onPageChange}
          />
        </Box>
      </Paper>
      <QueueLegendPanel />
      <QueueDetailsPanel
        onClose={onCloseQueueDetails}
        onYamlSaved={onYamlSaved}
        canWrite={canWrite}
        selectedQueue={selectedQueue}
        queueMap={queueMap}
      />
    </Box>
  );
};

export default QueueHierarchyView;
