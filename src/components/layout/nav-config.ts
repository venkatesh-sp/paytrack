import {
  LayoutDashboard,
  ListChecks,
  CalendarClock,
  History,
  BarChart3,
  Bell,
  HandCoins,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tracking Items", href: "/tracking-items", icon: ListChecks },
  { title: "Monthly Payables", href: "/payables", icon: CalendarClock },
  { title: "Lending", href: "/lending", icon: HandCoins },
  { title: "Payment History", href: "/payment-history", icon: History },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Notifications", href: "/notifications", icon: Bell },
];

export const secondaryNavItems: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];
