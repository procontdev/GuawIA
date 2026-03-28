import { createBrowserRouter } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import DashboardPage from "../pages/DashboardPage";
import KitchenBoardPage from "../pages/KitchenBoardPage";
import EventLeadsPage from "../pages/EventLeadsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "kitchen", element: <KitchenBoardPage /> },
      { path: "events", element: <EventLeadsPage /> },
    ],
  },
]);