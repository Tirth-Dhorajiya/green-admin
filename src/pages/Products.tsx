import { FormEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit, Plus, Star, Trash2, Upload } from 'lucide-react';
import api from '../api/client';
import {
  dangerIconButtonClass,
  iconButtonClass,
  inputClass,
  PageSizeSelect,
  Pagination,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  SortDirection,
  SortHeader,
  tableClass,
  TableToolbar,
  tdClass,
  thClass,
} from '../components/TableTools';
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
    <div className="fixed inset-0 z-20 grid place-items-center overflow-y-auto bg-stone-950/55 p-3">
      <form className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg border border-stone-900/10 bg-white p-5 shadow-2xl" onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="m-0 text-2xl font-black tracking-tight">{product ? 'Edit product' : 'Add product'}</h2>
          <button type="button" className={secondaryButtonClass} onClick={onClose}>Close</button>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-stone-600">Name<input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Category<select className={selectClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Price<input className={inputClass} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} type="number" step="0.01" required /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Stock<input className={inputClass} value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} type="number" min="0" required /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600 md:col-span-2">Description<textarea className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} /></label>
          <label className="flex items-center gap-2 text-sm font-bold text-stone-600"><input className="h-4 w-4 accent-emerald-700" type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} /> Featured product</label>
          <label className="flex items-center gap-3 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-sm font-extrabold text-emerald-950 md:col-span-2">
            <Upload size={18} />
            Upload photos
            <input className="hidden" type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 10))} />
          </label>
          {files.length > 0 && (
            <div className="grid gap-2 md:col-span-2">
              {files.map((file, index) => (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-stone-900/10 p-2" key={`${file.name}-${index}`}>
                  <span className="truncate text-sm font-bold text-stone-500">{file.name}</span>
                  <button type="button" className={`rounded-lg px-2 py-1 text-xs font-extrabold ${defaultIndex === index ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'}`} onClick={() => setDefaultIndex(index)}>Default</button>
                  <button type="button" className={`rounded-lg px-2 py-1 text-xs font-extrabold ${thumbnailIndex === index ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'}`} onClick={() => setThumbnailIndex(index)}>Thumb</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className={primaryButtonClass} disabled={saving}>{saving ? 'Saving...' : 'Save product'}</button>
      </form>
    </div>
  );
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'name' | 'category' | 'price' | 'stock' | 'featured'>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: sortKey === 'featured' ? 'is_featured' : sortKey,
      order: sortDirection,
    });
    if (query) params.set('search', query);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (featuredFilter !== 'all') params.set('featured', featuredFilter === 'featured' ? 'true' : 'false');
    if (stockFilter === 'available') params.set('stockStatus', 'in_stock');
    if (stockFilter === 'low') params.set('stockStatus', 'low_stock');
    if (stockFilter === 'out') params.set('stockStatus', 'out_of_stock');

    const res = await api.get(`${endpoints.products.list}?${params.toString()}`);
    setProducts(res.data.products);
    setTotalCount(res.data.totalCount || 0);
    setTotalPages(res.data.totalPages || 1);
  }, [page, limit, sortKey, sortDirection, query, categoryFilter, stockFilter, featuredFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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

  const updateSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  return (
    <section className={panelClass}>
      <div className="mb-4 flex justify-end">
        <button className={primaryButtonClass} onClick={() => { setEditingProduct(null); setFormOpen(true); }}>
          <Plus size={18} /> Add product
        </button>
      </div>
      <TableToolbar>
        <input className={inputClass} placeholder="Search products" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <select className={selectClass} value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }}>
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select className={selectClass} value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setPage(1); }}>
          <option value="all">All stock</option>
          <option value="available">Available</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <select className={selectClass} value={featuredFilter} onChange={(event) => { setFeaturedFilter(event.target.value); setPage(1); }}>
          <option value="all">All visibility</option>
          <option value="featured">Featured</option>
          <option value="standard">Not featured</option>
        </select>
        <PageSizeSelect value={limit} onChange={(value) => { setLimit(value); setPage(1); }} />
      </TableToolbar>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              <SortHeader label="Product" active={sortKey === 'name'} direction={sortDirection} onSort={() => updateSort('name')} />
              <SortHeader label="Category" active={sortKey === 'category'} direction={sortDirection} onSort={() => updateSort('category')} />
              <SortHeader label="Price" active={sortKey === 'price'} direction={sortDirection} onSort={() => updateSort('price')} />
              <SortHeader label="Stock" active={sortKey === 'stock'} direction={sortDirection} onSort={() => updateSort('stock')} />
              <SortHeader label="Featured" active={sortKey === 'featured'} direction={sortDirection} onSort={() => updateSort('featured')} />
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className={tdClass}>
                  <div className="flex min-w-56 items-center gap-3">
                    <img className="h-12 w-12 rounded-lg object-cover" src={imageUrl(product)} alt={product.name} />
                    <strong>{product.name}</strong>
                  </div>
                </td>
                <td className={tdClass}>{product.category}</td>
                <td className={tdClass}>Rs. {parseFloat(product.price).toFixed(2)}</td>
                <td className={tdClass}>{product.stock}</td>
                <td className={tdClass}><button className={product.is_featured ? `${iconButtonClass} bg-amber-100 text-amber-700 hover:bg-amber-500` : iconButtonClass} onClick={() => toggleFeatured(product)}><Star size={16} /></button></td>
                <td className={tdClass}>
                  <div className="flex gap-2">
                    <button className={iconButtonClass} onClick={() => { setEditingProduct(product); setFormOpen(true); }}><Edit size={16} /></button>
                    <button className={dangerIconButtonClass} onClick={() => deleteProduct(product)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr>
                <td colSpan={6} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No products match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
      {formOpen && <ProductForm product={editingProduct} onClose={() => setFormOpen(false)} onSaved={loadProducts} />}
    </section>
  );
}
