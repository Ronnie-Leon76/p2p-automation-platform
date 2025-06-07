import { BarChart3, Bot, CreditCard, DollarSign, Home, Settings, TrendingUp, Users, Wallet } from "lucide-react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Trader Profile",
    url: "/dashboard/profile",
    icon: Users,
  },
  {
    title: "Ad Management",
    url: "/dashboard/ads",
    icon: TrendingUp,
  },
  {
    title: "Order Management",
    url: "/orders",
    icon: DollarSign,
  },
  {
    title: "Pricing Engine",
    url: "/pricing",
    icon: BarChart3,
  },
  {
    title: "Payment Methods",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Automation Bots",
    url: "/bots",
    icon: Bot,
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
  },
]

const exchangeItems = [
  {
    title: "OKX",
    url: "/exchanges/okx",
    icon: Wallet,
  },
  {
    title: "Binance",
    url: "/exchanges/binance",
    icon: Wallet,
  },
  {
    title: "Bybit",
    url: "/exchanges/bybit",
    icon: Wallet,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <span className="font-semibold">P2P Automation</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Exchanges</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exchangeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
