import React from "react";
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Divider,
    Typography,
} from "@mui/material";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

const documentCards = [
    {
        title: "User Guide",
        description:
            "Read the Volcano user guide for workload management and scheduling workflows.",
        href: "https://volcano.sh/docs/UserGuide/user_guide",
        icon: <MenuBookOutlinedIcon sx={{ fontSize: 20 }} />,
        linkText: "Open user guide",
    },
    {
        title: "Core Concepts",
        description: "Review the Queue concept and how Volcano organizes jobs.",
        href: "https://volcano.sh/docs/Concepts/Queue",
        icon: <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />,
        linkText: "Open queue concept",
    },
    {
        title: "API Documentation",
        description:
            "Browse the Volcano Go API package reference for integration details.",
        href: "https://pkg.go.dev/volcano.sh/apis",
        icon: <CodeOutlinedIcon sx={{ fontSize: 20 }} />,
        linkText: "Open API docs",
    },
];

const Documentation = () => {
    return (
        <Box
            sx={{ bgcolor: "#f7f8fa", minHeight: "calc(100vh - 64px)", p: 0.5 }}
        >
            <Card sx={{ border: "1px solid #dfe3e8", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography
                        component="h1"
                        sx={{ fontSize: 22, fontWeight: 700 }}
                    >
                        Documentation
                    </Typography>
                    <Typography
                        color="text.secondary"
                        sx={{ fontSize: 13, mt: 0.5 }}
                    >
                        Quick links for operating and extending Volcano
                        Dashboard.
                    </Typography>
                    <Divider sx={{ my: 2.5 }} />
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                            gridTemplateColumns: {
                                xs: "1fr",
                                lg: "repeat(3, 1fr)",
                            },
                        }}
                    >
                        {documentCards.map((card) => (
                            <Card
                                component="article"
                                key={card.title}
                                sx={{
                                    border: "1px solid #e1e4e8",
                                    borderRadius: 1,
                                    boxShadow: "none",
                                    height: "100%",
                                }}
                            >
                                <CardActionArea
                                    component="a"
                                    href={card.href}
                                    rel="noreferrer"
                                    sx={{ height: "100%", p: 2 }}
                                    target="_blank"
                                >
                                    <Box
                                        sx={{
                                            alignItems: "center",
                                            display: "flex",
                                            gap: 1,
                                            mb: 1,
                                        }}
                                    >
                                        {card.icon}
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {card.title}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontSize: 13 }}
                                    >
                                        {card.description}
                                    </Typography>
                                    <Box
                                        sx={{
                                            alignItems: "center",
                                            color: "primary.main",
                                            display: "flex",
                                            gap: 0.75,
                                            mt: 2,
                                        }}
                                    >
                                        <Typography sx={{ fontSize: 13 }}>
                                            {card.linkText}
                                        </Typography>
                                        <OpenInNewOutlinedIcon
                                            sx={{ fontSize: 15 }}
                                        />
                                    </Box>
                                </CardActionArea>
                            </Card>
                        ))}
                    </Box>
                    <Box
                        sx={{
                            border: "1px solid #e1e4e8",
                            borderRadius: 1,
                            mt: 2,
                            p: 2,
                        }}
                    >
                        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                            Official References
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: 13, mt: 1 }}
                        >
                            These links open the upstream Volcano documentation
                            for user workflows, scheduling concepts, and API
                            packages.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Documentation;
