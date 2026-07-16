export type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  address?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    state?: string;
    country?: string;
  };
  email_verified?: boolean;
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
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  courier_name?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  admin_notes?: string;
  status_history?: Array<{
    id: string;
    from_status?: string | null;
    to_status: string;
    note?: string | null;
    created_at: string;
  }>;
  shipping_address?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    landmark?: string;
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

export type CustomerDetails = {
  customer: User;
  summary: {
    totalOrders: number;
    totalSpent: number;
    totalDiscount: number;
    deliveredOrders: number;
    paidOrders: number;
    lastOrderAt: string | null;
  };
  orders: Array<Omit<Order, 'user_name' | 'user_email'>>;
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
