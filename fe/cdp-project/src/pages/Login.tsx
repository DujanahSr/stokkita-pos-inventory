import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, ShoppingBag, TrendingUp, Package, Users } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Package, title: "Manajemen Stok", desc: "Kelola inventaris sepatu dengan mudah" },
    { icon: TrendingUp, title: "Analisis Penjualan", desc: "Pantau performa bisnis real-time" },
    { icon: Users, title: "Multi Pengguna", desc: "Kolaborasi tim yang efisien" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Soft Dark Red Theme */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background Image - Tema Sepatu Profesional */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop')`,
          }}
        />

        {/* Gradient Overlay - Lebih gelap dan elegan */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-amber-950/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">StokKita</h1>
              <p className="text-xs text-white/60">Premium Shoe Management</p>
            </div>
          </div>

          {/* Main Content - Diperpendek */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Temukan Gaya Anda<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                  di Toko Kami
                </span>
              </h2>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Kelola stok sepatu, penjualan, dan bisnis UMKM Anda dengan lebih profesional.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-white/60 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white"
                >
                  {i}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/70">
              <span className="text-white font-semibold">500+</span> UMKM sepatu telah bergabung
            </p>
          </div>
        </div>
      </div>


      {/* Right Side - Soft Dark Transparent */}
      {/* Right Side */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-950 via-rose-950/80 to-black">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
              <ShoppingBag className="w-7 h-7 text-amber-400" />
            </div>

            <h1 className="text-2xl font-bold text-white">
              StokKita
            </h1>

            <p className="text-white/60 text-sm mt-1">
              Premium Shoe Management
            </p>
          </div>

          {/* Login Card */}
          <div
            className="
      bg-white/[0.06]
      backdrop-blur-3xl
      border border-white/10
      rounded-3xl
      p-8 lg:p-10
      shadow-[0_20px_60px_rgba(0,0,0,0.5)]
    "
          >
            {/* Header */}
            <div className="mb-8">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white/60">
                  Sistem Manajemen UMKM Sepatu
                </span>
              </div>

              <h2 className="text-3xl font-bold text-white">
                Selamat <span className="text-amber-400">Datang</span>
              </h2>

              <p className="text-white/70 mt-2">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                  className="
            w-full
            px-5
            py-3.5
            bg-white/10
            border
            border-white/10
            rounded-2xl
            text-white
            placeholder:text-white/50
            focus:outline-none
            focus:ring-2
            focus:ring-amber-400
            focus:border-transparent
            transition-all
            duration-300
          "
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    className="
              w-full
              px-5
              py-3.5
              pr-12
              bg-white/10
              border
              border-white/10
              rounded-2xl
              text-white
              placeholder:text-white/50
              focus:outline-none
              focus:ring-2
              focus:ring-amber-400
              focus:border-transparent
              transition-all
              duration-300
            "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="
              absolute
              right-5
              top-1/2
              -translate-y-1/2
              text-white/50
              hover:text-amber-400
              transition-colors
            "
                  >
                    {showPass ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>


              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="
          w-full
          py-4
          rounded-2xl
          bg-gradient-to-r
          from-red-700
          via-red-600
          to-red-700
          border border-red-500/20
          text-white
          font-semibold
          text-base
          hover:brightness-110
          transition-all
          duration-300
          shadow-lg
          shadow-red-900/30
          disabled:opacity-70
        "
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>


          </div>

          {/* Footer */}
          <p className="text-center text-white/40 text-xs mt-8">
            © {new Date().getFullYear()} StokKita · Sistem Manajemen UMKM Sepatu
          </p>

        </div>
      </div>
    </div>
  );
}