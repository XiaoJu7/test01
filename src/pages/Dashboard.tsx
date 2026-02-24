import { useState, useEffect } from 'react';
import axios from 'axios';
import { differenceInDays, parseISO } from 'date-fns';
import { Calendar, List, LayoutGrid, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'card'>('card');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOutbound = async (itemId: number, amount: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/transactions', {
        item_id: itemId,
        type: 'outbound',
        amount: amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchItems();
    } catch (error) {
      console.error('Failed to process outbound', error);
      alert('出库失败');
    }
  };

  const getStatus = (expirationDate: string) => {
    const days = differenceInDays(parseISO(expirationDate), new Date());
    if (days < 0) return { label: '已过期', color: 'bg-red-100 text-red-800 border-red-200', icon: <AlertCircle className="w-4 h-4 mr-1" /> };
    if (days <= 30) return { label: `临期 (${days}天)`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4 mr-1" /> };
    return { label: `正常 (${days}天)`, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="w-4 h-4 mr-1" /> };
  };

  const filteredItems = items.filter(item => filter === 'all' || item.category === filter);

  if (loading) return <div>加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">库存概览</h1>
        <div className="flex space-x-4">
          <select 
            className="border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">全部分类</option>
            <option value="食品">食品</option>
            <option value="药品">药品</option>
            <option value="蔬菜">蔬菜</option>
            <option value="水果">水果</option>
          </select>
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button 
              onClick={() => setView('card')}
              className={`p-2 rounded-md ${view === 'card' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-md ${view === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => {
            const status = getStatus(item.expiration_date);
            const amount = item.weight !== null ? item.weight : item.quantity;
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className="text-sm text-gray-500">{item.category}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>
                
                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">剩余数量/重量:</span>
                    <span className="font-medium text-gray-900">{amount} {item.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">生产/购买日期:</span>
                    <span className="text-gray-900">{item.production_date || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">过期日期:</span>
                    <span className="text-gray-900">{item.expiration_date}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      const consumeAmount = prompt(`请输入消耗数量/重量 (单位: ${item.unit})`, amount.toString());
                      if (consumeAmount && !isNaN(Number(consumeAmount))) {
                        handleOutbound(item.id, Number(consumeAmount));
                      }
                    }}
                    className="w-full py-2 px-4 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
                  >
                    消耗 / 出库
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物品名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">余量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">过期日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map(item => {
                const status = getStatus(item.expiration_date);
                const amount = item.weight !== null ? item.weight : item.quantity;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{amount} {item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.expiration_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          const consumeAmount = prompt(`请输入消耗数量/重量 (单位: ${item.unit})`, amount.toString());
                          if (consumeAmount && !isNaN(Number(consumeAmount))) {
                            handleOutbound(item.id, Number(consumeAmount));
                          }
                        }}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        出库
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
