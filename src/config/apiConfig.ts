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
    customer: (id: string) => `/admin/customers/${id}`,
    reviews: '/admin/reviews',
    reviewStatus: (id: string) => `/admin/reviews/${id}/status`,
    reviewImageStatus: (reviewId: string, imageId: string) => `/admin/reviews/${reviewId}/images/${imageId}/status`,
    reviewImage: (reviewId: string, imageId: string) => `/admin/reviews/${reviewId}/images/${imageId}`,
    pickups: '/admin/pickups',
    pickupStatus: (id: string) => `/admin/pickups/${id}/status`,
    coupons: '/admin/coupons',
    coupon: (id: string) => `/admin/coupons/${id}`,
    returns: '/admin/returns',
    returnDetail: (id: string) => `/admin/returns/${id}`,
    returnDecision: (id: string) => `/admin/returns/${id}/decision`,
    returnReverseShipment: (id: string) => `/admin/returns/${id}/reverse-shipment`,
    returnManual: (id: string) => `/admin/returns/${id}/manual-return`,
    returnInspection: (id: string) => `/admin/returns/${id}/inspection`,
    returnRefund: (id: string) => `/admin/returns/${id}/refunds`,
    returnReplacement: (id: string) => `/admin/returns/${id}/replacement`,
    retryRefund: (id: string) => `/admin/refunds/${id}/retry`,
    refreshRefund: (id: string) => `/admin/refunds/${id}/refresh`,
    linkRefund: '/admin/refunds/link',
  },
  orders: {
    status: (id: string) => `/orders/${id}/status`,
    refund: (id: string) => `/orders/${id}/refund`,
    createShipment: (id: string) => `/admin/orders/${id}/shipments`,
  },
  shipments: {
    sync: (id: string) => `/admin/shipments/${id}/sync`,
    cancel: (id: string) => `/admin/shipments/${id}/cancel`,
    label: (shipmentId: string, packageId: string) => `/admin/shipments/${shipmentId}/packages/${packageId}/label`,
  },
};
