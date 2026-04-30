import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, X, Plus, Trash2, Pencil } from 'lucide-react';
import { API } from '../lib/api';

function AccountsLedger() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    customerName: '', product: '', totalAmount: ''
  });

  const fetchSales = () => {
    setLoading(true);
    fetch(`${API}/api/sales`)
      .then(r => r.json())
      .then(data => { setSales(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchSales(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          product: form.product,
          totalAmount: Number(form.totalAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setForm({ customerName: '', product: '', totalAmount: '' });
        fetchSales();
        setTimeout(() => { setSuccess(false); setShowForm(false); }, 2000);
      }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ customerName: '', product: '', totalAmount: '' });

  const handleEdit = (sale) => {
    setEditingId(sale.id);
    setEditForm({ customerName: sale.customer_name, product: sale.product, totalAmount: sale.total_amount });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/api/sales/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      setEditingId(null);
      fetchSales();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await fetch(`${API}/api/sales/${id}`, { method: 'DELETE' });
      fetchSales();
    } catch (e) { console.error(e); }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:border-[#C5A059] focus:bg-white focus:ring-4 focus:ring-[#C5A059]/10 outline-none transition-all";
  const labelClass = "block text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-slate-500 text-sm">Track showroom wholesale deliveries and full payments</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl transition-all text-sm font-bold shadow-lg shadow-slate-900/10 active:scale-[0.98]"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Delivery</>}
        </button>
      </div>

      {/* New Sale Form */}
      {showForm && (
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6">
          <h6 className="font-bold text-slate-900 mb-5">Add Showroom Delivery (Full Payment)</h6>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Showroom Name</label>
              <input type="text" required placeholder="e.g. Ali Furniture Hub" value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Product Delivered</label>
              <input type="text" required placeholder="e.g. Royal Bed Set" value={form.product}
                onChange={e => setForm({ ...form, product: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Total Amount Received (Rs)</label>
              <input type="number" required placeholder="0" value={form.totalAmount}
                onChange={e => setForm({ ...form, totalAmount: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={saving}
                className={`w-full h-12 flex items-center justify-center gap-2 font-bold rounded-2xl text-sm transition-all active:scale-[0.98]
                  ${success ? 'bg-emerald-500 text-white' : 'bg-[#C5A059] hover:bg-[#8E6F3E] text-white'}
                  shadow-lg shadow-[#C5A059]/20 disabled:opacity-70`}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : success ? <><CheckCircle2 className="w-4 h-4" /> Record Saved!</>
                  : '+ Save Delivery Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left text-sm min-w-[700px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <th className="px-6 py-4">Showroom Name</th>
              <th className="px-6 py-4">Product Delivered</th>
              <th className="px-6 py-4">Amount Received</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center">
                <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
              </td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                No deliveries recorded yet. Click "+ New Delivery" to log one.
              </td></tr>
            ) : sales.map(sale => {
              const isEditing = editingId === sale.id;

              if (isEditing) {
                return (
                  <tr key={sale.id} className="bg-slate-50">
                    <td className="px-6 py-4">
                      <input 
                        value={editForm.customerName} 
                        onChange={e => setEditForm({...editForm, customerName: e.target.value})}
                        className="w-full px-3 py-1.5 border rounded-lg"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        value={editForm.product} 
                        onChange={e => setEditForm({...editForm, product: e.target.value})}
                        className="w-full px-3 py-1.5 border rounded-lg"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number"
                        value={editForm.totalAmount} 
                        onChange={e => setEditForm({...editForm, totalAmount: Number(e.target.value)})}
                        className="w-full px-3 py-1.5 border rounded-lg"
                      />
                    </td>
                    <td colSpan="2"></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={handleUpdate} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl"><CheckCircle2 className="w-4 h-4"/></button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900">{sale.customer_name}</td>
                  <td className="px-6 py-4 text-slate-600">{sale.product}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">Rs. {Number(sale.total_amount).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Paid in Full</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{new Date(sale.created_at).toLocaleDateString('en-PK')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      <button onClick={() => handleEdit(sale)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit record">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sale.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete record">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountsLedger;
