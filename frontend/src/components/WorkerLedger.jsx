import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, Users, Wallet, History, Search, Package, Trash2, Pencil, Check, X, Calendar, UserCheck, ShieldCheck, UserPlus, Phone, Tag, Briefcase } from 'lucide-react';
import { API } from '../lib/api';

function WorkerLedger() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Worker States
  const [showNewWorker, setShowNewWorker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newJob, setNewJob] = useState('Polisher');
  const [newContact, setNewContact] = useState('');

  // Form States
  const [txAmount, setTxAmount] = useState('');
  const [txPaid, setTxPaid] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txSaving, setTxSaving] = useState(false);

  const [editingTx, setEditingTx] = useState(null);
  const [editingWorker, setEditingWorker] = useState(null);
  const [editName, setEditName] = useState('');
  const [editJob, setEditJob] = useState('');

  const fetchWorkers = async (autoSelectId = null) => {
    try {
      const res = await fetch(`${API}/api/workers`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setWorkers(arr);
      if (autoSelectId) {
        const found = arr.find(w => w.id === autoSelectId);
        if (found) selectWorker(found);
      } else if (selectedWorker) {
          const updated = arr.find(w => w.id === selectedWorker.id);
          if (updated) setSelectedWorker(updated);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async (workerId) => {
    if (!workerId) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/api/workers/${workerId}/transactions`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setTxLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    if (!newName) return;
    try {
      const res = await fetch(`${API}/api/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, job_role: newJob, contact: newContact })
      });
      if (res.ok) {
        const data = await res.json();
        setNewName(''); setNewContact(''); setShowNewWorker(false);
        fetchWorkers(data.id);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateWorker = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API}/api/workers/${editingWorker.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName, job_role: editJob })
        });
        if (res.ok) {
            setEditingWorker(null);
            fetchWorkers(selectedWorker.id);
        }
    } catch (e) { console.error(e); }
  };

  const handleDeleteWorker = async (id) => {
    if (!window.confirm('Delete worker profile permanently?')) return;
    try {
      const res = await fetch(`${API}/api/workers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedWorker?.id === id) setSelectedWorker(null);
        fetchWorkers();
      }
    } catch (e) { console.error(e); }
  };

  const handlePostTransaction = async (e) => {
    e.preventDefault();
    const amountVal = Number(txAmount) || 0;
    const paidVal = Number(txPaid) || 0;

    if (amountVal <= 0 && paidVal <= 0) return alert('Enter total amount or advance paid');
    if (!selectedWorker) return;

    setTxSaving(true);
    try {
      if (!editingTx) {
        if (amountVal > 0) {
            const res1 = await fetch(`${API}/api/workers/${selectedWorker.id}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'EARNING', amount: amountVal, description: txDesc || 'Work Done', date: txDate })
            });
            if (!res1.ok) throw new Error('Post failed');
        }
        if (paidVal > 0) {
            const res2 = await fetch(`${API}/api/workers/${selectedWorker.id}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: amountVal > 0 ? `Advance: ${txDesc}` : (txDesc || 'Advance Paid'), date: txDate })
            });
            if (!res2.ok) throw new Error('Post failed');
        }
      } else {
         const origHasEarning = editingTx.isMerged || (!editingTx.isMerged && editingTx.orig.type === 'EARNING');
         const origHasPayment = editingTx.isMerged || (!editingTx.isMerged && editingTx.orig.type === 'PAYMENT');
         
         const pId = editingTx.isMerged ? editingTx.pId : (origHasEarning ? editingTx.id : null);
         const rId = editingTx.isMerged ? editingTx.rId : (origHasPayment ? editingTx.id : null);

         if (amountVal > 0) {
             if (pId) {
                 await fetch(`${API}/api/workers/${selectedWorker.id}/transactions/${pId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'EARNING', amount: amountVal, description: txDesc, date: txDate })
                 });
             } else {
                 await fetch(`${API}/api/workers/${selectedWorker.id}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'EARNING', amount: amountVal, description: txDesc, date: txDate })
                 });
             }
         } else if (pId) {
             await fetch(`${API}/api/workers/${selectedWorker.id}/transactions/${pId}`, { method: 'DELETE' });
         }

         if (paidVal > 0) {
             if (rId) {
                 await fetch(`${API}/api/workers/${selectedWorker.id}/transactions/${rId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: txDesc, date: txDate })
                 });
             } else {
                 await fetch(`${API}/api/workers/${selectedWorker.id}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'PAYMENT', amount: paidVal, description: amountVal > 0 ? `Advance: ${txDesc}` : txDesc, date: txDate })
                 });
             }
         } else if (rId) {
             await fetch(`${API}/api/workers/${selectedWorker.id}/transactions/${rId}`, { method: 'DELETE' });
         }
      }

      setTxAmount(''); setTxPaid(''); setTxDesc(''); setEditingTx(null);
      fetchTransactions(selectedWorker.id);
      fetchWorkers(selectedWorker.id);
    } catch (e) { alert(e.message); }
    finally { setTxSaving(false); }
  };

  const selectWorker = (w) => { setSelectedWorker(w); fetchTransactions(w.id); };

  const startEditTx = (row) => {
      setEditingTx(row);
      setTxAmount(row.earning > 0 ? row.earning : '');
      setTxPaid(row.payment > 0 ? row.payment : '');
      setTxDesc(row.desc);
      setTxDate(new Date(row.date).toISOString().split('T')[0]);
      window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const processedData = useMemo(() => {
    if (!selectedWorker || !transactions.length) return { rows: [], totals: { earned: 0, taken: 0, paid: 0, advance: 0, balance: 0 } };
    
    const sorted = [...transactions].sort((a, b) => {
        const timeDiff = new Date(a.created_at) - new Date(b.created_at);
        if (timeDiff !== 0) return timeDiff;
        return a.id - b.id;
    });
    
    let running = 0;
    let totalEarned = 0;
    let totalTaken = 0;
    let totalPaid = 0;
    let totalAdvance = 0;

    const computed = sorted.map(tx => {
      const amt = Number(tx.amount) || 0;
      let paid = 0;
      let advance = 0;
      
      if (tx.type === 'EARNING') {
          running += amt;
          totalEarned += amt;
      } else {
          totalTaken += amt;
          if (running > 0) {
              paid = Math.min(running, amt);
              advance = amt - paid;
          } else {
              advance = amt;
          }
          totalPaid += paid;
          totalAdvance += advance;
          running -= amt;
      }
      return { ...tx, balAfter: running, calculatedPaid: paid, calculatedAdvance: advance };
    });

    const rows = [];
    const used = new Set();
    computed.forEach(tx => {
      if (used.has(tx.id)) return;
      if (tx.type === 'EARNING') {
        const pmt = computed.find(p => !used.has(p.id) && p.type === 'PAYMENT' && (new Date(p.created_at).toDateString() === new Date(tx.created_at).toDateString() && (p.description.includes(tx.description) || p.description.toLowerCase().includes('advance'))));
        if (pmt) {
          rows.push({ id: `m-${tx.id}`, date: tx.created_at, desc: tx.description, earning: tx.amount, payment: pmt.amount, paid: pmt.calculatedPaid, advance: pmt.calculatedAdvance, balAfter: pmt.balAfter, isMerged: true, pId: tx.id, rId: pmt.id, orig: tx });
          used.add(tx.id); used.add(pmt.id); return;
        }
      }
      rows.push({ id: tx.id, date: tx.created_at, desc: tx.description, earning: tx.type === 'EARNING' ? tx.amount : 0, payment: tx.type === 'PAYMENT' ? tx.amount : 0, paid: tx.calculatedPaid, advance: tx.calculatedAdvance, balAfter: tx.balAfter, isMerged: false, orig: tx });
      used.add(tx.id);
    });

    return { rows: rows.reverse(), totals: { earned: totalEarned, taken: totalTaken, paid: Math.min(totalEarned, totalTaken), advance: Math.max(0, totalTaken - totalEarned), balance: running } };
  }, [transactions, selectedWorker]);

  const ledgerData = processedData.rows;
  const totals = processedData.totals;

  const prevBal = useMemo(() => {
    if (!selectedWorker) return 0;
    if (editingTx) {
       return Number(editingTx.balAfter) - Number(editingTx.earning || 0) + Number(editingTx.payment || 0);
    }
    return totals.balance;
  }, [selectedWorker, editingTx, totals]);

  const newBal = prevBal + (Number(txAmount) || 0) - (Number(txPaid) || 0);

  const inputClass = "w-full h-12 md:h-14 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#C5A059] outline-none transition-all no-spinner";

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-0 min-h-screen font-inter">
      
      {/* SIDEBAR */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-4">
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2"><Users className="w-5 h-5 text-[#811d1d]"/> Labour List</h2>
              <button onClick={() => setShowNewWorker(!showNewWorker)} className="p-2 bg-[#811d1d] text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus className="w-4 h-4"/></button>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search worker..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
           </div>
        </div>

        {showNewWorker && (
          <div className="bg-white rounded-[24px] p-5 border-2 border-[#811d1d]/20 shadow-xl animate-in slide-in-from-top-4">
             <h4 className="font-extrabold text-slate-900 truncate uppercase text-[10px] tracking-widest mb-4">Register New Labour</h4>
             <form onSubmit={handleCreateWorker} className="space-y-3">
                <input required placeholder="Worker Name" className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} />
                <input placeholder="Phone" className={inputClass} value={newContact} onChange={e => setNewContact(e.target.value)} />
                <select className={inputClass} value={newJob} onChange={e => setNewJob(e.target.value)}>
                    <option value="Polisher">Polisher</option><option value="Carpenter">Carpenter</option><option value="Upholsterer">Upholsterer</option><option value="Helper">Helper</option>
                </select>
                <button type="submit" className="w-full h-11 bg-[#811d1d] text-white rounded-xl font-black text-[10px] uppercase">Create Account</button>
             </form>
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-[60vh] lg:max-h-none overflow-y-auto pr-1">
          {loading ? (
             <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#811d1d]" /></div>
          ) : workers.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase())).map(w => {
            const active = selectedWorker?.id === w.id;
            const bal = Number(w.balance) || 0;
            return (
              <div key={w.id} onClick={() => selectWorker(w)} className={`p-4 rounded-[20px] border transition-all cursor-pointer flex justify-between items-center ${active ? 'border-[#811d1d] bg-[#811d1d]/5' : 'border-transparent bg-white shadow-sm hover:border-slate-200'}`}>
                <div className="min-w-0 pr-4">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{w.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{w.job_role}</p>
                </div>
                <p className={`font-black text-xs shrink-0 ${bal > 0 ? 'text-emerald-500' : 'text-red-500'}`}>₨ {Math.abs(bal).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {!selectedWorker ? (
           <div className="bg-white rounded-[32px] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100">
              <UserCheck className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">Open Labour Account</h3>
              <p className="text-slate-300 mt-2 text-sm max-w-[280px]">Select a worker to manage accounts.</p>
           </div>
        ) : (
          <>
            <div className="bg-[#0b121e] rounded-[32px] p-8 md:p-10 shadow-2xl relative border border-white/5 overflow-hidden">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter truncate max-w-[200px] sm:max-w-none">{selectedWorker.name}</h2>
                          <div className="flex items-center gap-2">
                             <button onClick={() => { setEditingWorker(selectedWorker); setEditName(selectedWorker.name); setEditJob(selectedWorker.job_role); }} className="p-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"><Pencil className="w-4 h-4"/></button>
                             <button onClick={() => handleDeleteWorker(selectedWorker.id)} className="p-2.5 bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#C5A059]">
                          <span className="bg-[#C5A059]/10 px-3 py-1 rounded-md flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/> {selectedWorker.job_role}</span>
                          {selectedWorker.contact && <span className="text-slate-500">· {selectedWorker.contact}</span>}
                       </div>
                    </div>
                 </div>

                 {/* AMOUNT STABILITY: 2x2 Professional Grid */}
                 <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[24px] hover:bg-white/[0.05] transition-all group">
                       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 group-hover:text-slate-400">Total Earned</p>
                       <p className="text-2xl font-black text-white tabular-nums">₨ {totals.earned.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/5 p-6 rounded-[24px] hover:bg-emerald-500/[0.06] transition-all group">
                       <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest mb-2 group-hover:text-emerald-400">Paid Against Work</p>
                       <p className="text-2xl font-black text-emerald-400 tabular-nums">₨ {totals.paid.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-500/[0.03] border border-red-500/5 p-6 rounded-[24px] hover:bg-red-500/[0.06] transition-all group">
                       <p className="text-[11px] font-bold text-red-400/60 uppercase tracking-widest mb-2 group-hover:text-red-400">Advance Given</p>
                       <p className="text-2xl font-black text-red-500 tabular-nums">₨ {totals.advance.toLocaleString()}</p>
                    </div>
                    <div className={`border p-6 rounded-[24px] transition-all group ${totals.balance < 0 ? 'bg-red-500/[0.03] border-red-500/10 hover:bg-red-500/[0.06]' : 'bg-emerald-500/[0.03] border-emerald-500/10 hover:bg-emerald-500/[0.06]'}`}>
                       <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${totals.balance < 0 ? 'text-red-400/60 group-hover:text-red-400' : 'text-emerald-400/60 group-hover:text-emerald-400'}`}>Net Balance</p>
                       <p className={`text-2xl font-black tabular-nums ${totals.balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {totals.balance < 0 ? `Advance: ₨ ${Math.abs(totals.balance).toLocaleString()}` : `Payable: ₨ ${Math.abs(totals.balance).toLocaleString()}`}
                       </p>
                    </div>
                 </div>
                 
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
            </div>

            {editingWorker && (
               <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
                  <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative border-t-8 border-[#811d1d] animate-in zoom-in-95 duration-200">
                     <button onClick={() => setEditingWorker(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><X className="w-6 h-6"/></button>
                     <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter mb-8 flex items-center gap-3"><Pencil className="w-5 h-5 text-[#C5A059]"/> Update Worker</h4>
                     <form onSubmit={handleUpdateWorker} className="space-y-4">
                        <div className="space-y-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Name</label>
                           <input required className={inputClass} value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4 active:scale-95 transition-all">Save Updates</button>
                     </form>
                  </div>
               </div>
            )}

            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 relative group">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#811d1d]"><Wallet className="w-5 h-5" /></div>
                     <div>
                        <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight text-center sm:text-left">Post Account Entry</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Work earnings or cash payouts</p>
                     </div>
                  </div>
               </div>

               <form onSubmit={handlePostTransaction} className="space-y-6">
                 {editingTx && (
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between animate-in slide-in-from-top-2">
                       <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><Pencil className="w-4 h-4 text-blue-500 animate-pulse"/> Editing Entry...</p>
                       <X className="w-6 h-6 text-blue-400 cursor-pointer" onClick={() => { setEditingTx(null); setTxAmount(''); setTxPaid(''); setTxDesc(''); }} />
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
                         <div className={`flex items-center ${inputClass} bg-slate-50 cursor-not-allowed select-none ${prevBal < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                             {prevBal < 0 ? `Advance: ₨ ${Math.abs(prevBal).toLocaleString()}` : `Payable: ₨ ${Math.abs(prevBal).toLocaleString()}`}
                         </div>
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Work Amount (₨)</label>
                         <input type="number" min="0" placeholder="0" className={inputClass} value={txAmount} onChange={e => setTxAmount(e.target.value)} />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 ml-1">Paid Today (₨)</label>
                         <input type="number" min="0" placeholder="0" className={inputClass} value={txPaid} onChange={e => setTxPaid(e.target.value)} />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 ml-1">New Balance</label>
                         <div className={`flex items-center ${inputClass} bg-slate-50 cursor-not-allowed select-none ${newBal < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                             {newBal < 0 ? `Advance: ₨ ${Math.abs(newBal).toLocaleString()}` : `Payable: ₨ ${Math.abs(newBal).toLocaleString()}`}
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
                  <h3 className="font-black text-slate-900 text-xs flex items-center gap-3 uppercase tracking-widest"><History className="w-4 h-4 text-[#C5A059]" /> Account History</h3>
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{ledgerData.length} Entries</span>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[800px]">
                   <thead>
                     <tr className="bg-slate-50/50">
                       <th className="pl-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Work Amount (+)</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Paid (-)</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Advance (-)</th>
                       <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Balance</th>
                       <th className="pr-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                     </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {txLoading ? (
                        <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#811d1d] mx-auto" /></td></tr>
                      ) : ledgerData.length === 0 ? (
                        <tr><td colSpan="6" className="py-24 text-center font-bold text-slate-300 uppercase text-[10px] tracking-widest">No History</td></tr>
                      ) : (
                        ledgerData.map(tx => (
                          <tr key={tx.id} className="group hover:bg-slate-50 transition-all">
                             <td className="pl-8 py-6 text-xs font-black text-slate-900">{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                             <td className="px-5 py-6 font-bold text-slate-600 text-[13px]">{tx.desc}</td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-emerald-600">
                                {Number(tx.earning) > 0 ? `₨ ${Number(tx.earning).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-blue-500">
                                {Number(tx.paid) > 0 ? `₨ ${Number(tx.paid).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs text-red-500">
                                {Number(tx.advance) > 0 ? `₨ ${Number(tx.advance).toLocaleString()}` : <span className="opacity-10">—</span>}
                             </td>
                             <td className="px-5 py-6 text-right font-black tabular-nums text-xs whitespace-nowrap bg-slate-50/20">
                                <span className={tx.balAfter < 0 ? 'text-red-600' : 'text-emerald-600'}>{tx.balAfter < 0 ? '-' : ''}₨ {Math.abs(tx.balAfter).toLocaleString()}</span>
                             </td>
                             <td className="pr-8 py-6 text-right">
                                <div className="flex items-center justify-center gap-2">
                                   <button onClick={() => startEditTx(tx)} className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-50 shadow-sm"><Pencil className="w-3.5 h-3.5"/></button>
                                   <button onClick={async () => {
                                       if (!confirm('Delete item?')) return;
                                       const ids = tx.isMerged ? [tx.pId, tx.rId] : [tx.id];
                                       for (const id of ids) await fetch(`${API}/api/workers/${selectedWorker.id}/transactions/${id}`, { method: 'DELETE' });
                                       fetchTransactions(selectedWorker.id); fetchWorkers(selectedWorker.id);
                                   }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-50 shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                             </td>
                          </tr>
                        ))
                      )}
                      {!txLoading && ledgerData.length > 0 && (
                        <tr className="bg-slate-900 text-white font-black border-t-2 border-[#C5A059]">
                           <td colSpan="2" className="pl-8 py-7 text-[10px] uppercase tracking-widest text-[#C5A059]">Total Statement Audit</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-emerald-400">₨ {totals.earned.toLocaleString()}</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-blue-400">₨ {totals.paid.toLocaleString()}</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-red-400">₨ {totals.advance.toLocaleString()}</td>
                           <td className="px-5 py-7 text-right tabular-nums text-sm text-[#C5A059]">
                               {totals.balance < 0 ? '-' : ''}₨ {Math.abs(totals.balance).toLocaleString()}
                           </td>
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

export default WorkerLedger;
