import { API_BASE_URL, ASSET_BASE_URL } from '../config/apiConfig';

export function Settings() {
  return (
    <section className="panel settings">
      <h2>Environment</h2>
      <div className="settings-row">
        <span>API base URL</span>
        <code>{API_BASE_URL}</code>
      </div>
      <div className="settings-row">
        <span>Asset base URL</span>
        <code>{ASSET_BASE_URL}</code>
      </div>
      <div className="settings-row">
        <span>Image policy</span>
        <code>Cloudinary, max 10 photos per product</code>
      </div>
    </section>
  );
}
