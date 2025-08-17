"use client";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  BarChart3,
  Bot,
  CreditCard,
  DollarSign,
  Home,
  Settings,
  Signal,
  TrendingUp,
  User as UserIcon,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: UserIcon,
  },
  {
    title: "Ads",
    url: "/dashboard/ads",
    icon: TrendingUp,
    badge: "24",
  },
  {
    title: "Orders",
    url: "/orders",
    icon: DollarSign,
    badge: "12",
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Automation",
    url: "/bots",
    icon: Bot,
    badge: "3",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const exchangeItems = [
  {
    title: "OKX",
    url: "/dashboard/exchanges/okx",
    icon: Wallet,
  },
  {
    title: "Binance",
    url: "/dashboard/exchanges/binance",
    icon: Wallet,
  },
  {
    title: "Bybit",
    url: "/dashboard/exchanges/bybit",
    icon: Wallet,
  },
];

const systemItems = [
  {
    title: "Payments",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
];

export function AppSidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session?.user && !error) {
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Sidebar auth check failed:", error);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <Sidebar className="border-r border-gray-200/50 bg-white">
      <SidebarHeader className="border-b border-gray-100 bg-white px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">P2P Automation</div>
            <div className="text-xs text-gray-500">Trading Platform</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="group h-10 px-3 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                      <span className="font-medium text-sm">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto bg-gray-100 text-gray-600 text-xs h-5 px-2"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-6 border-t border-gray-100" />

        <SidebarGroup>
          <div className="px-3 pb-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Exchanges
            </h4>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {exchangeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="group h-10 px-3 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors duration-200"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" />
                      <span className="font-medium text-sm">{item.title}</span>
                      <div className="ml-auto h-2 w-2 rounded-full bg-green-500" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-6 border-t border-gray-100" />

        <SidebarGroup>
          <div className="px-3 pb-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              System
            </h4>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="group h-10 px-3 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors duration-200"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-gray-600 group-hover:text-gray-700" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 bg-white p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 px-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <Link href="/settings" className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-sm">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Minimal Status Indicator */}
        {isAuthenticated && user && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-700">
                {user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User"}
              </span>
              <Badge
                variant="secondary"
                className="ml-auto bg-green-100 text-green-700 text-xs h-4 px-1.5"
              >
                <Signal className="w-2.5 h-2.5 mr-1" />
                Live
              </Badge>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
