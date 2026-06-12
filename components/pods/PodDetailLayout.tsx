import React from "react";
import {
  type SxProps,
  type Theme,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export const panelBorder = "#dfe3e8";
export const panelBg = "#ffffff";
export const subtleBg = "#f7f8fa";

export const detailLabelSx = {
  color: "text.secondary",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.01em",
};

export const detailValueSx = {
  color: "text.primary",
  fontFamily:
    '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: 12.5,
};

export const headerMetaLabelSx = {
  color: "text.secondary",
  fontSize: 12,
  fontWeight: 500,
};

export const headerMetaValueSx = {
  color: "text.primary",
  fontSize: 12.5,
  fontWeight: 500,
};

export const terminalSx = {
  bgcolor: "#171717",
  border: "1px solid #242424",
  borderRadius: 1,
  color: "#e5e7eb",
  fontFamily:
    '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: 12.5,
  lineHeight: 1.55,
  m: 0,
  minHeight: 520,
  overflow: "auto",
  p: 2,
  whiteSpace: "pre",
};

const sectionTitleSx = {
  fontSize: 14,
  fontWeight: 700,
  mb: 1.25,
};

const sectionCardSx = {
  bgcolor: "#ffffff",
  border: `1px solid ${panelBorder}`,
  borderRadius: 1,
  boxShadow: "none",
  p: 2,
};

export const PlainPodDetailTable = ({ columns, rows, emptyText = "-" }) => (
  <Table
    size="small"
    sx={{
      border: `1px solid ${panelBorder}`,
      borderRadius: 1,
      overflow: "hidden",
      "& .MuiTableCell-root": {
        borderBottom: `1px solid ${panelBorder}`,
        fontSize: 12.5,
        px: 1.5,
        py: 1,
      },
      "& .MuiTableHead-root .MuiTableCell-root": {
        bgcolor: subtleBg,
        fontWeight: 700,
      },
      "& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root":
        {
          borderBottom: 0,
        },
    }}
  >
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell key={column.key}>{column.label}</TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            sx={{ color: "text.secondary", textAlign: "center" }}
          >
            {emptyText}
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row, index) => (
          <TableRow key={`${columns[0].key}-${index}`}>
            {columns.map((column) => (
              <TableCell key={column.key}>{row[column.key] ?? "-"}</TableCell>
            ))}
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

export const PodDetailGridRow = ({ label, value }) => (
  <Box
    sx={{
      display: "grid",
      gap: 1,
      gridTemplateColumns: "132px minmax(0, 1fr)",
      py: 0.5,
    }}
  >
    <Typography sx={detailLabelSx}>{label}</Typography>
    <Typography sx={detailValueSx}>{value}</Typography>
  </Box>
);

type PodDetailSectionCardProps = {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  title: React.ReactNode;
};

export const PodDetailSectionCard = ({
  children,
  sx,
  title,
}: PodDetailSectionCardProps) => (
  <Box sx={{ ...sectionCardSx, ...sx }}>
    <Typography sx={sectionTitleSx}>{title}</Typography>
    {children}
  </Box>
);

export const PodDetailsPlaceholderPanel = ({ title }) => (
  <Box
    sx={{
      alignItems: "center",
      border: `1px dashed ${panelBorder}`,
      borderRadius: 1,
      color: "text.secondary",
      display: "flex",
      fontSize: 13,
      justifyContent: "center",
      minHeight: 220,
      px: 2,
      textAlign: "center",
    }}
  >
    {title} is not wired up yet for the live cluster API.
  </Box>
);
