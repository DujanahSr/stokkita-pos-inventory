import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }: any) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user?.role?.toLowerCase() !== "admin") return <Navigate to="/transaksi" replace />;
  return children;
}
