import { useState } from 'react';
import { useGetMarketplaceItemsQuery, useCreateMarketplaceItemMutation, useDeleteMarketplaceItemMutation, useGetMarketplaceOrdersQuery, useCreateMarketplaceOrderMutation, useUpdateMarketplaceOrderMutation, useGetPatientsQuery } from '../api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import { useTranslation } from 'react-i18next';

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  LAB_TEST: { label: 'Lab Test', icon: '🧪', color: 'blue' },
  MEDICATION: { label: 'Medication', icon: '💊', color: 'green' },
  SERVICE: { label: 'Service', icon: '🏥', color: 'purple' },
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function Marketplace() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'items' | 'orders'>('items');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const { data: items } = useGetMarketplaceItemsQuery(typeFilter ? { type: typeFilter } : {});
  const { data: orders } = useGetMarketplaceOrdersQuery({});
  const { data: patients } = useGetPatientsQuery('');
  const [createItem, { isLoading: creatingItem }] = useCreateMarketplaceItemMutation();
  const [deleteItem] = useDeleteMarketplaceItemMutation();
  const [createOrder, { isLoading: creatingOrder }] = useCreateMarketplaceOrderMutation();
  const [updateOrder] = useUpdateMarketplaceOrderMutation();

  const [itemForm, setItemForm] = useState({ type: 'LAB_TEST', name: '', description: '', price: '', category: '' });
  const [orderForm, setOrderForm] = useState({ patientId: '', itemId: '', quantity: '1', notes: '' });

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem({ ...itemForm, price: parseFloat(itemForm.price) }).unwrap();
      setShowItemModal(false);
      setItemForm({ type: 'LAB_TEST', name: '', description: '', price: '', category: '' });
      showToast(t('marketplace.itemCreated'), 'success');
    } catch (error) {
      showToast((error as any)?.data?.error || 'Failed', 'error');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder({ ...orderForm, quantity: parseInt(orderForm.quantity) }).unwrap();
      setShowOrderModal(false);
      setOrderForm({ patientId: '', itemId: '', quantity: '1', notes: '' });
      showToast(t('marketplace.orderCreated'), 'success');
    } catch (error) {
      showToast((error as any)?.data?.error || 'Failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('marketplace.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('marketplace.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowOrderModal(true)} className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium">
            + {t('marketplace.newOrder')}
          </button>
          <button onClick={() => setShowItemModal(true)} className="btn-gradient text-white px-5 py-2.5 rounded-xl font-medium">
            + {t('marketplace.addItem')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('items')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium ${tab === 'items' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
          {t('marketplace.catalog')} ({items?.length || 0})
        </button>
        <button onClick={() => setTab('orders')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium ${tab === 'orders' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
          {t('marketplace.orders')} ({orders?.length || 0})
        </button>
      </div>

      {tab === 'items' && (
        <>
          {/* Type Filter */}
          <div className="flex gap-2 flex-wrap">
            {['', 'LAB_TEST', 'MEDICATION', 'SERVICE'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${typeFilter === t ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
                {t ? TYPE_CONFIG[t]?.icon + ' ' + TYPE_CONFIG[t]?.label : 'All'}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items?.map((item: any) => {
              const config = TYPE_CONFIG[item.type] || { icon: '📦', label: item.type, color: 'gray' };
              return (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover-lift">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{config.icon}</div>
                    <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                  {item.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${config.color}-100 text-${config.color}-700 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`}>
                      {config.label}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">${item.price}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('marketplace.noOrders')}</h3>
            </div>
          ) : orders?.map((order: any) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{order.patient?.firstName} {order.patient?.lastName}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${ORDER_STATUS_STYLES[order.status]}`}>{order.status}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.item?.name} x{order.quantity} • ${order.totalPrice}
                </p>
                <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                {order.status === 'PENDING' && (
                  <>
                    <button onClick={() => updateOrder({ id: order.id, status: 'CONFIRMED' })}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium">{t('marketplace.confirm')}</button>
                    <button onClick={() => updateOrder({ id: order.id, status: 'CANCELLED' })}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium">{t('common.cancel')}</button>
                  </>
                )}
                {order.status === 'CONFIRMED' && (
                  <button onClick={() => updateOrder({ id: order.id, status: 'COMPLETED' })}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg font-medium">{t('marketplace.complete')}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title={t('marketplace.addItem')}>
        <form onSubmit={handleCreateItem} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('marketplace.itemType')} *</label>
            <select value={itemForm.type} onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
              <option value="LAB_TEST">Lab Test</option>
              <option value="MEDICATION">Medication</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.name')} *</label>
            <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.description')}</label>
            <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('marketplace.price')} *</label>
              <input type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} required
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('marketplace.category')}</label>
              <input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium">{t('common.cancel')}</button>
            <button type="submit" disabled={creatingItem} className="flex-1 btn-gradient text-white py-3 rounded-xl font-medium disabled:opacity-50">
              {creatingItem ? t('common.loading') : t('marketplace.addItem')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Order Modal */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title={t('marketplace.newOrder')}>
        <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('monitoring.patient')} *</label>
            <select value={orderForm.patientId} onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
              <option value="">{t('monitoring.selectPatient')}</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('marketplace.selectItem')} *</label>
            <select value={orderForm.itemId} onChange={(e) => setOrderForm({ ...orderForm, itemId: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
              <option value="">{t('marketplace.selectItem')}</option>
              {items?.filter((i: any) => i.isActive).map((i: any) => (
                <option key={i.id} value={i.id}>{TYPE_CONFIG[i.type]?.icon} {i.name} - ${i.price}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('marketplace.quantity')}</label>
            <input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium">{t('common.cancel')}</button>
            <button type="submit" disabled={creatingOrder} className="flex-1 btn-gradient text-white py-3 rounded-xl font-medium disabled:opacity-50">
              {creatingOrder ? t('common.loading') : t('marketplace.placeOrder')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
