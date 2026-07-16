export type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
};

export type ProductImage = {
  url: string;
  public_id?: string | null;
  is_default: boolean;
  is_thumbnail: boolean;
  sort_order?: number;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: string;
  category: string;
  stock: number;
  image_url?: string;
  thumbnail_url?: string;
  images?: ProductImage[];
  is_featured: boolean;
};

export type Order = {
  id: string;
  user_name: string;
  user_email: string;
  total_price: string;
  subtotal_price?: string;
  discount_amount?: string;
  coupon_code?: string;
  status: string;
  payment_status: string;
  payment_provider?: string;
  payment_reference?: string;
  shipping_address?: {
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: string;
  }>;
  created_at: string;
};

export type Review = {
  id: string;
  product_name: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment?: string;
  status: 'visible' | 'hidden';
  created_at: string;
};

export type Stats = {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
};

export type Coupon = {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_discount_amount?: string | null;
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
};
