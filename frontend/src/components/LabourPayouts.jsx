import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Users, TrendingUp, Trash2, Pencil, X } from 'lucide-react';
import { API } from '../lib/api';

function LabourPayouts() {
  const [workerName, setWorkerName] = useState('');
  const [jobType, setJobType] = useState('Carving');
  const [quantity, setQuantity] = useState(1);
  const [ratePerUnit, setRatePerUnit] = useState(500);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);

  const totalPayout = quantity * ratePerUnit;

  const fetchHistory = () => {
    setHistLoading(true);
    fetch(`${API}/api/payouts`)
      .then(r => r.json())
      .then(data => { setHistory(Array.isArray(data) ? data : []); setHistLoading(false); })
      .catch(() => setHistLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSave = async () => {
    if (!workerName.trim()) { alert('Worker ka naam likhein'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerName, jobType, quantity, ratePerUnit, totalPayout })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setWorkerName('');
        fetchHistory();
        setTimeout(() => setSuccess(false), 2500);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ workerName: '', jobType: '', quantity: 1, ratePerUnit: 0 });

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ workerName: p.worker_name, jobType: p.job_type, quantity: p.quantity, ratePerUnit: p.rate_per_unit });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const total = editForm.quantity * editForm.ratePerUnit;
    try {
      await fetch(`${API}/api/payouts/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, totalPayout: total })
      });
      setEditingId(null);
      fetchHistory();
    } catch(err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payout record?')) return;
    try {
      await fetch(`${API}/api/payouts/${id}`, { method: 'DELETE' });
      fetchHistory();
    } catch (e) { console.error(e); }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:border-[#C5A059] focus:bg-white focus:ring-4 focus:ring-[#C5A059]/10 outline-none transition-all";
  const labelClass = "block text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2";

  return (
    <div className="flex flex-col gap-8">
      {/* Calculator Card */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
        <h5 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#C5A059]" />
          Piece-Rate Labour Calculator
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div>
            <label className={labelClass}>Worker Name</label>
            <input type="text" className={inputClass} placeholder="e.g. Ahmad Ali" value={workerName} onChange={e => setWorkerName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Job / Stage</label>
            <input type="text" className={inputClass} value={jobType} onChange={e => setJobType(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Rate per Unit (Rs)</label>
            <input type="number" className={inputClass} value={ratePerUnit} onChange={e => setRatePerUnit(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Qty Completed</label>
            <input type="number" className={inputClass} value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
          </div>
        </div>

        {/* Total Display */}
        <div className="bg-gradient-to-r from-[#000B1A] to-[#001a35] rounded-2xl p-6 flex items-center justify-between mb-5">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Payout</p>
            <p className="text-3xl font-black text-white">Rs. {totalPayout.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">for {quantity} {jobType}(s) @ Rs.{ratePerUnit}/unit</p>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-[#C5A059]/20 flex items-center justify-center">
            <Users className="w-7 h-7 text-[#C5A059]" />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-full h-12 flex items-center justify-center gap-2 font-bold rounded-2xl transition-all active:scale-[0.98] text-sm
            ${success ? 'bg-emerald-500 text-white' : 'bg-[#C5A059] hover:bg-[#8E6F3E] text-white'}
            disabled:opacity-70 shadow-lg shadow-[#C5A059]/20`}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            : success ? <><CheckCircle2 className="w-4 h-4" /> Saved to Ledger!</>
            : '✓ Save to Labour Ledger'}
        </button>
      </div>

      {/* History Table */}
      <div>
        <h5 className="text-base font-bold text-slate-900 mb-4">Recent Payouts History</h5>
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <th className="px-6 py-4">Worker</th>
                <th className="px-6 py-4">Job Type</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Total Paid</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {histLoading ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center">
                  <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-400 text-sm">No payout records yet</td></tr>
              ) : history.map(p => {
                const isEditing = editingId === p.id;
                if (isEditing) {
                  return (
                    <tr key={p.id} className="bg-slate-50">
                      <td className="px-6 py-4">
                        <input value={editForm.workerName} onChange={e => setEditForm({...editForm, workerName: e.target.value})} className="w-full px-2 py-1 border rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <input value={editForm.jobType} onChange={e => setEditForm({...editForm, jobType: e.target.value})} className="w-full px-2 py-1 border rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: Number(e.target.value)})} className="w-16 px-2 py-1 border rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <input type="number" value={editForm.ratePerUnit} onChange={e => setEditForm({...editForm, ratePerUnit: Number(e.target.value)})} className="w-24 px-2 py-1 border rounded" />
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
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-800">{p.worker_name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.job_type}</td>
                    <td className="px-6 py-4 text-slate-600">{p.quantity}</td>
                    <td className="px-6 py-4 text-slate-600">Rs. {Number(p.rate_per_unit).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">Rs. {Number(p.total_payout).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(p.created_at).toLocaleString('en-PK')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit payout">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete payout">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
  );
}

export default LabourPayouts;
