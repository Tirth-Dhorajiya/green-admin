import { Edit, Star, Trash2 } from 'lucide-react';
import { Product } from '../../types';
import {
  dangerIconButtonClass,
  iconButtonClass,
  SortDirection,
  SortHeader,
  tableClass,
  TableSkeletonRows,
  tdClass,
  thClass,
} from '../TableTools';
import { isFeatured, productImageUrl, ProductSortKey } from './productHelpers';

type ProductTableProps = {
  products: Product[];
  loading: boolean;
  loadingRows: number;
  sortKey: ProductSortKey;
  sortDirection: SortDirection;
  onSort: (key: ProductSortKey) => void;
  onToggleFeatured: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function ProductTable({
  products,
  loading,
  loadingRows,
  sortKey,
  sortDirection,
  onSort,
  onToggleFeatured,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead>
          <tr>
            <SortHeader label="Product" active={sortKey === 'name'} direction={sortDirection} onSort={() => onSort('name')} />
            <SortHeader label="Category" active={sortKey === 'category'} direction={sortDirection} onSort={() => onSort('category')} />
            <SortHeader label="Price" active={sortKey === 'price'} direction={sortDirection} onSort={() => onSort('price')} />
            <SortHeader label="Stock" active={sortKey === 'stock'} direction={sortDirection} onSort={() => onSort('stock')} />
            <SortHeader label="Featured" active={sortKey === 'featured'} direction={sortDirection} onSort={() => onSort('featured')} />
            <th className={thClass}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows rows={loadingRows} columns={6} />
          ) : products.map((product) => {
            const featured = isFeatured(product.is_featured);

            return (
              <tr key={product.id}>
                <td className={tdClass}>
                  <div className="flex min-w-56 items-center gap-3">
                    <img className="h-12 w-12 rounded-lg object-cover" src={productImageUrl(product)} alt={product.name} />
                    <strong>{product.name}</strong>
                  </div>
                </td>
                <td className={tdClass}>{product.category}</td>
                <td className={tdClass}>₹{parseFloat(product.price).toFixed(2)}</td>
                <td className={tdClass}>{product.stock}</td>
                <td className={tdClass}>
                  <button
                    type="button"
                    className={featured ? `${iconButtonClass} bg-amber-100 text-amber-700 hover:bg-amber-500` : iconButtonClass}
                    onClick={() => onToggleFeatured(product)}
                    aria-label={featured ? `Remove ${product.name} from featured products` : `Mark ${product.name} as featured`}
                    title={featured ? 'Featured product' : 'Not featured'}
                  >
                    <Star size={17} fill={featured ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td className={tdClass}>
                  <div className="flex gap-2">
                    <button className={iconButtonClass} onClick={() => onEdit(product)}><Edit size={16} /></button>
                    <button className={dangerIconButtonClass} onClick={() => onDelete(product)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!loading && !products.length && (
            <tr>
              <td colSpan={6} className={`${tdClass} py-7 text-center font-extrabold text-stone-500`}>No products match the current filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
