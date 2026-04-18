import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, Users, Wallet, History, Search, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import { API } from '../lib/api';

function WorkerLedger() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Worker Form
  const [showNewWorker, setShowNewWorker] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('');

  // Transaction Form
  const [txType, setTxType] = useState('EARNING');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txSaving, setTxSaving] = useState(false);

  const fetchWorkers = async () => {
    try {
      const res = await fetch(`${API}/api/workers`);
      const data = await res.json();
      setWorkers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (workerId) => {
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/api/workers/${workerId}/transactions`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return alert('Name required');
    try {
      const res = await fetch(`${API}/api/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkerName, jobRole: newWorkerRole })
      });
      if (res.ok) {
        setNewWorkerName('');
        setNewWorkerRole('');
        setShowNewWorker(false);
        fetchWorkers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txAmount || isNaN(txAmount) || Number(txAmount) <= 0) return alert('Enter valid amount');
    if (!txDesc.trim()) return alert('Enter description');
    if (!selectedWorker) return;

    setTxSaving(true);
    try {
      const res = await fetch(`${API}/api/workers/${selectedWorker.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: txType, amount: Number(txAmount), description: txDesc })
      });
      if (res.ok) {
        setTxAmount('');
        setTxDesc('');
        fetchTransactions(selectedWorker.id);
        fetchWorkers();
        const workerUpdate = workers.find(w => w.id === selectedWorker.id);
        if (workerUpdate) {
            const amt = Number(txAmount);
            setSelectedWorker({
                ...workerUpdate,
                balance: txType === 'EARNING' 
                    ? Number(workerUpdate.balance) + amt 
                    : Number(workerUpdate.balance) - amt
            });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTxSaving(false);
    }
  };

  const selectWorker = (worker) => {
    setSelectedWorker(worker);
    fetchTransactions(worker.id);
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (w.job_role && w.job_role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ledgerData = useMemo(() => {
    if (!selectedWorker || !transactions.length) return [];
    const ascending = [...transactions].reverse();
    let currentBalance = 0;
    
    const computed = ascending.map(tx => {
       if (tx.type === 'EARNING') currentBalance += Number(tx.amount);
       if (tx.type === 'PAYMENT') currentBalance -= Number(tx.amount);
       return { ...tx, runningBalance: currentBalance };
    });
    
    return computed.reverse();
  }, [transactions, selectedWorker]);

  const workerTotals = useMemo(() => {
    let totalEarned = 0;
    let totalPaid = 0;
    transactions.forEach(tx => {
      if (tx.type === 'EARNING') totalEarned += Number(tx.amount);
      if (tx.type === 'PAYMENT') totalPaid += Number(tx.amount);
    });
    return { totalEarned, totalPaid };
  }, [transactions]);

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#C5A059] focus:bg-white focus:ring-2 focus:ring-[#C5A059]/20 outline-none transition-all";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
      
      {/* ===== LEFT DIRECTORY ===== */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Search & Actions Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workforce</h2>
            <button
              onClick={() => setShowNewWorker(!showNewWorker)}
              className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-semibold flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" /> Add New
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search workers..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
            />
          </div>
        </div>

        {showNewWorker && (
          <form onSubmit={handleCreateWorker} className="bg-white rounded-3xl p-6 shadow-sm border border-[#C5A059] ring-4 ring-[#C5A059]/5">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C5A059]" /> Create Profile
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                <input placeholder="e.g. Ahmad Ali" value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} className={inputClass} />
              </div>
              <div>
                 <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Specialty / Role</label>
                 <input placeholder="e.g. Master Carver" value={newWorkerRole} onChange={e => setNewWorkerRole(e.target.value)} className={inputClass} />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-[#C5A059] text-white rounded-xl font-bold text-sm hover:bg-[#8E6F3E] transition-colors shadow-lg shadow-[#C5A059]/20">
                  Save Details
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Workers List */}
        <div className="flex flex-col gap-3">
          {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" /></div>
          ) : filteredWorkers.length === 0 ? (
             <div className="text-center py-10 text-slate-500 text-sm font-medium bg-white rounded-3xl border border-slate-200 border-dashed">No workers found.</div>
          ) : (
            filteredWorkers.map(w => {
              const active = selectedWorker?.id === w.id;
              const bal = Number(w.balance);
              return (
                <button 
                  key={w.id} 
                  onClick={() => selectWorker(w)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex justify-between items-center ${
                    active 
                      ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-sm ring-1 ring-[#C5A059]' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-[#C5A059] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{w.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{w.job_role}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Balance</p>
                    <p className={`font-bold whitespace-nowrap ${bal < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {bal < 0 ? '-' : ''}Rs. {Math.abs(bal).toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ===== RIGHT LEDGER ====== */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {!selectedWorker ? (
           <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border border-slate-200 border-dashed py-32">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <FileText className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Worker Profile</h3>
             <p className="text-sm text-slate-500">Choose a worker from the lateral menu to view their complete statement.</p>
           </div>
        ) : (
          <>
            {/* Summary Header Card */}
            <div className="bg-[#0F172A] rounded-3xl p-6 md:p-8 flex flex-col xl:flex-row items-center justify-between text-white shadow-xl shadow-slate-900/10 gap-6">
               <div className="flex items-center gap-5 w-full xl:w-auto">
                 <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                   <Users className="w-8 h-8 text-[#C5A059]" />
                 </div>
                 <div>
                   <h2 className="text-3xl font-black tracking-tight text-white">{selectedWorker.name}</h2>
                   <p className="text-slate-400 font-medium text-sm mt-1">{selectedWorker.job_role} Account</p>
                 </div>
               </div>

               <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-3 gap-6 xl:gap-8 border-t xl:border-t-0 xl:border-l border-white/10 pt-6 xl:pt-0 xl:pl-8">
                 <div className="text-left">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><TrendingUp className="w-3 h-3"/> Total Earned</p>
                   <p className="text-xl md:text-2xl font-black tracking-tight text-emerald-400">Rs. {workerTotals.totalEarned.toLocaleString()}</p>
                 </div>
                 <div className="text-left">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ArrowRight className="w-3 h-3"/> Total Paid</p>
                   <p className="text-xl md:text-2xl font-black tracking-tight text-red-400">Rs. {workerTotals.totalPaid.toLocaleString()}</p>
                 </div>
                 <div className="text-left col-span-2 md:col-span-1 bg-white/5 p-3 rounded-xl border border-white/10">
                   <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1">Remaining Balance</p>
                   <p className={`text-2xl md:text-3xl font-black tracking-tighter ${Number(selectedWorker.balance) < 0 ? 'text-red-400' : 'text-[#C5A059]'}`}>
                      {Number(selectedWorker.balance) < 0 ? '-' : ''}Rs. {Math.abs(Number(selectedWorker.balance)).toLocaleString()}
                   </p>
                 </div>
               </div>
            </div>

            {/* Quick Record Form */}
            <form onSubmit={handleAddTransaction} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
               <div className="flex flex-wrap items-center justify-between mb-5 gap-4">
                 <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                   <Wallet className="w-4 h-4 text-[#C5A059]" /> Add Transaction
                 </h4>
                 {/* Explicit Toggle for Work vs Payment */}
                 <div className="flex flex-wrap sm:flex-nowrap bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                   <button 
                      type="button" 
                      onClick={() => setTxType('EARNING')} 
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 flex-1 ${txType === 'EARNING' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      🔨 Add Work
                   </button>
                   <button 
                      type="button" 
                      onClick={() => setTxType('PAYMENT')} 
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 flex-1 ${txType === 'PAYMENT' ? 'bg-white shadow-sm text-red-500' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      💸 Owner Paid
                   </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                 
                 <div className="md:col-span-7">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      {txType === 'EARNING' ? 'Description of Work' : 'Payment Details'}
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder={txType === 'EARNING' ? "e.g. Completed 5x Sofa Sets" : "e.g. Given 5000 Cash Advance"}
                      className={`${inputClass} !py-2.5`}
                      value={txDesc}
                      onChange={e => setTxDesc(e.target.value)}
                    />
                 </div>
                 
                 <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      placeholder="Rs."
                      className={`${inputClass} !py-2.5`}
                      value={txAmount}
                      onChange={e => setTxAmount(e.target.value)}
                    />
                 </div>
                 
                 <div className="md:col-span-2 flex items-end">
                   <button 
                     type="submit" 
                     disabled={txSaving}
                     className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all focus:ring-4 outline-none flex items-center justify-center gap-2 shrink-0
                       ${txType === 'EARNING' 
                          ? 'bg-slate-900 text-white hover:bg-slate-800' 
                          : 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50'}
                     `}
                   >
                     {txSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record'}
                   </button>
                 </div>

               </div>
            </form>

            {/* Official Ledger Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
               <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
                 <h3 className="font-bold text-slate-900 flex items-center gap-2">
                   <History className="w-4 h-4 text-[#C5A059]" /> Account Statement
                 </h3>
               </div>
               
               <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse min-w-[700px]">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-200">
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Date</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Debit (Payment)</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Credit (Work)</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Balance</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {txLoading ? (
                        <tr><td colSpan="5" className="px-6 py-12 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-[#C5A059] mx-auto" />
                        </td></tr>
                     ) : ledgerData.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                          <p className="font-medium">No ledger records found.</p>
                          <p className="text-xs mt-1">Start by recording a transaction above.</p>
                        </td></tr>
                     ) : (
                        ledgerData.map((tx) => {
                          const isEarning = tx.type === 'EARNING';
                          const bal = Number(tx.runningBalance);

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="text-[13px] font-bold text-slate-800">
                                  {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </td>
                              
                              <td className="px-6 py-4 min-w-[200px]">
                                <p className="text-[14px] font-semibold text-slate-900">{tx.description}</p>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                  {isEarning ? 'Production Output' : 'Cash Disbursement'}
                                </p>
                              </td>
                              
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                {!isEarning ? (
                                  <span className="text-[14px] font-bold text-red-500">
                                    {(Number(tx.amount)).toLocaleString()}
                                  </span>
                                ) : <span className="text-slate-300">-</span>}
                              </td>

                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                {isEarning ? (
                                  <span className="text-[14px] font-bold text-emerald-600">
                                    {(Number(tx.amount)).toLocaleString()}
                                  </span>
                                ) : <span className="text-slate-300">-</span>}
                              </td>

                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <span className={`text-[15px] font-black tracking-tight ${bal < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                  {bal < 0 ? '-' : ''}{(Math.abs(bal)).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WorkerLedger;
