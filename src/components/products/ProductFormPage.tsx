import { ChangeEvent, FormEvent, lazy, Suspense, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import api from '../../api/client';
import { endpoints } from '../../config/apiConfig';
import { Product, ProductImage } from '../../types';
import { ConfirmationModal } from '../ConfirmationModal';
import {
  BrandedSelect,
  inputClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../TableTools';
import {
  ALLOWED_IMAGE_TYPES,
  assetImageUrl,
  categoryOptions,
  formatFileSize,
  isFeatured,
  MAX_IMAGE_SIZE,
  MAX_PRODUCT_IMAGES,
} from './productHelpers';

const RichTextEditor = lazy(() => import('./RichTextEditor').then((module) => ({ default: module.RichTextEditor })));

type ProductFormPageProps = {
  product: Product | null;
  onCancel: () => void;
  onSaved: () => void;
};

const productImages = (product: Product | null): ProductImage[] => {
  if (!product) return [];

  if (product.images?.length) {
    return product.images
      .filter((image) => !!image.url)
      .map((image, index) => ({
        ...image,
        is_default: image.is_default === true,
        is_thumbnail: image.is_thumbnail === true,
        sort_order: image.sort_order ?? index,
      }));
  }

  const urls = [product.image_url, product.thumbnail_url].filter((url, index, all): url is string => (
    !!url && all.indexOf(url) === index
  ));

  return urls.map((url, index) => ({
    url,
    public_id: null,
    is_default: url === product.image_url || (!product.image_url && index === 0),
    is_thumbnail: url === product.thumbnail_url || (!product.thumbnail_url && index === 0),
    sort_order: index,
  }));
};

const selectedImageIndex = (images: ProductImage[], field: 'is_default' | 'is_thumbnail') => {
  const index = images.findIndex((image) => image[field]);
  return index >= 0 ? index : 0;
};

export function ProductFormPage({ product, onCancel, onSaved }: ProductFormPageProps) {
  const initialImages = useMemo(() => productImages(product), [product]);
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || 'plants',
    stock: product?.stock?.toString() || '0',
    is_featured: isFeatured(product?.is_featured),
    return_policy: product?.return_policy || (product?.category === 'plants' || !product ? 'damage_only' : 'returnable'),
    return_window_hours: String(product?.return_window_hours || (product?.category === 'plants' || !product ? 48 : 168)),
    final_sale: product?.final_sale === true,
  });
  const [existingImages, setExistingImages] = useState<ProductImage[]>(initialImages);
  const [files, setFiles] = useState<File[]>([]);
  const [defaultIndex, setDefaultIndex] = useState(() => selectedImageIndex(initialImages, 'is_default'));
  const [thumbnailIndex, setThumbnailIndex] = useState(() => selectedImageIndex(initialImages, 'is_thumbnail'));
  const [imageError, setImageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingImageToRemove, setExistingImageToRemove] = useState<number | null>(null);
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  const totalImages = existingImages.length + files.length;

  useEffect(() => () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    const oversizedFiles = selectedFiles.filter((file) => file.size > MAX_IMAGE_SIZE);
    const unsupportedFiles = selectedFiles.filter((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
    const validFiles = selectedFiles.filter((file) => file.size <= MAX_IMAGE_SIZE && ALLOWED_IMAGE_TYPES.includes(file.type));
    const availableSlots = Math.max(0, MAX_PRODUCT_IMAGES - totalImages);
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

  const adjustSelectedIndices = (indexToRemove: number) => {
    const nextLength = totalImages - 1;
    const adjustIndex = (currentIndex: number) => {
      if (nextLength <= 0) return 0;
      if (currentIndex === indexToRemove) return Math.min(indexToRemove, nextLength - 1);
      return currentIndex > indexToRemove ? currentIndex - 1 : currentIndex;
    };

    setDefaultIndex(adjustIndex(defaultIndex));
    setThumbnailIndex(adjustIndex(thumbnailIndex));
    setImageError('');
  };

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImages((images) => images.filter((_, index) => index !== indexToRemove));
    adjustSelectedIndices(indexToRemove);
  };

  const removeNewImage = (indexToRemove: number) => {
    const absoluteIndex = existingImages.length + indexToRemove;
    setFiles((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove));
    adjustSelectedIndices(absoluteIndex);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
    files.forEach((file) => data.append('images', file));
    data.append('defaultIndex', String(defaultIndex));
    data.append('thumbnailIndex', String(thumbnailIndex));

    if (product) {
      const existingImageMetadata = existingImages.map((image: ProductImage, index) => ({
        url: image.url,
        public_id: image.public_id || null,
        is_default: defaultIndex === index,
        is_thumbnail: thumbnailIndex === index,
        sort_order: index,
      }));
      data.append('imagesMetadata', JSON.stringify(existingImageMetadata));
      data.append('keepExistingImages', 'true');
      data.append('absoluteDefaultIndex', String(defaultIndex));
      data.append('absoluteThumbnailIndex', String(thumbnailIndex));
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
          <BrandedSelect label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value, return_policy: value === 'plants' ? 'damage_only' : 'returnable', return_window_hours: value === 'plants' ? '48' : '168' })} options={categoryOptions} />
          <label className="grid gap-2 text-sm font-bold text-stone-600">Price<input className={inputClass} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} type="number" step="0.01" required /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600">Stock<input className={inputClass} value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} type="number" min="0" required /></label>
          <label className="grid gap-2 text-sm font-bold text-stone-600 md:col-span-2">
            Description
            <Suspense fallback={<div className="grid min-h-56 place-items-center rounded-lg border border-stone-900/10 bg-stone-50 text-sm font-bold text-stone-500">Loading description editor...</div>}>
              <RichTextEditor
                value={form.description}
                onChange={(description) => setForm((current) => ({ ...current, description }))}
              />
            </Suspense>
            <span className="text-xs font-bold leading-5 text-stone-500">Use the toolbar for paragraphs, headings, emphasis, bullet points, numbered lists, and quotes. Formatting appears on the customer product page.</span>
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-stone-600"><input className="h-4 w-4 accent-emerald-700" type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} /> Featured product (maximum 10)</label>
          <BrandedSelect label="Return policy" value={form.return_policy} onChange={(value) => setForm({ ...form, return_policy: value as 'returnable' | 'damage_only' })} options={[{ value: 'returnable', label: 'Returnable' }, { value: 'damage_only', label: 'Damage claims only' }]} />
          <label className="grid gap-2 text-sm font-bold text-stone-600">Return window (hours)<input className={inputClass} value={form.return_window_hours} onChange={(event) => setForm({ ...form, return_window_hours: event.target.value })} type="number" min="1" max="8760" required /></label>
          <label className="flex items-center gap-2 text-sm font-bold text-stone-600"><input className="h-4 w-4 accent-emerald-700" type="checkbox" checked={form.final_sale} onChange={(event) => setForm({ ...form, final_sale: event.target.checked })} /> Final sale (damage/missing/wrong-item claims only)</label>
          <div className="grid gap-2 md:col-span-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-sm font-extrabold text-emerald-950 transition hover:border-emerald-500/70 hover:bg-emerald-500/10">
              <Upload size={18} />
              <span>
                Upload photos
                <small className="mt-0.5 block font-bold text-stone-500">JPEG, PNG, WebP, or GIF &middot; up to 5 MB each &middot; {totalImages}/{MAX_PRODUCT_IMAGES} photos used</small>
              </span>
              <input className="hidden" type="file" accept={ALLOWED_IMAGE_TYPES.join(',')} multiple onChange={selectImages} />
            </label>
            {imageError && <p className="m-0 rounded-lg border border-red-700/15 bg-red-50 px-3 py-2 text-sm font-extrabold text-red-700" role="alert">{imageError}</p>}
            {product && existingImages.length > 0 && <p className="m-0 text-xs font-bold text-stone-500">Existing photos stay attached unless you remove them below. Changes are applied when you save the product.</p>}
          </div>
          {totalImages > 0 && (
            <div className="grid grid-cols-1 gap-3 md:col-span-2 sm:grid-cols-2 lg:grid-cols-3">
              {existingImages.map((image, index) => (
                <div className="overflow-hidden rounded-lg border border-stone-900/10 bg-white" key={`${image.public_id || image.url}-${index}`}>
                  <div className="relative aspect-[4/3] bg-stone-100">
                    <img className="h-full w-full object-cover" src={assetImageUrl(image.url)} alt={`${product?.name || 'Product'} photo ${index + 1}`} />
                    <span className="absolute left-2 top-2 rounded-md bg-stone-950/75 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">Existing</span>
                    <button
                      type="button"
                      className="absolute right-2 top-2 inline-grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/95 text-red-700 shadow-lg transition hover:bg-red-600 hover:text-white"
                      onClick={() => setExistingImageToRemove(index)}
                      aria-label={`Remove existing product photo ${index + 1}`}
                      title="Remove existing image when saved"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid gap-2 p-3">
                    <strong className="block truncate text-sm text-stone-800">Existing photo {index + 1}</strong>
                    <div className="flex gap-2">
                      <button type="button" className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-extrabold ${defaultIndex === index ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} onClick={() => setDefaultIndex(index)}>Default</button>
                      <button type="button" className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-extrabold ${thumbnailIndex === index ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} onClick={() => setThumbnailIndex(index)}>Thumbnail</button>
                    </div>
                  </div>
                </div>
              ))}
              {files.map((file, index) => (
                <div className="overflow-hidden rounded-lg border border-stone-900/10 bg-white" key={`${file.name}-${file.lastModified}-${index}`}>
                  <div className="relative aspect-[4/3] bg-stone-100">
                    <img className="h-full w-full object-cover" src={previewUrls[index]} alt={`Preview of ${file.name}`} />
                    <span className="absolute left-2 top-2 rounded-md bg-emerald-700/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">New</span>
                    <button
                      type="button"
                      className="absolute right-2 top-2 inline-grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/95 text-red-700 shadow-lg transition hover:bg-red-600 hover:text-white"
                      onClick={() => removeNewImage(index)}
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
                      <button type="button" className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-extrabold ${defaultIndex === existingImages.length + index ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} onClick={() => setDefaultIndex(existingImages.length + index)}>Default</button>
                      <button type="button" className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-extrabold ${thumbnailIndex === existingImages.length + index ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`} onClick={() => setThumbnailIndex(existingImages.length + index)}>Thumbnail</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className={primaryButtonClass} disabled={saving}>{saving ? 'Saving...' : 'Save product'}</button>
      </form>
      <ConfirmationModal
        open={existingImageToRemove !== null}
        title="Remove product photo?"
        message="This photo will be removed from the product when you save your changes. You can cancel the product edit to keep it."
        confirmText="Remove photo"
        variant="danger"
        onClose={() => setExistingImageToRemove(null)}
        onConfirm={() => {
          if (existingImageToRemove !== null) removeExistingImage(existingImageToRemove);
        }}
      />
    </section>
  );
}
