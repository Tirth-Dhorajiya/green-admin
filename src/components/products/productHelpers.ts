import { Product } from '../../types';
import { ASSET_BASE_URL } from '../../config/apiConfig';

export const MAX_PRODUCT_IMAGES = 10;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const categories = ['plants', 'seeds', 'tools', 'planters', 'other'];
export const categoryOptions = categories.map((category) => ({ value: category, label: category }));

export type ProductSortKey = 'name' | 'category' | 'price' | 'stock' | 'featured';

export const isFeatured = (value: unknown) => value === true || value === 'true' || value === 1 || value === '1';

export const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
};

export const assetImageUrl = (url?: string | null) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${ASSET_BASE_URL}${url}`;
};

export const productImageUrl = (product: Product) => {
  const url = product.thumbnail_url || product.image_url;
  if (!url) return 'https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=200&auto=format&fit=crop';
  return assetImageUrl(url);
};
