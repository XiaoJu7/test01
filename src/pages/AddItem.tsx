import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AddItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '食品',
    production_date: '',
    expiration_date: '',
    weight: '',
    quantity: '',
    unit: '个'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...formData,
        weight: ['蔬菜', '水果'].includes(formData.category) ? Number(formData.weight) : null,
        quantity: !['蔬菜', '水果'].includes(formData.category) ? Number(formData.quantity) : null,
      };
      
      await axios.post('/api/items', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to add item', error);
      alert('添加物品失败');
    }
  };

  const isWeightCategory = ['蔬菜', '水果'].includes(formData.category);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">添加新物品</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">物品名称</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="例如：苹果、布洛芬"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="食品">食品</option>
              <option value="药品">药品</option>
              <option value="蔬菜">蔬菜</option>
              <option value="水果">水果</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">生产/购买日期</label>
            <input
              type="date"
              name="production_date"
              value={formData.production_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">过期日期</label>
            <input
              type="date"
              name="expiration_date"
              required
              value={formData.expiration_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {isWeightCategory ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">重量</label>
              <input
                type="number"
                step="0.01"
                name="weight"
                required
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="输入重量"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
              <input
                type="number"
                name="quantity"
                required
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="输入数量"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">单位</label>
            <input
              type="text"
              name="unit"
              required
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={isWeightCategory ? "例如：kg, g" : "例如：个, 盒, 瓶"}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
          >
            保存物品
          </button>
        </div>
      </form>
    </div>
  );
}
