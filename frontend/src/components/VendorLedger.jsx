import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, Users, Wallet, History, Search, Package, Trash2, Pencil, Check, X, Tag, Phone, ShoppingCart, CreditCard, Receipt, Coins, ArrowRight, UserPlus, Briefcase } from 'lucide-react';
import { API } from '../lib/api';

function VendorLedger() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Forms
  const [showNewVendor, setShowNewVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorContact, setNewVendorContact] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('');

  const [txType, setTxType] = useState('BILL');
  const [txQty, setTxQty] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txPaid, setTxPaid] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txSaving, setTxSaving] = useState(false);

  const [editingTx, setEditingTx] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');

  const fetchData = async (autoSelectId = null) => {
    try {
      const vRes = await fetch(`${API}/api/vendors`);
      const vData = await vRes.json();
      const vArr = Array.isArray(vData) ? vData : [];
      setVendors(vArr);
      if (autoSelectId) {
        const found = vArr.find(v => v.id === autoSelectId);
        if (found) selectVendor(found);
      } else if (selectedVendor) {
        const updated = vArr.find(v => v.id === selectedVendor.id);
        if (updated) setSelectedVendor(updated);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async (vendorId) => {
    if (!vendorId) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/api/vendors/${vendorId}/transactions`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setTxLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!newVendorName) return;
    try {
      const res = await fetch(`${API}/api/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVendorName, contact: newVendorContact, category: newVendorCategory })
      });
      if (res.ok) {
        const data = await res.json();
        setNewVendorName(''); setNewVendorContact(''); setNewVendorCategory(''); setShowNewVendor(false);
        fetchData(data.id);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/vendors/${editingVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, contact: editContact, category: editingVendor.category })
      });
      if (res.ok) {
        setEditingVendor(null);
        fetchData(editingVendor.id);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('WARNING: Delete supplier profile permanently?')) return;
    try {
      const res = await fetch(`${API}/api/vendors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedVendor?.id === id) setSelectedVendor(null);
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const billVal = Number(txAmount) || 0;
    const paidVal = Number(txPaid) || 0;
    if (billVal <= 0 && paidVal <= 0) return alert('Enter amount');
    if (!txDesc.trim()) return alert('Detail required');
    if (!selectedVendor) return;
    setTxSaving(true);
    try {
      if (!editingTx) {
          if (billVal > 0) {
              const res1 = await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'BILL', amount: billVal, description: txDesc || 'Purchase', date: txDate })
              });
              if (!res1.ok) throw new Error('Post failed');
          }
          if (paidVal > 0) {
              const res2 = await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: billVal > 0 ? `Paid: ${txDesc}` : (txDesc || 'Cash Paid'), date: txDate })
              });
              if (!res2.ok) throw new Error('Post failed');
          }
      } else {
         const origHasBill = editingTx.isMerged || (!editingTx.isMerged && editingTx.origTx.type === 'BILL');
         const origHasPayment = editingTx.isMerged || (!editingTx.isMerged && editingTx.origTx.type === 'PAYMENT');
         
         const pId = editingTx.isMerged ? editingTx.pId : (origHasBill ? editingTx.id : null);
         const rId = editingTx.isMerged ? editingTx.rId : (origHasPayment ? editingTx.id : null);

         if (billVal > 0) {
             if (pId) {
                 await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions/${pId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'BILL', amount: billVal, description: txDesc, date: txDate })
                 });
             } else {
                 await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'BILL', amount: billVal, description: txDesc, date: txDate })
                 });
             }
         } else if (pId) {
             await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions/${pId}`, { method: 'DELETE' });
         }

         if (paidVal > 0) {
             if (rId) {
                 await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions/${rId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: billVal > 0 ? `Paid: ${txDesc}` : txDesc, date: txDate })
                 });
             } else {
                 await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: billVal > 0 ? `Paid: ${txDesc}` : txDesc, date: txDate })
                 });
             }
         } else if (rId) {
             await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions/${rId}`, { method: 'DELETE' });
         }
      }
      setTxAmount(''); setTxPaid(''); setTxDesc(''); setEditingTx(null);
      fetchTransactions(selectedVendor.id);
      fetchData(selectedVendor.id);
    } catch (e) { alert(e.message); }
    finally { setTxSaving(false); }
  };

  const selectVendor = (v) => { setSelectedVendor(v); fetchTransactions(v.id); };

  const startEditTransaction = (tx) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAmount(tx.debit || '');
    setTxPaid(tx.credit || '');
    setTxDesc(tx.desc || '');
    setTxDate(new Date(tx.created_at).toISOString().split('T')[0]);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const mergedLedgerData = useMemo(() => {
    if (!selectedVendor || !transactions.length) return [];
    const chron = [...transactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    let running = 0;
    const computed = chron.map(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'BILL') running += amt;
      else if (tx.type === 'PAYMENT') running -= amt;
      return { ...tx, balAfter: running };
    });
    const rows = [];
    const usedIds = new Set();
    computed.forEach((tx) => {
      if (usedIds.has(tx.id)) return;
      if (tx.type === 'BILL') {
        const pmt = computed.find((p) => !usedIds.has(p.id) && p.type === 'PAYMENT' && (new Date(p.created_at).toDateString() === new Date(tx.created_at).toDateString() && (p.description.includes(tx.description) || p.description.toLowerCase().includes('down payment'))));
        if (pmt) {
          rows.push({ id: `mtr-${tx.id}`, date: tx.created_at, desc: tx.description, debit: tx.amount, credit: pmt.amount, balance: pmt.balAfter, isMerged: true, pId: tx.id, rId: pmt.id, qty: tx.qty, origTx: tx });
          usedIds.add(tx.id); usedIds.add(pmt.id); return;
        }
      }
      rows.push({ id: tx.id, date: tx.created_at, desc: tx.description, debit: tx.type === 'BILL' ? tx.amount : 0, credit: tx.type === 'PAYMENT' ? tx.amount : 0, balance: tx.balAfter, isMerged: false, qty: tx.qty, origTx: tx });
      usedIds.add(tx.id);
    });
    return rows.reverse();
  }, [transactions, selectedVendor]);

  const totals = useMemo(() => {
    let bill = 0, totalPaid = 0;
    transactions.forEach(tx => { if (tx.type === 'BILL') bill += Number(tx.amount); else totalPaid += Number(tx.amount); });
    return { 
        bill, 
        paid: Math.min(bill, totalPaid),
        advance: Math.max(0, totalPaid - bill),
        balance: bill - totalPaid
    };
  }, [transactions]);

  const prevBal = useMemo(() => {
    if (!selectedVendor) return 0;
    if (editingTx) {
       const isBill = editingTx.type === 'BILL' || (!editingTx.isMerged && editingTx.origTx.type === 'BILL');
       return Number(editingTx.balance) - (isBill ? Number(editingTx.debit || 0) : -Number(editingTx.credit || 0));
    }
    return totals.balance;
  }, [selectedVendor, editingTx, totals]);

  const newBal = prevBal + (Number(txAmount) || 0) - (Number(txPaid) || 0);

  const inputClass = "w-full h-12 md:h-14 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#C5A059] outline-none transition-all no-spinner";

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-0 min-h-screen">
      
      {/* SIDEBAR */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-4">
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2"><Users className="w-5 h-5 text-[#C5A059]"/> Suppliers</h2>
              <button onClick={() => setShowNewVendor(!showNewVendor)} className="p-2 bg-[#C5A059] text-white rounded-xl shadow-lg hover:scale-105 transition-all"><Plus className="w-4 h-4"/></button>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Filter supplier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
           </div>
        </div>

        {showNewVendor && (
          <div className="bg-white rounded-[24px] p-5 border-2 border-[#C5A059]/20 shadow-xl animate-in fade-in slide-in-from-top-4">
             <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-widest mb-4">Register Supplier</h4>
             <form onSubmit={handleCreateVendor} className="space-y-3">
                <input required placeholder="Vendor Name" className={inputClass} value={newVendorName} onChange={e => setNewName(e.target.value)} />
                <input placeholder="Contact" className={inputClass} value={newVendorContact} onChange={e => setNewVendorContact(e.target.value)} />
                <button type="submit" className="w-full h-11 bg-[#0b121e] text-white rounded-xl font-black text-[10px] uppercase">Create Account</button>
             </form>
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-[60vh] lg:max-h-none overflow-y-auto pr-1">
          {vendors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase())).map(v => {
            const active = selectedVendor?.id === v.id;
            const bal = Number(v.balance) || 0;
            return (
              <div key={v.id} onClick={() => selectVendor(v)} className={`p-4 rounded-[20px] border transition-all cursor-pointer flex justify-between items-center ${active ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-transparent bg-white shadow-sm hover:border-slate-200'}`}>
                <div className="min-w-0 pr-4">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{v.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{v.category || 'Vendor'}</p>
                </div>
                <p className={`font-black text-xs shrink-0 ${bal > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₨ {Math.abs(bal).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {!selectedVendor ? (
           <div className="bg-white rounded-[32px] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100">
              <Package className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">Procurement Ledger</h3>
              <p className="text-slate-300 mt-2 text-sm italic">Select a supplier to manage purchase history.</p>
           </div>
        ) : (
          <>
            {/* CLEAN PROFESSIONAL HEADER - MATCHING LABOUR */}
            <div className="bg-[#0b121e] rounded-[32px] p-8 md:p-10 shadow-2xl relative border border-white/5 overflow-hidden">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter truncate max-w-[200px] sm:max-w-none">{selectedVendor.name}</h2>
                          <div className="flex items-center gap-2">
                             <button onClick={() => { setEditingVendor(selectedVendor); setEditName(selectedVendor.name); setEditContact(selectedVendor.contact || ''); }} className="p-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"><Pencil className="w-4 h-4"/></button>
                             <button onClick={() => handleDeleteVendor(selectedVendor.id)} className="p-2.5 bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#C5A059]">
                          <span className="bg-[#C5A059]/10 px-3 py-1 rounded-md flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/> {selectedVendor.category} Supplier</span>
                          {selectedVendor.contact && <span className="text-slate-500">· {selectedVendor.contact}</span>}
                       </div>
                    </div>
                 </div>

                 {/* AMOUNT STABILITY: 2x2 Professional Grid */}
                 <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[24px] hover:bg-white/[0.05] transition-all group">
                       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 group-hover:text-slate-400">Total Purchase</p>
                       <p className="text-2xl font-black text-white tabular-nums">₨ {totals.bill.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/5 p-6 rounded-[24px] hover:bg-emerald-500/[0.06] transition-all group">
                       <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest mb-2 group-hover:text-emerald-400">Paid Against Bills</p>
                       <p className="text-2xl font-black text-emerald-400 tabular-nums">₨ {totals.paid.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-500/[0.03] border border-blue-500/5 p-6 rounded-[24px] hover:bg-blue-500/[0.06] transition-all group">
                       <p className="text-[11px] font-bold text-blue-400/60 uppercase tracking-widest mb-2 group-hover:text-blue-400">Advance Paid</p>
                       <p className="text-2xl font-black text-blue-500 tabular-nums">₨ {totals.advance.toLocaleString()}</p>
                    </div>
                    <div className={`border p-6 rounded-[24px] transition-all group ${totals.balance > 0 ? 'bg-red-500/[0.03] border-red-500/10 hover:bg-red-500/[0.06]' : 'bg-emerald-500/[0.03] border-emerald-500/10 hover:bg-emerald-500/[0.06]'}`}>
                       <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${totals.balance > 0 ? 'text-red-400/60 group-hover:text-red-400' : 'text-emerald-400/60 group-hover:text-emerald-400'}`}>Net Balance</p>
                       <p className={`text-2xl font-black tabular-nums ${totals.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {totals.balance < 0 ? `Advance: ₨ ${Math.abs(totals.balance).toLocaleString()}` : `Remaining: ₨ ${Math.abs(totals.balance).toLocaleString()}`}
                       </p>
                    </div>
                 </div>
                 
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
            </div>

            {editingVendor && (
               <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
                  <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative border-t-8 border-[#C5A059] animate-in zoom-in-95 duration-200">
                     <button onClick={() => setEditingVendor(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><X className="w-6 h-6"/></button>
                     <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter mb-8 flex items-center gap-3"><Pencil className="w-5 h-5 text-[#C5A059]"/> Update Profile</h4>
                     <form onSubmit={handleUpdateVendor} className="space-y-4">
                        <div className="space-y-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Company Name</label>
                           <input required className={inputClass} value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Contact</label>
                           <input className={inputClass} value={editName} onChange={e => setEditContact(e.target.value)} />
                        </div>
                        <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4 active:scale-95 transition-all">Save Changes</button>
                     </form>
                  </div>
               </div>
            )}

            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 relative group">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#C5A059]"><Receipt className="w-5 h-5" /></div>
                     <div>
                        <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">Record Purchase</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Post materials bought or cash paid</p>
                     </div>
                  </div>
               </div>

               <form onSubmit={handleAddTransaction} className="space-y-6">
                 {editingTx && (
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between animate-in slide-in-from-top-2">
                       <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><Pencil className="w-4 h-4 text-blue-500 animate-pulse"/> Editing Entry...</p>
                       <X className="w-6 h-6 text-blue-400 cursor-pointer" onClick={() => { setEditingTx(null); setTxAmount(''); setTxDesc(''); }} />
                    </div>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Detail / Task</label>
                        <input required placeholder="Task description..." className={inputClass} value={txDesc} onChange={e => setTxDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Date</label>
                        <input type="date" required className={inputClass} value={txDate} onChange={e => setTxDate(e.target.value)} />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Prev Balance</label>
                         <div className={`flex items-center ${inputClass} bg-slate-50 cursor-not-allowed select-none ${prevBal < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                             {prevBal < 0 ? `Advance: ₨ ${Math.abs(prevBal).toLocaleString()}` : `Remaining: ₨ ${Math.abs(prevBal).toLocaleString()}`}
                         </div>
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Total Bill (₨)</label>
                         <input type="number" min="0" placeholder="0" className={inputClass} value={txAmount} onChange={e => setTxAmount(e.target.value)} />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 ml-1">Cash Paid (₨)</label>
                         <input type="number" min="0" placeholder="0" className={inputClass} value={txPaid} onChange={e => setTxPaid(e.target.value)} />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 ml-1">New Balance</label>
                         <div className={`flex items-center ${inputClass} bg-slate-50 cursor-not-allowed select-none ${newBal < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                             {newBal < 0 ? `Advance: ₨ ${Math.abs(newBal).toLocaleString()}` : `Remaining: ₨ ${Math.abs(newBal).toLocaleString()}`}
                         </div>
                     </div>
                 </div>
                 
                 <div className="flex justify-end pt-4">
                    <button type="submit" disabled={txSaving} className="w-full md:w-[240px] h-14 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[#C5A059]">
                        {txSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Check className="w-5 h-5"/>}
                        {txSaving ? 'Saving...' : 'Post Entry'}
                    </button>
                 </div>
               </form>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
               <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-xs flex items-center gap-3 uppercase tracking-widest"><History className="w-4 h-4 text-[#C5A059]" /> Account History</h3>
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{mergedLedgerData.length} Entries</span>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[800px]">
                   <thead>
                     <tr className="bg-slate-50/50">
                       <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Bill Amt</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Paid Amt</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Remaining</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Balance</th>
                       <th className="pr-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                     </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {txLoading ? (
                        <tr><td colSpan="7" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#C5A059] mx-auto" /></td></tr>
                      ) : mergedLedgerData.length === 0 ? (
                        <tr><td colSpan="7" className="py-24 text-center font-bold text-slate-300 uppercase text-[10px] tracking-widest">No History</td></tr>
                      ) : (
                        mergedLedgerData.map(row => (
                          <tr key={row.id} className="group hover:bg-slate-50 transition-all">
                             <td className="pl-8 py-6 text-xs font-black text-slate-900">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                             <td className="px-5 py-6 font-bold text-slate-600 text-[13px]">{row.desc}</td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-slate-900 whitespace-nowrap">
                                {Number(row.debit) > 0 ? `₨ ${Number(row.debit).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-emerald-600 whitespace-nowrap">
                                {Number(row.credit) > 0 ? `₨ ${Number(row.credit).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-orange-500 whitespace-nowrap">
                                {Number(row.debit) - Number(row.credit) !== 0 ? `₨ ${(Number(row.debit) - Number(row.credit)).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs whitespace-nowrap bg-slate-50/20">
                                ₨ {Math.abs(row.balance).toLocaleString()}
                             </td>
                             <td className="pr-8 py-6 text-right">
                                <div className="flex items-center justify-center gap-2">
                                   <button onClick={() => startEditTransaction(row)} className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-50 shadow-sm"><Pencil className="w-3.5 h-3.5"/></button>
                                   <button onClick={async () => {
                                       if (!confirm('Delete record?')) return;
                                       const ids = row.isMerged ? [row.pId, row.rId] : [row.id];
                                       for (const id of ids) await fetch(`${API}/api/vendors/${selectedVendor.id}/transactions/${id}`, { method: 'DELETE' });
                                       fetchTransactions(selectedVendor.id); fetchData(selectedVendor.id);
                                   }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-50 shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                             </td>
                          </tr>
                        ))
                      )}
                      {!txLoading && mergedLedgerData.length > 0 && (
                        <tr className="bg-slate-900 text-white font-black border-t-2 border-[#C5A059]">
                           <td colSpan="2" className="pl-8 py-7 text-[10px] uppercase tracking-widest text-[#C5A059]">Consolidated Procurement Statement</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm">₨ {totals.bill.toLocaleString()}</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-emerald-400">₨ {(totals.paid + totals.advance).toLocaleString()}</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-orange-400">₨ {(totals.bill - (totals.paid + totals.advance)).toLocaleString()}</td>
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

export default VendorLedger;
