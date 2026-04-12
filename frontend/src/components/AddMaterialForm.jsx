import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { API } from '../lib/api';

function AddMaterialForm({ onMaterialAdded }) {
  const [formData, setFormData] = useState({ name: '', qty: '', unit: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setFormData({ name: '', qty: '', unit: '', category: '' });
        if (onMaterialAdded) onMaterialAdded(); // refresh parent
        setTimeout(() => setSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:border-[#C5A059] focus:bg-white focus:ring-4 focus:ring-[#C5A059]/10 transition-all outline-none placeholder:text-slate-400";
  const labelClass = "block text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2";

  return (
    <div className="bg-white rounded-[32px] shadow-[0_8px_40px_-10px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden ring-1 ring-slate-900/5">
      <div className="px-7 py-6 border-b border-slate-50 bg-white">
        <h3 className="font-bold text-slate-900 text-lg">Inventory Entry</h3>
        <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Add New Material to Warehouse</p>
      </div>

      <div className="p-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className={labelClass}>Material Name</label>
            <input
              type="text"
              placeholder="e.g. Premium Teak Wood"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className={inputClass + " cursor-pointer"}
            >
              <option value="">Select Category...</option>
              <option value="Raw Wood">Raw Wood</option>
              <option value="Finishing">Finishing</option>
              <option value="Fabric">Fabric</option>
              <option value="Hardware">Hardware</option>
              <option value="Chemicals">Chemicals</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Quantity</label>
              <input
                type="number"
                placeholder="0"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                required
                min="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
                className={inputClass + " cursor-pointer"}
              >
                <option value="">Select...</option>
                <option value="Pieces">Pieces</option>
                <option value="Liters">Liters</option>
                <option value="Meters">Meters</option>
                <option value="Cubic ft">Cubic ft</option>
                <option value="Kg">Kg</option>
                <option value="Dozen">Dozen</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-2 w-full h-12 flex items-center justify-center gap-2 font-bold rounded-2xl transition-all active:scale-[0.98] text-sm shadow-lg
              ${success
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/10'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : success ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved Successfully!</>
            ) : (
              '+ Save to Inventory'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddMaterialForm;
