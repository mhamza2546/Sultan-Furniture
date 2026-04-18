import React, { useMemo, useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { API } from '../lib/api';

function NewOrderModal({ open, onClose, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customerName: '',
    product: '',
    totalAmount: '',
    downPayment: '',
    dueDate: ''
  });

  const balance = useMemo(() => {
    const total = Number(form.totalAmount || 0);
    const down = Number(form.downPayment || 0);
    return Math.max(0, total - down);
  }, [form.totalAmount, form.downPayment]);

  if (!open) return null;

  const close = () => {
    if (saving) return;
    setError('');
    setSuccess(false);
    onClose?.();
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          product: form.product || 'Furniture Item',
          totalAmount: Number(form.totalAmount),
          downPayment: Number(form.downPayment || 0),
          dueDate: form.dueDate || null
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to create order');

      if (json?.success) {
        setSuccess(true);
        setForm({ customerName: '', product: '', totalAmount: '', downPayment: '', dueDate: '' });
        onCreated?.();
        setTimeout(() => close(), 900);
      } else {
        throw new Error('Order save failed');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:border-[#C5A059] focus:bg-white focus:ring-4 focus:ring-[#C5A059]/10 outline-none transition-all";
  const labelClass = "block text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-[32px] border border-slate-100 shadow-2xl flex flex-col max-h-[90vh]">
          
          {/* Sticky Header - always visible */}
          <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight">Create New Order</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Sales record + customer receipt</p>
            </div>
            <button 
              onClick={close} 
              className="p-2 rounded-2xl hover:bg-slate-100 text-slate-500 transition-colors shrink-0" 
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1">
            <form onSubmit={submit} className="p-7 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Customer Name</label>
                  <input
                    className={inputClass}
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. Ali Khan"
                  />
                </div>

                <div>
                  <label className={labelClass}>Product</label>
                  <input
                    className={inputClass}
                    required
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    placeholder="e.g. Royal Bed"
                  />
                </div>

                <div>
                  <label className={labelClass}>Total Amount (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    required
                    value={form.totalAmount}
                    onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className={labelClass}>Down Payment (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={form.downPayment}
                    onChange={(e) => setForm({ ...form, downPayment: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Installment Due Date (optional)</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Balance Due</p>
                  <p className="text-xl font-black text-slate-900">Rs. {Number(balance).toLocaleString('en-PK')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={close}
                    disabled={saving}
                    className="h-12 px-6 rounded-2xl font-bold text-sm transition-all text-slate-600 hover:bg-slate-200 bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`h-12 px-6 rounded-2xl font-black text-sm transition-all active:scale-[0.98] flex items-center gap-2
                      ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-black text-white'}
                      disabled:opacity-70`}
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : success ? <><CheckCircle2 className="w-4 h-4" /> Created</> : 'Create Order'}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default NewOrderModal;

