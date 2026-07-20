import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import api from '../../api/client';
import { endpoints } from '../../config/apiConfig';
import { Product, ProductImage } from '../../types';
import {
  BrandedSelect,
  inputClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../TableTools';
import {
  ALLOWED_IMAGE_TYPES,
  categoryOptions,
  formatFileSize,
  isFeatured,
  MAX_IMAGE_SIZE,
  MAX_PRODUCT_IMAGES,
} from './productHelpers';

type ProductFormPageProps = {
  product: Product | null;
  onCancel: () => void;
  onSaved: () => void;
};

export function ProductFormPage({ product, onCancel, onSaved }: ProductFormPageProps) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || 'plants',
    stock: product?.stock?.toString() || '0',
    is_featured: isFeatured(product?.is_featured),
  });
  const [files, setFiles] = useState<File[]>([]);
  const [defaultIndex, setDefaultIndex] = useState(0);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [imageError, setImageError] = useState('');
  const [saving, setSaving] = useState(false);
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    const oversizedFiles = selectedFiles.filter((file) => file.size > MAX_IMAGE_SIZE);
    const unsupportedFiles = selectedFiles.filter((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
    const validFiles = selectedFiles.filter((file) => file.size <= MAX_IMAGE_SIZE && ALLOWED_IMAGE_TYPES.includes(file.type));
    const availableSlots = Math.max(0, MAX_PRODUCT_IMAGES - files.length);
    const acceptedFiles = validFiles.slice(0, availableSlots);
    const errors: string[] = [];

    if (oversizedFiles.length) {
      errors.push(`${oversizedFiles.map((file) => file.name).join(', ')} ${oversizedFiles.length === 1 ? 'is' : 'are'} larger than the 5 MB limit.`);
    }
    if (unsupportedFiles.length) {
      errors.push(`${unsupportedFiles.map((file) => file.name).join(', ')} must be a JPEG, PNG, WebP, or GIF image.`);
    }
    if (validFiles.length > availableSlots) {
      errors.push(`You can upload a maximum of ${MAX_PRODUCT_IMAGES} images.`);
    }

    setImageError(errors.join(' '));
    if (acceptedFiles.length) setFiles((currentFiles) => [...currentFiles, ...acceptedFiles]);
  };

  const removeImage = (indexToRemove: number) => {
    const nextLength = files.length - 1;
    const adjustIndex = (currentIndex: number) => {
      if (nextLength <= 0) return 0;
      if (currentIndex === indexToRemove) return Math.min(indexToRemove, nextLength - 1);
      return currentIndex > indexToRemove ? currentIndex - 1 : currentIndex;
    };

    setFiles((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove));
    setDefaultIndex(adjustIndex(defaultIndex));
    setThumbnailIndex(adjustIndex(thumbnailIndex));
    setImageError('');
  };

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={panelClass}>
      <form onSubmit={submit}>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-emerald-700">Product setup</p>
            <h2 className="m-0 text-2xl font-black tracking-tight">{product ? 'Edit product' : 'Add product'}</h2>
            <p className="mt-1 text-sm font-bold text-stone-500">Use this same page for creating and editing products.</p>
          </div>
          <button type="button" className={secondaryButtonClass} onClick={onCancel}><ArrowLeft size={18} /> Back to products</button>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-stone-600">Name<input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <BrandedSelect label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={categoryOptions} />
          <label className="grid gap-2 text-sm font-bold text-stone-600">Price<input className={inputClass} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} type="number" step="0.01" required /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Stock<input className={inputClass} value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} type="number" min="0" required /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600 md:col-span-2">Description<textarea className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} /></label>
          <label className="flex items-center gap-2 text-sm font-bold text-stone-600"><input className="h-4 w-4 accent-emerald-700" type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} /> Featured product</label>
          <div className="grid gap-2 md:col-span-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-sm font-extrabold text-emerald-950 transition hover:border-emerald-500/70 hover:bg-emerald-500/10">
              <Upload size={18} />
              <span>
                Upload photos
                <small className="mt-0.5 block font-bold text-stone-500">JPEG, PNG, WebP, or GIF · up to 5 MB each · maximum {MAX_PRODUCT_IMAGES}</small>
              </span>
              <input className="hidden" type="file" accept={ALLOWED_IMAGE_TYPES.join(',')} multiple onChange={selectImages} />
            </label>
            {imageError && <p className="m-0 rounded-lg border border-red-700/15 bg-red-50 px-3 py-2 text-sm font-extrabold text-red-700" role="alert">{imageError}</p>}
          </div>
          {files.length > 0 && (
            <div className="grid grid-cols-1 gap-3 md:col-span-2 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((file, index) => (
                <div className="overflow-hidden rounded-lg border border-stone-900/10 bg-white" key={`${file.name}-${file.lastModified}-${index}`}>
                  <div className="relative aspect-[4/3] bg-stone-100">
                    <img className="h-full w-full object-cover" src={previewUrls[index]} alt={`Preview of ${file.name}`} />
                    <button
                      type="button"
                      className="absolute right-2 top-2 inline-grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/95 text-red-700 shadow-lg transition hover:bg-red-600 hover:text-white"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove ${file.name}`}
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid gap-2 p-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-stone-800">{file.name}</strong>
                      <span className="text-xs font-bold text-stone-500">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-extrabold ${defaultIndex === index ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} onClick={() => setDefaultIndex(index)}>Default</button>
                      <button type="button" className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-extrabold ${thumbnailIndex === index ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} onClick={() => setThumbnailIndex(index)}>Thumbnail</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className={primaryButtonClass} disabled={saving}>{saving ? 'Saving...' : 'Save product'}</button>
      </form>
    </section>
  );
}
