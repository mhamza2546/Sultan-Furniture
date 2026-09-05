import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2, Plus, BookOpen, Wallet, History, Search, Trash2, Pencil,
  Check, X, Calendar, AlertCircle, TrendingDown, TrendingUp, ArrowDownCircle,
  ArrowUpCircle, FileText
} from 'lucide-react';
import { API } from '../lib/api';

/* ─────────────── REUSABLE DELETE MODAL ─────────────── */
function DeleteModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl border-t-4 border-red-500 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h4 className="font-black text-slate-900 text-xl tracking-tight mb-2">{title}</h4>
          <p className="text-sm font-medium text-slate-500 mb-8 px-4">{message}</p>
          <div className="flex items-center gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/30">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Roznamcha() {
  /* ─── State ─── */
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New account form
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit account
  const [editingAccount, setEditingAccount] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Transaction form
  const [txType, setTxType] = useState('EXPENSE');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txSaving, setTxSaving] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Delete modals
  const [deleteAccountModal, setDeleteAccountModal] = useState(null);
  const [deleteTxModal, setDeleteTxModal] = useState(null);

  /* ─── Fetch ─── */
  const fetchAccounts = async (autoSelectId = null) => {
    try {
      const res = await fetch(`${API}/api/roznamcha/accounts`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setAccounts(arr);
      if (autoSelectId) {
        const found = arr.find(a => a.id === autoSelectId);
        if (found) selectAccount(found);
      } else if (selectedAccount) {
        const updated = arr.find(a => a.id === selectedAccount.id);
        if (updated) setSelectedAccount(updated);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async (accountId) => {
    if (!accountId) return;
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/api/roznamcha/accounts/${accountId}/transactions`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setTxLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const selectAccount = (acc) => {
    setSelectedAccount(acc);
    fetchTransactions(acc.id);
    resetTxForm();
  };

  /* ─── Computed ─── */
  const totals = useMemo(() => {
    const totalExpense = transactions.reduce((s, t) => s + Number(t.amount), 0);
    return { totalExpense, net: totalExpense };
  }, [transactions]);

  const filteredAccounts = useMemo(() =>
    accounts.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [accounts, searchQuery]
  );

  /* ─── Account CRUD ─── */
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/roznamcha/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setNewName(''); setNewDesc(''); setShowNewAccount(false);
        fetchAccounts(data.id);
      }
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/roznamcha/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() })
      });
      if (res.ok) { setEditingAccount(null); fetchAccounts(); }
    } catch (e) { console.error(e); }
  };

  const confirmDeleteAccount = async () => {
    try {
      await fetch(`${API}/api/roznamcha/accounts/${deleteAccountModal.id}`, { method: 'DELETE' });
      if (selectedAccount?.id === deleteAccountModal.id) { setSelectedAccount(null); setTransactions([]); }
      setDeleteAccountModal(null);
      fetchAccounts();
    } catch (e) { console.error(e); }
  };

  /* ─── Transaction CRUD ─── */
  const resetTxForm = () => {
    setTxAmount(''); setTxDesc('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setEditingTx(null);
  };

  const handlePostTransaction = async (e) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0 || !selectedAccount) return;
    setTxSaving(true);
    try {
      const url = editingTx
        ? `${API}/api/roznamcha/accounts/${selectedAccount.id}/transactions/${editingTx.id}`
        : `${API}/api/roznamcha/accounts/${selectedAccount.id}/transactions`;
      const method = editingTx ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'EXPENSE', amount: Number(txAmount), description: txDesc, tx_date: txDate })
      });
      resetTxForm();
      fetchTransactions(selectedAccount.id);
    } catch (e) { console.error(e); }
    finally { setTxSaving(false); }
  };

  const startEditTx = (tx) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAmount(String(tx.amount));
    setTxDesc(tx.description || '');
    setTxDate(tx.tx_date ? tx.tx_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const confirmDeleteTx = async () => {
    try {
      await fetch(`${API}/api/roznamcha/accounts/${selectedAccount.id}/transactions/${deleteTxModal.id}`, { method: 'DELETE' });
      setDeleteTxModal(null);
      fetchTransactions(selectedAccount.id);
    } catch (e) { console.error(e); }
  };

  const inputClass = "w-full h-12 md:h-14 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#C5A059] outline-none transition-all";

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-0 min-h-screen font-inter">

      {/* ─── SIDEBAR ─── */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-4">
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C5A059]" /> Roznamcha
            </h2>
            <button
              onClick={() => setShowNewAccount(!showNewAccount)}
              className="p-2 bg-[#C5A059] text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* New Account Form */}
          {showNewAccount && (
            <form onSubmit={handleCreateAccount} className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <input
                required autoFocus
                placeholder="Account / Category name..."
                className={inputClass}
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <input
                placeholder="Short description (optional)"
                className={inputClass}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={creating}
                  className="flex-1 h-11 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[#C5A059]" />}
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowNewAccount(false)}
                  className="h-11 w-11 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Search */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
            <Search className="w-4 h-4 text-slate-300 shrink-0" />
            <input
              placeholder="Search accounts..."
              className="bg-transparent text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Accounts List */}
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" /></div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No accounts yet</p>
              </div>
            ) : filteredAccounts.map(acc => (
              <div
                key={acc.id}
                onClick={() => selectAccount(acc)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all group ${
                  selectedAccount?.id === acc.id
                    ? 'bg-slate-900 border-slate-800 shadow-lg'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedAccount?.id === acc.id ? 'bg-[#C5A059]/20' : 'bg-white'
                }`}>
                  <FileText className={`w-4 h-4 ${selectedAccount?.id === acc.id ? 'text-[#C5A059]' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-black text-sm truncate ${selectedAccount?.id === acc.id ? 'text-white' : 'text-slate-900'}`}>
                    {acc.name}
                  </p>
                  {acc.description && (
                    <p className={`text-[10px] font-bold truncate mt-0.5 ${selectedAccount?.id === acc.id ? 'text-slate-400' : 'text-slate-400'}`}>
                      {acc.description}
                    </p>
                  )}
                </div>
                {selectedAccount?.id === acc.id && (
                  <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditingAccount(acc); setEditName(acc.name); setEditDesc(acc.description || ''); }}
                      className="w-8 h-8 bg-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteAccountModal(acc)}
                      className="w-8 h-8 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN AREA ─── */}
      <div className="flex-1 space-y-6 min-w-0">
        {!selectedAccount ? (
          <div className="bg-white rounded-[32px] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 h-full min-h-[500px]">
            <BookOpen className="w-16 h-16 text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">Open Roznamcha</h3>
            <p className="text-slate-300 mt-2 text-sm max-w-[280px]">
              Select an account to view and manage daily expenses. Create your first account using the <strong>+</strong> button.
            </p>
          </div>
        ) : (
          <>
            {/* Edit Account Modal */}
            {editingAccount && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border-t-4 border-[#C5A059] animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-3">
                      <Pencil className="w-5 h-5 text-[#C5A059]" /> Edit Account
                    </h4>
                    <button onClick={() => setEditingAccount(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateAccount} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Name *</label>
                      <input required className={inputClass} value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                      <input className={inputClass} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 h-12 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                        <Check className="w-4 h-4 text-[#C5A059]" /> Save Changes
                      </button>
                      <button type="button" onClick={() => setEditingAccount(null)} className="h-12 px-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Account Header & Stats (PREMIUM DARK THEME) */}
            <div className="bg-[#0b121e] rounded-[32px] p-8 md:p-10 shadow-2xl relative border border-white/5 overflow-hidden">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter truncate max-w-[200px] sm:max-w-none">{selectedAccount.name}</h2>
                          <div className="flex items-center gap-2">
                             <button onClick={() => { setEditingAccount(selectedAccount); setEditName(selectedAccount.name); setEditDesc(selectedAccount.description || ''); }} className="p-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"><Pencil className="w-4 h-4"/></button>
                             <button onClick={() => setDeleteAccountModal(selectedAccount)} className="p-2.5 bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#C5A059]">
                          <span className="bg-[#C5A059]/10 px-3 py-1 rounded-md flex items-center gap-2"><BookOpen className="w-3.5 h-3.5"/> Roznamcha Account</span>
                          {selectedAccount.description && <span className="text-slate-500">· {selectedAccount.description}</span>}
                       </div>
                    </div>
                 </div>

                 {/* AMOUNT STABILITY: Professional Grid */}
                 <div className="grid grid-cols-1 gap-4 relative z-10 max-w-sm">
                    <div className="bg-red-500/[0.03] border border-red-500/5 p-6 rounded-[24px] transition-all group">
                       <p className="text-[11px] font-bold text-red-400/60 uppercase tracking-widest mb-2 group-hover:text-red-400">Total Kharcha / Expense</p>
                       <p className="text-2xl font-black text-red-500 tabular-nums">₨ {totals.totalExpense.toLocaleString()}</p>
                    </div>
                 </div>
                 
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
            </div>

            {/* Transaction Form */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-8">
              <h3 className="font-black text-slate-900 text-xs flex items-center gap-3 uppercase tracking-widest mb-6">
                <Plus className="w-4 h-4 text-[#C5A059]" />
                {editingTx ? 'Edit Entry' : 'New Entry'}
                {editingTx && (
                  <button onClick={resetTxForm} className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-700 normal-case tracking-normal font-bold transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel Edit
                  </button>
                )}
              </h3>

              <form onSubmit={handlePostTransaction}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount (₨) *</label>
                    <input
                      required type="number" min="0.01" step="0.01" placeholder="0"
                      className={inputClass} value={txAmount} onChange={e => setTxAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Date *</label>
                    <input required type="date" className={inputClass} value={txDate} onChange={e => setTxDate(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description / Detail</label>
                    <input
                      placeholder="e.g. Electricity bill, Petrol kharcha..."
                      className={inputClass} value={txDesc} onChange={e => setTxDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={txSaving}
                    className="w-full md:w-[240px] h-14 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    {txSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 text-[#C5A059]" />}
                    {txSaving ? 'Saving...' : editingTx ? 'Update Entry' : 'Post Entry'}
                  </button>
                </div>
              </form>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 md:px-8 py-5 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-xs flex items-center gap-3 uppercase tracking-widest">
                  <History className="w-4 h-4 text-[#C5A059]" /> Transaction History
                </h3>
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {transactions.length} Entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed" style={{ minWidth: '600px' }}>
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th style={{ width: '140px' }} className="pl-8 pr-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th style={{ width: 'auto' }} className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                      <th style={{ width: '180px' }} className="px-4 py-5">
                        <div className="flex justify-end text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</div>
                      </th>
                      <th style={{ width: '120px' }} className="pr-8 pl-4 py-5">
                        <div className="flex justify-end text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {txLoading ? (
                      <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#C5A059] mx-auto" /></td></tr>
                    ) : transactions.length === 0 ? (
                      <tr><td colSpan="4" className="py-24 text-center font-bold text-slate-300 uppercase text-[10px] tracking-widest">No Entries Yet</td></tr>
                    ) : transactions.map(tx => (
                      <tr key={tx.id} className="group hover:bg-slate-50/70 transition-all">
                        <td className="pl-8 pr-4 py-5 text-xs font-black text-slate-900 whitespace-nowrap align-middle">
                          {new Date(tx.tx_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-5 font-bold text-slate-600 text-sm align-middle break-words">
                          {tx.description || <span className="text-slate-300 italic">—</span>}
                        </td>
                        <td className="px-4 py-5 align-middle">
                          <div className="flex justify-end font-black tabular-nums text-sm text-red-600 whitespace-nowrap">
                            ₨ {Number(tx.amount).toLocaleString()}
                          </div>
                        </td>
                        <td className="pr-8 pl-4 py-5 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEditTx(tx)}
                              className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 hover:border-blue-100">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteTxModal(tx)}
                              className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 hover:border-red-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Totals Row */}
                    {!txLoading && transactions.length > 0 && (
                      <tr className="bg-slate-900 text-white font-black border-t-2 border-[#C5A059]">
                        <td colSpan="2" className="pl-8 py-6 text-[10px] uppercase tracking-widest text-[#C5A059]">Account Summary</td>
                        <td className="px-4 py-6 align-middle">
                          <div className="flex justify-end tabular-nums text-sm whitespace-nowrap text-red-400">
                            ₨ {totals.totalExpense.toLocaleString()}
                          </div>
                        </td>
                        <td className="pr-8 pl-4 py-6"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── DELETE MODALS ─── */}
      {deleteAccountModal && (
        <DeleteModal
          title="Delete Account?"
          message={`Are you sure you want to delete "${deleteAccountModal.name}"? All transactions in this account will be permanently removed.`}
          onConfirm={confirmDeleteAccount}
          onCancel={() => setDeleteAccountModal(null)}
        />
      )}
      {deleteTxModal && (
        <DeleteModal
          title="Delete Entry?"
          message={`Are you sure you want to delete this entry of ₨ ${Number(deleteTxModal.amount).toLocaleString()}? This cannot be undone.`}
          onConfirm={confirmDeleteTx}
          onCancel={() => setDeleteTxModal(null)}
        />
      )}

      <style>{`
        .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
