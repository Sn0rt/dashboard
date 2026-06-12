"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Box,
    Breadcrumbs,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Link as MuiLink,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import DeviceHubOutlinedIcon from "@mui/icons-material/DeviceHubOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { useAuth } from "./auth/AuthProvider";
import ReadOnlyModeBanner from "./access/ReadOnlyModeBanner";

const drawerWidth = 280;
const collapsedDrawerWidth = 60;
const iconProps = { sx: { fontSize: 18 } };

const menuSections = [
    {
        items: [
            {
                text: "Overview",
                icon: <HomeOutlinedIcon {...iconProps} />,
                path: "/dashboard",
            },
        ],
    },
    {
        title: "Scheduling",
        items: [
            {
                text: "Queues",
                icon: <DeviceHubOutlinedIcon {...iconProps} />,
                path: "/scheduling/queues",
            },
            {
                text: "Jobs",
                icon: <WorkOutlineOutlinedIcon {...iconProps} />,
                path: "/scheduling/jobs",
            },
            {
                text: "CronJob",
                icon: <EventRepeatOutlinedIcon {...iconProps} />,
                path: "/scheduling/cronjobs",
            },
            {
                text: "Pod Groups",
                icon: <DeviceHubOutlinedIcon {...iconProps} />,
                path: "/scheduling/podgroups",
            },
        ],
    },
    {
        title: "Workloads",
        items: [
            {
                text: "Pods",
                icon: <Inventory2OutlinedIcon {...iconProps} />,
                path: "/workload/pods",
            },
        ],
    },
    {
        title: "System",
        items: [
            {
                text: "Configuration",
                icon: <TuneOutlinedIcon {...iconProps} />,
                path: "/system/configuration",
            },
            {
                text: "Cluster Information",
                icon: <DnsOutlinedIcon {...iconProps} />,
                path: "/system/cluster-information",
            },
        ],
    },
];

const footerItems = [
    {
        text: "Documentation",
        icon: <DescriptionOutlinedIcon {...iconProps} />,
        path: "/documentation",
    },
];

const routeLabels = {
    dashboard: "Overview",
    documentation: "Documentation",
    scheduling: "Scheduling",
    queues: "Queues",
    jobs: "Jobs",
    cronjobs: "CronJob",
    podgroups: "Pod Groups",
    workload: "Workloads",
    pods: "Pods",
    system: "System",
    configuration: "Configuration",
    "cluster-information": "Cluster Information",
};

const DashboardBreadcrumbs = ({ pathname }) => {
    const segments = pathname.split("/").filter(Boolean);
    const visibleSegments =
        segments[0] === "dashboard" ? ["dashboard"] : segments;

    const crumbs = [
        {
            href: "/dashboard",
            label: "Home",
        },
        ...visibleSegments.map((segment, index) => ({
            href: `/${visibleSegments.slice(0, index + 1).join("/")}`,
            label: routeLabels[segment] || segment,
        })),
    ];

    return (
        <Breadcrumbs
            aria-label="breadcrumb"
            separator="/"
            sx={{
                color: "text.secondary",
                fontSize: 12,
                mb: 2.5,
                "& .MuiBreadcrumbs-separator": {
                    color: "text.secondary",
                    mx: 1,
                },
            }}
        >
            {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return isLast ? (
                    <Typography
                        key={`${crumb.href}-${crumb.label}`}
                        color="text.primary"
                        sx={{ fontSize: 12, fontWeight: 600 }}
                    >
                        {crumb.label}
                    </Typography>
                ) : (
                    <MuiLink
                        component={Link}
                        href={crumb.href}
                        key={`${crumb.href}-${crumb.label}`}
                        sx={{
                            color: "text.secondary",
                            fontSize: 12,
                            fontWeight: 500,
                            textDecoration: "none",
                            "&:hover": {
                                color: "text.primary",
                                textDecoration: "none",
                            },
                        }}
                    >
                        {crumb.label}
                    </MuiLink>
                );
            })}
        </Breadcrumbs>
    );
};

