export default function Modal({ open, onClose, title, children }) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Tutup modal"
				onClick={onClose}
				className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
			/>
			<div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
				<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
					<h2 className="text-sm font-semibold text-slate-900">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
					>
						Tutup
					</button>
				</div>
				<div className="max-h-[80vh] overflow-y-auto px-5 py-4">
					{children}
				</div>
			</div>
		</div>
	);
}
