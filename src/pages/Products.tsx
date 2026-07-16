import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit, Plus, Star, Trash2, Upload } from 'lucide-react';
import api from '../api/client';
import { endpoints, ASSET_BASE_URL } from '../config/apiConfig';
import { Product, ProductImage } from '../types';

const categories = ['plants', 'seeds', 'tools', 'planters', 'other'];

const imageUrl = (product: Product) => {
  const url = product.thumbnail_url || product.image_url;
  if (!url) return 'https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=200&auto=format&fit=crop';
  return url.startsWith('http') ? url : `${ASSET_BASE_URL}${url}`;
};

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || 'plants',
    stock: product?.stock?.toString() || '0',
    is_featured: !!product?.is_featured,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [defaultIndex, setDefaultIndex] = useState(0);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
    files.forEach((file) => data.append('images', file));
    data.append('defaultIndex', String(defaultIndex));
    data.append('thumbnailIndex', String(thumbnailIndex));

    if (product) {
      const existingImages = (product.images || []).map((image: ProductImage) => ({
        url: image.url,
        public_id: image.public_id || null,
        is_default: image.is_default,
        is_thumbnail: image.is_thumbnail,
      }));
      data.append('imagesMetadata', JSON.stringify(existingImages));
      data.append('keepExistingImages', 'true');
    }

    try {
      setSaving(true);
      if (product) {
        await api.put(endpoints.products.detail(product.id), data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(endpoints.products.list, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(product ? 'Product updated' : 'Product added');
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <h2>{product ? 'Edit product' : 'Add product'}</h2>
          <button type="button" className="secondary-button" onClick={onClose}>Close</button>
        </div>
        <div className="form-grid">
          <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label>Price<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} type="number" step="0.01" required /></label>
          <label>Stock<input value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} type="number" min="0" required /></label>
          <label className="full">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} /> Featured product</label>
          <label className="file-input full">
            <Upload size={18} />
            Upload photos
            <input type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 10))} />
          </label>
          {files.length > 0 && (
            <div className="image-options full">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`}>
                  <span>{file.name}</span>
                  <button type="button" className={defaultIndex === index ? 'chip active' : 'chip'} onClick={() => setDefaultIndex(index)}>Default</button>
                  <button type="button" className={thumbnailIndex === index ? 'chip active' : 'chip'} onClick={() => setThumbnailIndex(index)}>Thumb</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save product'}</button>
      </form>
    </div>
  );
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const loadProducts = async () => {
    const res = await api.get(`${endpoints.products.list}?limit=100`);
    setProducts(res.data.products);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const toggleFeatured = async (product: Product) => {
    await api.put(endpoints.products.featuredStatus(product.id), { is_featured: !product.is_featured });
    toast.success('Featured status updated');
    loadProducts();
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    await api.delete(endpoints.products.detail(product.id));
    toast.success('Product deleted');
    loadProducts();
  };

  return (
    <section className="panel">
      <div className="panel-actions">
        <button className="primary-button" onClick={() => { setEditingProduct(null); setFormOpen(true); }}>
          <Plus size={18} /> Add product
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    <img src={imageUrl(product)} alt={product.name} />
                    <strong>{product.name}</strong>
                  </div>
                </td>
                <td>{product.category}</td>
                <td>Rs. {parseFloat(product.price).toFixed(2)}</td>
                <td>{product.stock}</td>
                <td><button className={product.is_featured ? 'icon-button active' : 'icon-button'} onClick={() => toggleFeatured(product)}><Star size={16} /></button></td>
                <td>
                  <div className="row-actions">
                    <button className="icon-button" onClick={() => { setEditingProduct(product); setFormOpen(true); }}><Edit size={16} /></button>
                    <button className="icon-button danger" onClick={() => deleteProduct(product)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {formOpen && <ProductForm product={editingProduct} onClose={() => setFormOpen(false)} onSaved={loadProducts} />}
    </section>
  );
}
