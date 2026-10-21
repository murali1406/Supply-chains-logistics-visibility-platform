import { useAuth } from "../../context/AuthContext";
import AdminDashboardPage from "./AdminDashboardPage";
import UserDashboardPage from "./UserDashboardPage";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "ADMIN") {
    return <AdminDashboardPage />;
  }

  return <UserDashboardPage />;
}
