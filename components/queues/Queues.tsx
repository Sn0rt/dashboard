import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  LinearProgress,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import { API_BASE } from "../../lib/client/dashboard-api";
import CreateDialog from "../CreateDialog";
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";
import { useAuth } from "../auth/AuthProvider";
import ReadOnlyActionTooltip from "../access/ReadOnlyActionTooltip";
import QueueHierarchyView from "./QueueHierarchyView";
import QueueSummaryCards from "./QueueSummaryCards";
import { buildQueueTree } from "./utils/queueTreeBuilder";
import { getQueueName, getQueueSearchBlob } from "./queueViewModel";

const Queues = () => {
  const auth = useAuth();
  const canWrite = auth?.canWrite !== false;
  const isReadOnly = !canWrite;
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedQueueName, setSelectedQueueName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 10 });
  const [totalQueues, setTotalQueues] = useState(0);
  const [filters, setFilters] = useState({
    queue: "All",
  });

  const fetchQueues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: searchText,
        state: "All",
        queue: filters.queue,
        page: pagination.page,
        limit: pagination.rowsPerPage,
      };

      const response = await axios.get(`${API_BASE}/queues`, { params });
      setQueues(response.data.items || []);
      setTotalQueues(response.data.totalCount || 0);
    } catch (err) {
      setError("Failed to fetch queues: " + err.message);
      setQueues([]);
      setTotalQueues(0);
    } finally {
      setLoading(false);
    }
  }, [filters.queue, pagination.page, pagination.rowsPerPage, searchText]);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  const filteredQueues = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return queues.filter((queue) => {
      const matchesQueue =
        filters.queue === "All" || getQueueName(queue) === filters.queue;
      const matchesSearch = !query || getQueueSearchBlob(queue).includes(query);
      return matchesQueue && matchesSearch;
    });
  }, [filters.queue, queues, searchText]);

  const queueMap = useMemo(() => {
    return new Map(filteredQueues.map((queue) => [getQueueName(queue), queue]));
  }, [filteredQueues]);

  const treeData = useMemo(
    () => buildQueueTree(filteredQueues),
    [filteredQueues],
  );

  const selectedQueue = useMemo(() => {
    if (selectedQueueName && queueMap.has(selectedQueueName)) {
      return queueMap.get(selectedQueueName);
    }
    return null;
  }, [queueMap, selectedQueueName]);

  const handleCreateQueue = async (newQueue) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/queues`, newQueue);

      if (response.status !== 201) {
        alert("Failed to create queue: " + response.statusText);
        return;
      }

      setCreateDialogOpen(false);
      fetchQueues();
    } catch (err) {
      alert("Network error: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((event) => {
    setSearchText(event.target.value);
    setPagination((previous) => ({ ...previous, page: 1 }));
  }, []);

  const handleChangePage = (event, newPage) => {
    setPagination((previous) => ({ ...previous, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination((previous) => ({
      ...previous,
      rowsPerPage: Number(event.target.value),
      page: 1,
    }));
  };

  const queueFilterOptions = useMemo(
    () => ["All", ...new Set(queues.map((queue) => getQueueName(queue)))],
    [queues],
  );

  const filterFields = useMemo(
    () => [
      {
        key: "queue",
        label: "Queue",
        onChange: (value) => {
          setFilters((prev) => ({ ...prev, queue: value }));
          setPagination((prev) => ({ ...prev, page: 1 }));
        },
        options: queueFilterOptions,
        type: "select",
        value: filters.queue,
      },
      {
        key: "search",
        label: "Search",
        onChange: (value) => handleSearch({ target: { value } }),
        placeholder: "Search name, label, parent...",
        sx: {
          flex: { xs: "1 1 100%", lg: "0 0 320px" },
          minWidth: { xs: "100%", lg: 320 },
        },
        textFieldProps: {
          InputProps: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        },
        type: "text",
        value: searchText,
      },
    ],
    [filters.queue, handleSearch, queueFilterOptions, searchText],
  );

  return (
    <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          component="h1"
          sx={{ fontSize: 24, fontWeight: 600, letterSpacing: 0.2 }}
        >
          Queues
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
          Inspect scheduling state and resource pressure across CPU, memory, and
          GPU.
        </Typography>
      </Box>

      {error && (
        <Card
          sx={{
            border: "1px solid #f5c2c7",
            boxShadow: "none",
            mb: 2,
          }}
        >
          <CardContent sx={{ py: 1.5 }}>
            <Typography color="error" sx={{ fontSize: 14 }}>
              {error}
            </Typography>
          </CardContent>
        </Card>
      )}

      <QueueSummaryCards queues={queues} totalQueues={totalQueues} />

      <Box
        sx={{
          alignItems: { xs: "stretch", md: "flex-start" },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <SchedulingTableFilters fields={filterFields} />
        </Box>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
          <Button
            disabled={loading}
            onClick={fetchQueues}
            startIcon={<RefreshIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
            variant="outlined"
          >
            Refresh
          </Button>
          <ReadOnlyActionTooltip readOnly={isReadOnly}>
            <Button
              disabled={isReadOnly}
              onClick={() => setCreateDialogOpen(true)}
              startIcon={<AddIcon fontSize="small" />}
              sx={{
                bgcolor: "#ff4d2d",
                textTransform: "none",
                "&:hover": { bgcolor: "#e84325" },
              }}
              variant="contained"
            >
              Create Queue
            </Button>
          </ReadOnlyActionTooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <QueueHierarchyView
        treeData={treeData}
        selectedQueue={selectedQueue}
        queueMap={queueMap}
        pagination={pagination}
        totalQueues={filteredQueues.length || totalQueues}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        canWrite={canWrite}
        onSelectQueue={(queue) => setSelectedQueueName(getQueueName(queue))}
        onCloseQueueDetails={() => setSelectedQueueName("")}
        onYamlSaved={fetchQueues}
      />

      {!isReadOnly && (
        <CreateDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCreate={handleCreateQueue}
          title="Create a Queue"
          resourceNameLabel="Queue Name"
          resourceType="Queue"
        />
      )}
    </Box>
  );
};

export default Queues;
