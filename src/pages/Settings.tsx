import { API_BASE_URL, ASSET_BASE_URL } from '../config/apiConfig';
import { panelClass } from '../components/TableTools';

export function Settings() {
  return (
    <section className={panelClass}>
      <h2 className="mt-0 text-2xl font-black tracking-tight text-stone-900">Environment</h2>
      <div className="flex flex-col justify-between gap-2 border-b border-stone-900/10 py-4 md:flex-row">
        <span>API base URL</span>
        <code className="break-all font-extrabold text-emerald-950">{API_BASE_URL}</code>
      </div>
      <div className="flex flex-col justify-between gap-2 border-b border-stone-900/10 py-4 md:flex-row">
        <span>Asset base URL</span>
        <code className="break-all font-extrabold text-emerald-950">{ASSET_BASE_URL}</code>
      </div>
      <div className="flex flex-col justify-between gap-2 border-b border-stone-900/10 py-4 md:flex-row">
        <span>Image policy</span>
        <code className="break-all font-extrabold text-emerald-950">Cloudinary, max 10 photos per product</code>
      </div>
    </section>
  );
}
