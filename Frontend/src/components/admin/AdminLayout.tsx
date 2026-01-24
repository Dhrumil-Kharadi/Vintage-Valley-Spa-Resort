import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BedDouble, Users, CalendarDays, CreditCard, LogOut } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AdminLayoutProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Rooms", to: "/admin/rooms", icon: BedDouble },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarDays },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
];

const AdminLayout = ({ title, description, children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/admin-api/auth/me", { credentials: "include" });
        if (!res.ok) {
          navigate("/admin/login", { replace: true });
        }
      } catch {
        navigate("/admin/login", { replace: true });
      }
    };

    run();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch("/admin-api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
    } finally {
      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r border-gold/10">
        <SidebarHeader className="p-4">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gold text-gray-800 flex items-center justify-center font-bold">
              VV
            </div>
            <div className="leading-tight">
              <div className="font-playfair text-lg font-bold text-ivory">Vintage Valley</div>
              <div className="text-ivory/70 text-sm">Admin Panel</div>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarMenu>
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link to={item.to}>
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gold text-gray-800 px-4 py-2 font-semibold hover:bg-bronze transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-ivory">
        <div className="sticky top-0 z-20 border-b border-gold/10 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-gray-800" />
              <div>
                {title && <div className="font-playfair text-xl font-bold text-gray-800">{title}</div>}
                {description && <div className="text-gray-800/70 text-sm">{description}</div>}
              </div>
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
