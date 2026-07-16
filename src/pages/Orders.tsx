import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { endpoints } from '../config/apiConfig';
import { Order } from '../types';

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    const res = await api.get(`${endpoints.admin.orders}?limit=100`);
    setOrders(res.data.orders);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.put(endpoints.orders.status(id), { status });
    toast.success('Order status updated');
    loadOrders();
  };

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Coupon</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <Fragment key={order.id}>
                <tr>
                  <td>
                    <button className="link-button" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                      {order.id.slice(0, 8)}
                    </button>
                  </td>
                  <td>
                    <strong>{order.user_name}</strong>
                    <span>{order.user_email}</span>
                  </td>
                  <td>Rs. {parseFloat(order.total_price).toFixed(2)}</td>
                  <td>
                    <strong>{order.payment_status}</strong>
                    <span>{order.payment_provider || '-'}</span>
                  </td>
                  <td>{order.coupon_code ? `${order.coupon_code} (-Rs. ${parseFloat(order.discount_amount || '0').toFixed(2)})` : '-'}</td>
                  <td>
                    <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                      {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr>
                    <td colSpan={6}>
                      <div className="order-details">
                        <div>
                          <h3>Shipping</h3>
                          <p>{order.shipping_address?.name || order.user_name}</p>
                          <p>{order.shipping_address?.address || '-'}</p>
                          <p>{[order.shipping_address?.city, order.shipping_address?.postalCode].filter(Boolean).join(' ') || '-'}</p>
                          <p>Payment ref: {order.payment_reference || '-'}</p>
                        </div>
                        <div>
                          <h3>Items</h3>
                          {(order.items || []).map((item) => (
                            <p key={item.id}>{item.quantity} x {item.product_name} at Rs. {parseFloat(item.price).toFixed(2)}</p>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