export default function DashboardShell({ children }) {
    const theme = useTheme();
    const overlayDrawerMatch = useMediaQuery(theme.breakpoints.down("lg"));
    const pathname = usePathname();
    const auth = useAuth();
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(true);
    const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
    const [readOnlyBannerDismissed, setReadOnlyBannerDismissed] =
        useState(false);
    const isOverlayDrawer = mounted && overlayDrawerMatch;
    const showAdminMenu = auth?.authConfig?.authRequired !== false;
    const accessMode = auth?.accessMode || auth?.authConfig?.accessMode || "";
    const isReadOnly = accessMode === "read-only";
    const accountUser = auth?.user || auth?.identity?.user || {};
    const accountName =
        accountUser.displayName ||
        accountUser.username ||
        auth?.identity?.username ||
        "admin";
    const accountEmail = accountUser.email || "";
    const accountRole =
        accessMode === "read-write"
            ? "Read-write access"
            : accessMode === "read-only"
              ? "Read-only access"
              : "Dashboard user";
    const accountMenuOpen = Boolean(accountMenuAnchor);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setOpen((previous) =>
            isOverlayDrawer ? false : previous === false ? false : true,
        );
    }, [isOverlayDrawer]);

    const handleAccountMenuOpen = (event) => {
        setAccountMenuAnchor(event.currentTarget);
    };

    const handleAccountMenuClose = () => {
        setAccountMenuAnchor(null);
    };

    const handleLogout = () => {
        handleAccountMenuClose();
        void auth?.logout?.();
    };

    const renderMenuItem = (item) => {
        const active =
            item.path &&
            (pathname === item.path || pathname.startsWith(`${item.path}/`));
        const itemStyles = {
            minHeight: 38,
            mx: open ? 1.25 : 0.75,
            my: 0.25,
            px: open ? 1.25 : 1,
            borderRadius: "6px",
            color: item.disabled ? "text.disabled" : "text.primary",
            justifyContent: open ? "flex-start" : "center",
            "&.active": {
                bgcolor: "rgba(0, 0, 0, 0.08)",
                "& .MuiListItemIcon-root": {
                    color: "text.primary",
                },
                "& .MuiListItemText-primary": {
                    color: "text.primary",
                    fontWeight: 600,
                },
            },
            "&:hover": {
                backgroundColor: item.disabled
                    ? "transparent"
                    : "rgba(0, 0, 0, 0.08)",
            },
        };

        const content = item.disabled ? (
            <ListItem
                key={item.text}
                aria-disabled="true"
                sx={{
                    ...itemStyles,
                    cursor: "not-allowed",
                    opacity: 0.58,
                }}
            >
                <ListItemIcon
                    sx={{
                        minWidth: open ? 34 : 0,
                        color: "inherit",
                        justifyContent: "center",
                    }}
                >
                    {item.icon}
                </ListItemIcon>
                {open && (
                    <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: 13 }}
                    />
                )}
            </ListItem>
        ) : (
            <ListItemButton
                key={item.text}
                component={Link}
                href={item.path}
                className={active ? "active" : ""}
                onClick={() => {
                    if (isOverlayDrawer) {
                        setOpen(false);
                    }
                }}
                sx={itemStyles}
            >
                <ListItemIcon
                    sx={{
                        minWidth: open ? 34 : 0,
                        color: "inherit",
                        justifyContent: "center",
                    }}
                >
                    {item.icon}
                </ListItemIcon>
                {open && (
                    <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: 13 }}
                    />
                )}
            </ListItemButton>
        );

        return !open ? (
            <Tooltip key={item.text} title={item.text} placement="right">
                {content}
            </Tooltip>
        ) : (
            <React.Fragment key={item.text}>{content}</React.Fragment>
        );
    };

    const drawerPaperSx = useMemo(
        () => ({
            width: isOverlayDrawer
                ? drawerWidth
                : open
                  ? drawerWidth
                  : collapsedDrawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#f5f5f5",
            transition: "width 0.2s",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
        }),
        [isOverlayDrawer, open],
    );

    const drawerContent = (
        <>
            <Box
                sx={{
                    alignItems: "center",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                    display: "flex",
                    gap: open ? 1.25 : 0,
                    justifyContent: open ? "flex-start" : "center",
                    minHeight: 58,
                    px: open ? 1.5 : 0,
                }}
            >
                <IconButton
                    aria-label="toggle drawer"
                    onClick={() => setOpen((value) => !value)}
                    size="small"
                    sx={{ color: "text.primary" }}
                >
                    <MenuIcon sx={{ fontSize: 20 }} />
                </IconButton>
                {open && (
                    <Typography
                        component="div"
                        noWrap
                        sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                        Volcano Dashboard
                    </Typography>
                )}
            </Box>
            <Box sx={{ overflow: "hidden auto", flexGrow: 1 }}>
                {menuSections.map((section, sectionIndex) => (
                    <Box
                        key={section.title || "primary"}
                        sx={{
                            borderTop:
                                sectionIndex === 0
                                    ? "none"
                                    : "1px solid rgba(0, 0, 0, 0.08)",
                            pt: sectionIndex === 0 ? 1 : 1.25,
                            mt: sectionIndex === 0 ? 0 : 0.75,
                        }}
                    >
                        {open && section.title && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "text.secondary",
                                    display: "block",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: "0.03em",
                                    px: 2,
                                    pb: 0.5,
                                    textTransform: "uppercase",
                                }}
                            >
                                {section.title}
                            </Typography>
                        )}
                        <List dense disablePadding>
                            {section.items.map(renderMenuItem)}
                        </List>
                    </Box>
                ))}
            </Box>
            <Box
                sx={{
                    borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                    px: 0,
                    py: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    mt: "auto",
                }}
            >
                <List dense disablePadding>
                    {footerItems.map(renderMenuItem)}
                </List>
                {showAdminMenu && (
                    <Tooltip
                        disableHoverListener={open}
                        placement="right"
                        title={accountName}
                    >
                        <ListItemButton
                            aria-controls={
                                accountMenuOpen ? "account-menu" : undefined
                            }
                            aria-expanded={
                                accountMenuOpen ? "true" : undefined
                            }
                            aria-haspopup="menu"
                            aria-label="Open account menu"
                            onClick={handleAccountMenuOpen}
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                gap: 1.25,
                                justifyContent: open
                                    ? "space-between"
                                    : "center",
                                minHeight: 34,
                                mx: open ? 1.25 : 0.75,
                                px: open ? 1.25 : 1,
                                borderRadius: "6px",
                                "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 1,
                                    minWidth: 0,
                                }}
                            >
                                <AccountCircleOutlinedIcon {...iconProps} />
                                {open && (
                                    <Typography noWrap sx={{ fontSize: 13 }}>
                                        {accountName}
                                    </Typography>
                                )}
                            </Box>
                            {open && (
                                <ExpandMoreIcon
                                    sx={{
                                        fontSize: 18,
                                        transform: accountMenuOpen
                                            ? "rotate(180deg)"
                                            : "none",
                                        transition: "transform 0.15s",
                                    }}
                                />
                            )}
                        </ListItemButton>
                    </Tooltip>
                )}
                <Menu
                    anchorEl={accountMenuAnchor}
                    anchorOrigin={{
                        horizontal: "left",
                        vertical: "top",
                    }}
                    id="account-menu"
                    onClose={handleAccountMenuClose}
                    open={accountMenuOpen}
                    transformOrigin={{
                        horizontal: "left",
                        vertical: "bottom",
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                border: "1px solid rgba(0, 0, 0, 0.12)",
                                boxShadow:
                                    "0 8px 24px rgba(15, 23, 42, 0.16)",
                                minWidth: 236,
                            },
                        },
                    }}
                >
                    <Box sx={{ px: 2, py: 1.25 }}>
                        <Typography
                            noWrap
                            sx={{ fontSize: 14, fontWeight: 600 }}
                        >
                            {accountName}
                        </Typography>
                        {accountEmail && (
                            <Typography
                                color="text.secondary"
                                noWrap
                                sx={{ fontSize: 12, mt: 0.25 }}
                            >
                                {accountEmail}
                            </Typography>
                        )}
                        <Typography
                            color="text.secondary"
                            noWrap
                            sx={{ fontSize: 12, mt: 0.25 }}
                        >
                            {accountRole}
                        </Typography>
                    </Box>
                    <Divider />
                    <MenuItem
                        aria-label="logout"
                        onClick={handleLogout}
                        sx={{ gap: 1, minHeight: 40 }}
                    >
                        <LogoutOutlinedIcon {...iconProps} />
                        <Typography sx={{ fontSize: 13 }}>Logout</Typography>
                    </MenuItem>
                </Menu>
                <img
                    src="/volcano-icon-color.svg"
                    alt="Volcano Logo"
                    style={{
                        alignSelf: "center",
                        maxWidth: open ? "120px" : "36px",
                        height: "auto",
                        transition: "max-width 0.2s",
                    }}
                />
            </Box>
        </>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            {isOverlayDrawer && !open && (
                <IconButton
                    aria-label="open navigation"
                    onClick={() => setOpen(true)}
                    size="small"
                    sx={{
                        bgcolor: "#ffffff",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
                        left: 12,
                        position: "fixed",
                        top: 12,
                        zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
                        "&:hover": { bgcolor: "#f8fafc" },
                    }}
                >
                    <MenuIcon sx={{ fontSize: 20 }} />
                </IconButton>
            )}

            {isOverlayDrawer ? (
                <Drawer
                    data-testid="sidebar-drawer"
                    ModalProps={{ keepMounted: true }}
                    onClose={() => setOpen(false)}
                    open={open}
                    sx={{
                        [`& .MuiDrawer-paper`]: drawerPaperSx,
                    }}
                    variant="temporary"
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer
                    data-testid="sidebar-drawer"
                    sx={{
                        width: open ? drawerWidth : collapsedDrawerWidth,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: drawerPaperSx,
                    }}
                    variant="permanent"
                >
                    {drawerContent}
                </Drawer>
            )}

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: "#ffffff",
                    minWidth: 0,
                }}
            >
                <DashboardBreadcrumbs pathname={pathname} />
                <ReadOnlyModeBanner
                    open={isReadOnly && !readOnlyBannerDismissed}
                    onClose={() => setReadOnlyBannerDismissed(true)}
                />
                {children}
            </Box>
        </Box>
    );
}
