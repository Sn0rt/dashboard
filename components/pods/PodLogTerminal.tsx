import React from "react";
import { Box } from "@mui/material";
import { terminalSx } from "./PodDetailLayout";
import { lineLevelColor } from "./podDetailsViewModel";

const PodLogTerminal = ({ content, terminalRef }) => {
  const lines = (content || "No logs available.").split("\n");

  return (
    <Box component="pre" ref={terminalRef} sx={terminalSx}>
      {lines.map((line, index) => {
        const match = line.match(
          /^(\S+\s+)?(INFO|WARN|WARNING|ERROR|ERR|DEBUG|TRACE|FATAL|PANIC)\b(.*)$/i,
        );

        return (
          <Box
            component="span"
            key={`${index}-${line.slice(0, 20)}`}
            sx={{ display: "block" }}
          >
            <Box
              component="span"
              sx={{
                color: "#6b7280",
                display: "inline-block",
                pr: 2,
                textAlign: "right",
                width: 36,
              }}
            >
              {index + 1}
            </Box>
            {match ? (
              <>
                <Box component="span" sx={{ color: "#cbd5e1" }}>
                  {match[1] || ""}
                </Box>
                <Box
                  component="span"
                  sx={{
                    color: lineLevelColor(match[2]),
                    fontWeight: 700,
                    pr: 1.5,
                  }}
                >
                  {match[2].toUpperCase()}
                </Box>
                <Box component="span">{match[3]}</Box>
              </>
            ) : (
              <Box component="span" sx={{ color: lineLevelColor(line) }}>
                {line}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default PodLogTerminal;
