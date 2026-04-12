import React, { useState, useEffect } from 'react';
import { Lock, Unlock, FileText, Plus, Trash2, Loader2, AlertCircle, Calendar, Search } from 'lucide-react';
import { API } from '../lib/api';

function PrivateVault() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [content, setContent] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterMode, setFilterMode] = useState('month');

  const totalVaultExpenses = notes.reduce((sum, n) => sum + Number(n.amount || 0), 0);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');
    try {
      const res = await fetch(`${API}/api/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setUnlocked(true);
        fetchNotes();
      } else {
        setAuthError('Incorrect Security PIN/Password');
      }
    } catch (err) {
      setAuthError('Connection failed.');
    }
    setLoadingAuth(false);
  };

  const fetchNotes = async () => {
    setLoadingNotes(true);
    if (filterMode === 'day' && !date) { setLoadingNotes(false); return; }
    if (filterMode === 'month' && !month) { setLoadingNotes(false); return; }
    try {
      const url = filterMode === 'month' 
        ? `${API}/api/vault?month=${month}`
        : `${API}/api/vault?date=${date}`;
      const res = await fetch(url);
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch(err) { console.error(err); }
    setLoadingNotes(false);
  };

  useEffect(() => {
    if (unlocked) {
      fetchNotes();
    }
  }, [filterMode, unlocked]);

  const saveNote = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, amount: Number(amount) || 0 })
      });
      setTitle('');
      setAmount('');
      setContent('');
      setShowForm(false);
      fetchNotes();
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const deleteNote = async (id) => {
    try {
      await fetch(`${API}/api/vault/${id}`, { method: 'DELETE' });
      fetchNotes();
    } catch(e) { console.error(e); }
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-900/5 max-w-sm w-full border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500"></div>
          
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 text-center tracking-tight mb-2">Private Data Vault</h2>
          <p className="text-slate-500 text-xs text-center mb-8 px-4 leading-relaxed">
            This area is strictly restricted. Enter owner credentials to access private notes and confidential records.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input 
                type="password" 
                placeholder="Enter System Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono tracking-widest text-slate-800 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-xs font-bold text-center flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3"/> {authError}</p>}
            <button 
              type="submit" 
              disabled={loadingAuth}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loadingAuth ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
              Unlock Vault
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#000B1A] p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col gap-1">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Lock className="w-6 h-6 text-red-500" /> Private Ledger
          </h1>
          <p className="text-slate-400 text-sm">Owner's confidential expenses and notes.</p>
          {notes.length > 0 && (
            <div className="mt-2 text-red-400 font-bold bg-white/5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 w-fit text-sm">
              Vault Total: Rs. {totalVaultExpenses.toLocaleString()}
            </div>
          )}
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 text-sm"
        >
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4"/> New Note</>}
        </button>
      </div>

      {/* Date Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3">
          <Calendar className="w-5 h-5 text-red-500 shrink-0" />
          {filterMode === 'day' ? (
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold text-sm outline-none w-full"
            />
          ) : (
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold text-sm outline-none w-full"
            />
          )}
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1 border border-slate-200">
          <button
            onClick={() => setFilterMode('day')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setFilterMode('month')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Monthly
          </button>
        </div>
        <button
          onClick={fetchNotes}
          disabled={loadingNotes}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all active:scale-[0.98] text-sm shadow-lg shadow-red-500/20 disabled:opacity-70 min-w-[160px]"
        >
          {loadingNotes
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
            : <><Search className="w-4 h-4" /> Fetch Records</>
          }
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveNote} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Category or Person (Kahan kharcha hua?)</label>
              <input 
                type="text" required placeholder="e.g. VIP guest protocol"
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Amount (Rs.)</label>
              <input 
                type="number" required placeholder="0.00" min="0" step="any"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Confidential Content</label>
            <textarea 
              required placeholder="Enter private details here..." rows={4}
              value={content} onChange={e => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 resize-none leading-relaxed"
            ></textarea>
          </div>
          <button 
            type="submit" disabled={saving}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Secure Save
          </button>
        </form>
      )}

      {loadingNotes ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-400">Vault is empty</p>
          <p className="text-xs text-slate-400 mt-1">Add your first confidential note above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map(n => (
            <div key={n.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-md transition-all relative">
              <button 
                onClick={() => deleteNote(n.id)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                title="Delete Note permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex justify-between items-start mb-2 pr-10">
                <h3 className="font-bold text-slate-900 truncate">{n.title}</h3>
                <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-lg text-sm shrink-0">
                  Rs. {Number(n.amount || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap leading-relaxed">{n.content}</p>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pt-4 border-t border-slate-50">
                Secured: {new Date(n.created_at).toLocaleDateString('en-PK')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PrivateVault;
