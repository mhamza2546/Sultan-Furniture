import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, ArrowRight, UserPlus, Search, Wallet, History, Pencil, Trash2, Check, X, Tag, Phone, ShoppingCart, Coins, UserCircle, Briefcase, Store } from 'lucide-react';
import { API } from '../lib/api';

function CustomerLedger() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newJob, setNewJob] = useState('Showroom');

  const [txAmount, setTxAmount] = useState('');
  const [txPaid, setTxPaid] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txSaving, setTxSaving] = useState(false);

  const [editingTx, setEditingTx] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchCustomers = async (autoSelectId = null) => {
    try {
      const res = await fetch(`${API}/api/customers`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setCustomers(arr);
      if (autoSelectId) {
        const found = arr.find(c => c.id === autoSelectId);
        if (found) selectCustomer(found);
      } else if (selectedCustomer) {
        const updated = arr.find(c => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async (customerId) => {
    if (!customerId) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/api/customers/${customerId}/transactions`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setTxLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newName) return;
    try {
        const res = await fetch(`${API}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, job_role: 'Showroom Partner' })
        });
        if (res.ok) {
            const data = await res.json();
            setNewName(''); setShowNewCustomer(false);
            fetchCustomers(data.id);
        }
    } catch (e) { console.error(e); }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, job_role: editingCustomer.job_role })
      });
      if (res.ok) {
        setEditingCustomer(null);
        fetchCustomers(editingCustomer.id);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCustomer = async (id) => {
    if (!confirm('WARNING: Delete showroom profile permanently?')) return;
    try {
        const res = await fetch(`${API}/api/customers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (selectedCustomer?.id === id) setSelectedCustomer(null);
            fetchCustomers();
        }
    } catch (e) { console.error(e); }
  };

  const handlePostTransaction = async (e) => {
    e.preventDefault();
    const amountVal = Number(txAmount) || 0;
    const paidVal = Number(txPaid) || 0;

    if (amountVal <= 0 && paidVal <= 0) return alert('Enter total amount or received amount');
    if (!selectedCustomer) return;

    setTxSaving(true);
    try {
      if (!editingTx) {
        if (amountVal > 0) {
            const res1 = await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'PURCHASE', amount: amountVal, description: txDesc || 'Electronic Sale', date: txDate })
            });
            if (!res1.ok) throw new Error('Post failed');
        }
        if (paidVal > 0) {
            const res2 = await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: amountVal > 0 ? `Down Payment: ${txDesc}` : (txDesc || 'Payment Received'), date: txDate })
            });
            if (!res2.ok) throw new Error('Post failed');
        }
      } else {
         const origHasPurchase = editingTx.isMerged || (!editingTx.isMerged && editingTx.orig.type === 'PURCHASE');
         const origHasPayment = editingTx.isMerged || (!editingTx.isMerged && editingTx.orig.type === 'PAYMENT');
         
         const pId = editingTx.isMerged ? editingTx.pId : (origHasPurchase ? editingTx.id : null);
         const rId = editingTx.isMerged ? editingTx.rId : (origHasPayment ? editingTx.id : null);

         if (amountVal > 0) {
             if (pId) {
                 await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions/${pId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PURCHASE', amount: amountVal, description: txDesc, date: txDate })
                 });
             } else {
                 await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PURCHASE', amount: amountVal, description: txDesc, date: txDate })
                 });
             }
         } else if (pId) {
             await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions/${pId}`, { method: 'DELETE' });
         }

         if (paidVal > 0) {
             if (rId) {
                 await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions/${rId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: txDesc, date: txDate })
                 });
             } else {
                 await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: amountVal > 0 ? `Down Payment: ${txDesc}` : txDesc, date: txDate })
                 });
             }
         } else if (rId) {
             await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions/${rId}`, { method: 'DELETE' });
         }
      }

      setTxAmount(''); setTxPaid(''); setTxDesc(''); setEditingTx(null);
      fetchTransactions(selectedCustomer.id);
      fetchCustomers(selectedCustomer.id);
    } catch (e) { alert(e.message); }
    finally { setTxSaving(false); }
  };

  const selectCustomer = (c) => { setSelectedCustomer(c); fetchTransactions(c.id); };

  const startEdit = (row) => {
      setEditingTx(row);
      setTxAmount(row.sale > 0 ? row.sale : '');
      setTxPaid(row.received > 0 ? row.received : '');
      setTxDesc(row.desc);
      setTxDate(new Date(row.date).toISOString().split('T')[0]);
      window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const mergedData = useMemo(() => {
    if (!selectedCustomer || !transactions.length) return [];
    const sorted = [...transactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    let running = 0;
    const computed = sorted.map(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'PURCHASE') running += amt; else running -= amt;
      return { ...tx, balAfter: running };
    });
    const rows = [];
    const used = new Set();
    computed.forEach(tx => {
      if (used.has(tx.id)) return;
      if (tx.type === 'PURCHASE') {
        const pmt = computed.find(p => !used.has(p.id) && p.type === 'PAYMENT' && (new Date(p.created_at).toDateString() === new Date(tx.created_at).toDateString() && (p.description.includes(tx.description) || p.description.toLowerCase().includes('down payment'))));
        if (pmt) {
          rows.push({ id: `m-${tx.id}`, date: tx.created_at, desc: tx.description, sale: tx.amount, received: pmt.amount, balance: pmt.balAfter, isMerged: true, pId: tx.id, rId: pmt.id, orig: tx });
          used.add(tx.id); used.add(pmt.id); return;
        }
      }
      rows.push({ id: tx.id, date: tx.created_at, desc: tx.description, sale: tx.type === 'PURCHASE' ? tx.amount : 0, received: tx.type === 'PAYMENT' ? tx.amount : 0, balance: tx.balAfter, isMerged: false, orig: tx });
      used.add(tx.id);
    });
    return rows.reverse();
  }, [transactions, selectedCustomer]);

  const totals = useMemo(() => {
    let sales = 0, rec = 0;
    transactions.forEach(tx => { if (tx.type === 'PURCHASE') sales += Number(tx.amount); else rec += Number(tx.amount); });
    return { sales, rec, balance: sales - rec };
  }, [transactions]);

  const inputClass = "w-full h-12 md:h-14 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#C5A059] outline-none transition-all no-spinner";

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-0 min-h-screen">
      
      {/* SIDEBAR */}
      <div className="w-full lg:w-[300px] shrink-0 space-y-4">
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2"><Store className="w-5 h-5 text-[#C5A059]"/> Showrooms</h2>
            <button onClick={() => setShowNewCustomer(!showNewCustomer)} className="p-2 bg-[#C5A059] text-white rounded-xl shadow-lg hover:scale-105 transition-all"><Plus className="w-4 h-4"/></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Filter..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
          </div>
        </div>

        {showNewCustomer && (
          <div className="bg-white rounded-[24px] p-5 border-2 border-[#C5A059]/20 shadow-xl animate-in slide-in-from-top-4">
             <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-widest mb-4">Add Partner</h4>
             <form onSubmit={handleCreateCustomer} className="space-y-3">
                <input required placeholder="Showroom Name" className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} />
                <button type="submit" className="w-full h-11 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase">Create</button>
             </form>
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-[60vh] lg:max-h-none overflow-y-auto pr-1">
          {loading ? (
             <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" /></div>
          ) : customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => {
            const active = selectedCustomer?.id === c.id;
            const bal = Number(c.balance) || 0;
            return (
              <div key={c.id} onClick={() => selectCustomer(c)} className={`p-4 rounded-[20px] border transition-all cursor-pointer flex justify-between items-center ${active ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-transparent bg-white shadow-sm hover:border-slate-200'}`}>
                <div className="min-w-0 pr-4">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{c.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{c.job_role || 'Partner'}</p>
                </div>
                <p className={`font-black text-xs shrink-0 ${bal > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₨ {Math.abs(bal).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {!selectedCustomer ? (
           <div className="bg-white rounded-[32px] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100">
              <Store className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">Showroom Statement</h3>
              <p className="text-slate-300 mt-2 text-sm italic">Select a partner to manage daily sales history.</p>
           </div>
        ) : (
          <>
            {/* CLEAN PROFESSIONAL HEADER - MATCHING LABOUR */}
            <div className="bg-[#0b121e] rounded-[32px] p-8 md:p-10 shadow-2xl relative border border-white/5 overflow-hidden">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter truncate max-w-[200px] sm:max-w-none">{selectedCustomer.name}</h2>
                          <div className="flex items-center gap-2">
                             <button onClick={() => { setEditingCustomer(selectedCustomer); setEditName(selectedCustomer.name); }} className="p-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all shadow-lg active:scale-95"><Pencil className="w-4 h-4"/></button>
                             <button onClick={() => handleDeleteCustomer(selectedCustomer.id)} className="p-2.5 bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#C5A059]">
                          <span className="bg-[#C5A059]/10 px-3 py-1 rounded-md flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/> {selectedCustomer.job_role}</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                    <div className="bg-white/[0.03] border border-white/5 px-2 py-6 rounded-[24px] text-center hover:bg-white/[0.05] transition-all group overflow-hidden">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400">Total Sales Bill</p>
                       <p className="text-lg md:text-xl font-black text-white tabular-nums truncate">₨ {totals.sales.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/5 px-2 py-6 rounded-[24px] text-center hover:bg-emerald-500/[0.06] transition-all group overflow-hidden">
                       <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mb-1 group-hover:text-emerald-400">Total Received</p>
                       <p className="text-lg md:text-xl font-black text-emerald-400 tabular-nums truncate">₨ {totals.rec.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-500/[0.03] border border-red-500/5 px-2 py-6 rounded-[24px] text-center hover:bg-red-500/[0.06] transition-all group overflow-hidden">
                       <p className="text-[10px] font-bold text-red-400/60 uppercase tracking-widest mb-1 group-hover:text-red-400">Net Balance</p>
                       <p className="text-lg md:text-xl font-black text-red-500 tabular-nums truncate">₨ {Math.abs(totals.balance).toLocaleString()}</p>
                    </div>
                 </div>
                 
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
            </div>

            {editingCustomer && (
               <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
                  <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative border-t-8 border-[#C5A059] animate-in zoom-in-95 duration-200">
                     <button onClick={() => setEditingCustomer(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><X className="w-6 h-6"/></button>
                     <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter mb-8 flex items-center gap-3"><Pencil className="w-5 h-5 text-[#C5A059]"/> Update Showroom</h4>
                     <form onSubmit={handleUpdateCustomer} className="space-y-4">
                        <div className="space-y-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Showroom Name</label>
                           <input required className={inputClass} value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4 active:scale-95 transition-all">Save Changes</button>
                     </form>
                  </div>
               </div>
            )}

            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 relative group">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#C5A059]"><ShoppingCart className="w-5 h-5" /></div>
                     <div>
                        <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">Record Transaction</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Post showroom sales or payments</p>
                     </div>
                  </div>
               </div>

               <form onSubmit={handlePostTransaction} className="space-y-6">
                 {editingTx && (
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between animate-in slide-in-from-top-2">
                       <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><Pencil className="w-4 h-4 text-blue-500 animate-pulse"/> Editing Transaction...</p>
                       <X className="w-6 h-6 text-blue-400 cursor-pointer" onClick={() => { setEditingTx(null); setTxAmount(''); setTxPaid(''); setTxDesc(''); }} />
                    </div>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Detail / Item</label>
                        <input required placeholder="What was sold or payment details?" className={inputClass} value={txDesc} onChange={e => setTxDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Date</label>
                        <input type="date" required className={inputClass} value={txDate} onChange={e => setTxDate(e.target.value)} />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Total Amount</label>
                         <input type="number" min="0" placeholder="0" className={inputClass} value={txAmount} onChange={e => setTxAmount(e.target.value)} />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 ml-1">Received Amount</label>
                         <input type="number" min="0" placeholder="0" className={inputClass} value={txPaid} onChange={e => setTxPaid(e.target.value)} />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 ml-1">Remaining</label>
                         <div className={`flex items-center ${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed select-none`}>
                             {Math.max(0, (Number(txAmount) || 0) - (Number(txPaid) || 0)).toLocaleString()}
                         </div>
                     </div>
                 </div>
                 
                 <div className="flex justify-end pt-4">
                    <button type="submit" disabled={txSaving} className="w-full md:w-[240px] h-14 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[#C5A059]">
                        {txSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Check className="w-5 h-5"/>}
                        {txSaving ? 'Saving...' : 'Post Record'}
                    </button>
                 </div>
               </form>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
               <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-xs flex items-center gap-3 uppercase tracking-widest"><History className="w-4 h-4 text-[#C5A059]" /> Showroom History Audit</h3>
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{mergedData.length} Records</span>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[800px]">
                   <thead>
                     <tr className="bg-slate-50/50">
                       <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Sale (+)</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Received (-)</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Remaining</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Net Balance</th>
                       <th className="pr-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                     </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {txLoading ? (
                        <tr><td colSpan="7" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#C5A059] mx-auto" /></td></tr>
                      ) : mergedData.length === 0 ? (
                        <tr><td colSpan="7" className="py-24 text-center font-bold text-slate-300 uppercase text-[10px] tracking-widest">No History</td></tr>
                      ) : (
                        mergedData.map(row => (
                          <tr key={row.id} className="group hover:bg-slate-50 transition-all">
                             <td className="pl-8 py-6 text-xs font-black text-slate-900">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                             <td className="px-5 py-6 font-bold text-slate-600 text-[13px]">{row.desc}</td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-slate-900 whitespace-nowrap">
                                {Number(row.sale) > 0 ? `₨ ${Number(row.sale).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-emerald-600 whitespace-nowrap">
                                {Number(row.received) > 0 ? `₨ ${Number(row.received).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-orange-500 whitespace-nowrap">
                                {Number(row.sale) - Number(row.received) !== 0 ? `₨ ${(Number(row.sale) - Number(row.received)).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs whitespace-nowrap bg-slate-50/20">
                                ₨ {Math.abs(row.balance).toLocaleString()}
                             </td>
                             <td className="pr-8 py-6 text-right">
                                <div className="flex items-center justify-center gap-2">
                                   <button onClick={() => startEdit(row)} className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-50 shadow-sm"><Pencil className="w-3.5 h-3.5"/></button>
                                   <button onClick={async () => {
                                       if (!confirm('Delete record?')) return;
                                       const ids = row.isMerged ? [row.pId, row.rId] : [row.id];
                                       for (const id of ids) await fetch(`${API}/api/customers/${selectedCustomer.id}/transactions/${id}`, { method: 'DELETE' });
                                       fetchTransactions(selectedCustomer.id); fetchCustomers(selectedCustomer.id);
                                   }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-50 shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                             </td>
                          </tr>
                        ))
                      )}
                      {!txLoading && mergedData.length > 0 && (
                        <tr className="bg-slate-900 text-white font-black border-t-2 border-[#C5A059]">
                           <td colSpan="2" className="pl-8 py-7 text-[10px] uppercase tracking-widest text-[#C5A059]">Consolidated Sales Statement Audit</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm">₨ {totals.sales.toLocaleString()}</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-emerald-400">₨ {totals.rec.toLocaleString()}</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-orange-400">₨ {(totals.sales - totals.rec).toLocaleString()}</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-[#C5A059]">₨ {Math.abs(totals.balance).toLocaleString()}</td>
                           <td className="pr-8"></td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }
        .cursor-pointer { cursor: pointer !important; }
      `}</style>
    </div>
  );
}

export default CustomerLedger;
