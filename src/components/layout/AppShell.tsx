import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";

export default function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <AppSidebar />
        <div className="flex min-h-screen flex-col">
          <AppHeader pathname={location.pathname} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}