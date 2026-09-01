import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventori from "./pages/Inventori";
import Produk from "./pages/Produk";
import Transaksi from "./pages/Transaksi";
import Reorder from "./pages/Reorder";
import Laporan from "./pages/Laporan";
import Users from "./pages/Users";
import AuditLog from "./pages/AuditLog";
import Members from "./pages/Members";
import Register from "./pages/Register";
import Vouchers from "./pages/Vouchers";
import Settings from "./pages/Settings";

import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/produk" element={<AdminRoute><Produk /></AdminRoute>} />
          <Route path="/inventori" element={<AdminRoute><Inventori /></AdminRoute>} />
          <Route path="/transaksi" element={<ProtectedRoute><Transaksi /></ProtectedRoute>} />
          <Route path="/reorder" element={<AdminRoute><Reorder /></AdminRoute>} />
          <Route path="/members" element={<AdminRoute><Members /></AdminRoute>} />
          <Route path="/vouchers" element={<AdminRoute><Vouchers /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          <Route path="/laporan" element={<AdminRoute><Laporan /></AdminRoute>} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/transaksi" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
