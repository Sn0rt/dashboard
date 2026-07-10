import { Icons } from "@/components/icons";

export interface NavItem {
  title: string;
  icon?: keyof typeof Icons;
  href: string;
  disable?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        icon: "dashboard",
        href: "/dashboard",
      },
    ],
  },
  {
    title: "Scheduling",
    items: [
      {
        title: "Jobs",
        icon: "notepad",
        href: "/scheduling/jobs",
      },
      {
        title: "PodGroups",
        icon: "container",
        href: "/scheduling/podgroups",
      },
      {
        title: "Queues",
        icon: "cloud",
        href: "/scheduling/queues",
      },
    ],
  },
  {
    title: "Workloads",
    items: [
      {
        title: "Pods",
        icon: "waypoint",
        href: "/workload/pods",
      },
    ],
  },
];
