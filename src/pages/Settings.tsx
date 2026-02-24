import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Settings() {
  const [formData, setFormData] = useState({
    email: '',
    wecom_webhook: '',
    reminder_days: 7
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData({
        email: user.email || '',
        wecom_webhook: user.wecom_webhook || '',
        reminder_days: user.reminder_days || 7
      });
    }
    setLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        localStorage.setItem('user', JSON.stringify({ ...user, ...formData }));
      }
      
      setMessage('设置已保存');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
      setMessage('保存失败');
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">通知设置</h1>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message === '设置已保存' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">邮箱地址 (用于接收临期提醒)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="example@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">企业微信机器人 Webhook 地址</label>
          <input
            type="url"
            name="wecom_webhook"
            value={formData.wecom_webhook}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
          />
          <p className="mt-2 text-sm text-gray-500">用于接收每日库存报告和临期提醒</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">提前提醒天数</label>
          <input
            type="number"
            name="reminder_days"
            min="1"
            max="30"
            value={formData.reminder_days}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="mt-2 text-sm text-gray-500">物品过期前多少天开始发送提醒 (默认7天)</p>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
          >
            保存设置
          </button>
        </div>
      </form>
    </div>
  );
}
