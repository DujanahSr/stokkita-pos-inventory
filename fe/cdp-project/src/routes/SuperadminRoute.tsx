import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SuperadminRoute({ children }: any) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user?.role?.toLowerCase() !== "superadmin") {
    return <Navigate to="/" replace />;
  }
  return children;
}
