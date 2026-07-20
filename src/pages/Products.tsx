import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import api from '../api/client';
import {
  BrandedSelect,
  inputClass,
  Pagination,
  panelClass,
  primaryButtonClass,
  SortDirection,
  TableToolbar,
} from '../components/TableTools';
import { endpoints } from '../config/apiConfig';
import { Product } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ProductFormPage } from '../components/products/ProductFormPage';
import { ProductTable } from '../components/products/ProductTable';
import { categoryOptions, isFeatured, ProductSortKey } from '../components/products/productHelpers';

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formMode, setFormMode] = useState<'list' | 'form'>('list');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [sortKey, setSortKey] = useState<ProductSortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
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
      setProducts((res.data.products || []).map((product: Product) => ({
        ...product,
        is_featured: isFeatured(product.is_featured),
      })));
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load products');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortKey, sortDirection, query, categoryFilter, stockFilter, featuredFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const toggleFeatured = async (product: Product) => {
    const nextFeatured = !isFeatured(product.is_featured);

    try {
      const response = await api.put(endpoints.products.featuredStatus(product.id), { is_featured: nextFeatured });
      const updatedProduct = response.data.product as Product | undefined;
      setProducts((currentProducts) => currentProducts.map((currentProduct) => (
        currentProduct.id === product.id
          ? { ...currentProduct, ...updatedProduct, is_featured: isFeatured(updatedProduct?.is_featured ?? nextFeatured) }
          : currentProduct
      )));
      toast.success(nextFeatured ? 'Product marked as featured' : 'Product removed from featured');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update featured status');
    }
  };

  const deleteProduct = async (product: Product) => {
    await api.delete(endpoints.products.detail(product.id));
    toast.success('Product deleted');
    loadProducts();
  };

  const updateSort = (key: ProductSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  if (formMode === 'form') {
    return (
      <ProductFormPage
        product={editingProduct}
        onCancel={() => setFormMode('list')}
        onSaved={() => {
          setFormMode('list');
          setEditingProduct(null);
          loadProducts();
        }}
      />
    );
  }

  return (
    <section className={panelClass}>
      <div className="mb-4 flex justify-end">
        <button className={primaryButtonClass} onClick={() => { setEditingProduct(null); setFormMode('form'); }}>
          <Plus size={18} /> Add product
        </button>
      </div>
      <TableToolbar>
        <input className={inputClass} placeholder="Search products" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        <BrandedSelect
          value={categoryFilter}
          onChange={(value) => { setCategoryFilter(value); setPage(1); }}
          options={[{ value: 'all', label: 'All categories' }, ...categoryOptions]}
        />
        <BrandedSelect
          value={stockFilter}
          onChange={(value) => { setStockFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All stock' },
            { value: 'available', label: 'Available' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
          ]}
        />
        <BrandedSelect
          value={featuredFilter}
          onChange={(value) => { setFeaturedFilter(value); setPage(1); }}
          options={[
            { value: 'all', label: 'All visibility' },
            { value: 'featured', label: 'Featured' },
            { value: 'standard', label: 'Not featured' },
          ]}
        />
      </TableToolbar>
      <ProductTable
        products={products}
        loading={loading}
        loadingRows={limit}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={updateSort}
        onToggleFeatured={toggleFeatured}
        onEdit={(product) => {
          setEditingProduct(product);
          setFormMode('form');
        }}
        onDelete={setProductToDelete}
      />
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={limit} onPageChange={setPage} onPageSizeChange={(value) => { setLimit(value); setPage(1); }} />
      <ConfirmationModal
        open={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={async () => {
          if (productToDelete) await deleteProduct(productToDelete);
        }}
        title="Delete product?"
        message={productToDelete ? `This will permanently delete "${productToDelete.name}" from the catalog.` : 'This product will be permanently deleted.'}
        confirmText="Delete"
        variant="danger"
      />
    </section>
  );
}
