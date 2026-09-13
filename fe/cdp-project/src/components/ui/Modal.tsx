export default function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Tutup modal"
				onClick={onClose}
				className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
			/>
			<div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#1e2538] bg-[#0b1120] text-slate-100 shadow-2xl shadow-black/90 animate-in fade-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between border-b border-[#1e2538] bg-[#080d1a] px-5 py-3.5">
					<h2 className="text-xs font-serif-luxury uppercase tracking-[0.16em] text-[#e5c483] font-bold">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-2 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-[#141d33] transition"
					>
						Tutup [Esc]
					</button>
				</div>
				<div className="max-h-[80vh] overflow-y-auto px-5 py-4 text-slate-200">
					{children}
				</div>
			</div>
		</div>
	);
}
