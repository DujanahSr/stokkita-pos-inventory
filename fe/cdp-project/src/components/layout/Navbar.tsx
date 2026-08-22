export default function Navbar({ title }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center pl-16 lg:pl-6 pr-6">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
    </header>
  );
}