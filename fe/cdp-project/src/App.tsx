import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventori from "./pages/Inventori";
import Transaksi from "./pages/Transaksi";
import Reorder from "./pages/Reorder";
import Laporan from "./pages/Laporan";
import Users from "./pages/Users";
import Register from "./pages/Register";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/inventori" element={<AdminRoute><Inventori /></AdminRoute>} />
          <Route path="/transaksi" element={<ProtectedRoute><Transaksi /></ProtectedRoute>} />
          <Route path="/reorder" element={<AdminRoute><Reorder /></AdminRoute>} />
          <Route path="/laporan" element={<AdminRoute><Laporan /></AdminRoute>} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/transaksi" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
