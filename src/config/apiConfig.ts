export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const ASSET_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    featuredStatus: (id: string) => `/products/${id}/featured`,
  },
  admin: {
    stats: '/admin/stats',
    orders: '/admin/orders',
    customers: '/admin/customers',
    reviews: '/admin/reviews',
    reviewStatus: (id: string) => `/admin/reviews/${id}/status`,
    coupons: '/admin/coupons',
    coupon: (id: string) => `/admin/coupons/${id}`,
  },
  orders: {
    status: (id: string) => `/orders/${id}/status`,
  },
};
