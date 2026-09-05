import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, X, Check, Loader2, Tag, Package,
  Search, ShoppingBag, Layers, AlertCircle
} from 'lucide-react';
import { API } from '../lib/api';

const UNIT_OPTIONS = ['Piece', 'Set', 'Sqft', 'Meter', 'Kg', 'Dozen', 'Foot', 'Yard'];
const CATEGORY_OPTIONS = ['General', 'Sofa & Seating', 'Bedroom', 'Dining', 'Office', 'Raw Material', 'Labour Work', 'Accessories'];

function ItemsCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add form state
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('Piece');
  const [newCategory, setNewCategory] = useState('General');
  const [newItemType, setNewItemType] = useState('BOTH');

  // Edit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editUnit, setEditUnit] = useState('Piece');
  const [editCategory, setEditCategory] = useState('General');
  const [editItemType, setEditItemType] = useState('BOTH');

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState(null);

  const inputClass =
    'w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#C5A059] outline-none transition-all';
  const selectClass =
    'w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#C5A059] outline-none transition-all cursor-pointer';

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/api/items`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (newPrice === '' || isNaN(Number(newPrice)) || Number(newPrice) < 0) {
      return setError('Please enter a valid price (0 or above)');
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), price: Number(newPrice), unit: newUnit, category: newCategory, item_type: newItemType })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Failed to add item');
      setNewName(''); setNewPrice(''); setNewUnit('Piece'); setNewCategory('General'); setNewItemType('BOTH');
      setShowForm(false);
      fetchItems();
    } catch (e) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditUnit(item.unit || 'Piece');
    setEditCategory(item.category || 'General');
    setEditItemType(item.item_type || 'BOTH');
    setError('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    if (editPrice === '' || isNaN(Number(editPrice)) || Number(editPrice) < 0) {
      return setError('Please enter a valid price');
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), price: Number(editPrice), unit: editUnit, category: editCategory, item_type: editItemType })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Failed to update item');
      setEditingItem(null);
      fetchItems();
    } catch (e) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await fetch(`${API}/api/items/${itemToDelete.id}`, { method: 'DELETE' });
      fetchItems();
      setItemToDelete(null);
    } catch (e) { console.error(e); }
  };

  // Group items by category after search filter
  const groupedItems = useMemo(() => {
    const filtered = items.filter(i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [items, searchQuery]);

  const totalItems = items.length;
  const categories = Object.keys(groupedItems);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-0 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center">
              <Tag className="w-5 h-5 text-[#C5A059]" />
            </div>
            Items Catalog
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 pl-1">
            {totalItems} items &middot; Price list for labour &amp; showroom
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="flex items-center gap-2 px-5 py-3 bg-[#0F172A] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-[#C5A059]" />
          Add New Item
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-600">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

      {/* ADD FORM */}
      {showForm && (
        <div className="bg-white rounded-[28px] p-6 md:p-8 border-2 border-[#C5A059]/20 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-6 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#C5A059]" /> New Item
          </h4>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Item Name *</label>
                <input
                  required
                  placeholder="e.g. Sofa Set, Polish Work..."
                  className={inputClass}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Price per Unit (Rs) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className={inputClass}
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unit</label>
                <select className={selectClass} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Available In</label>
                <div className="flex gap-2">
                  {[ {l:'Both', v:'BOTH'}, {l:'Labour Ledger Only', v:'LABOUR'}, {l:'Showroom Sales Only', v:'SHOWROOM'} ].map(t => (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => setNewItemType(t.v)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 ${newItemType === t.v
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newCategory === cat
                        ? 'bg-[#C5A059] text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-xs uppercase hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-8 py-3 bg-[#0F172A] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[#C5A059]" />}
                {saving ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH */}
      {totalItems > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items or categories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-[#C5A059] outline-none transition-all shadow-sm"
          />
        </div>
      )}

      {/* ITEMS LIST */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-white rounded-[32px] p-16 flex flex-col items-center justify-center text-center border border-slate-100 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest">No Items Yet</h3>
          <p className="text-sm text-slate-300 mt-2 max-w-xs">
            Add your first item — it will appear in Labour &amp; Showroom forms for quick price selection.
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
          <p className="text-slate-400 font-bold">No items match your search.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {categories.map(cat => (
            <div key={cat} className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
              {/* Category Header */}
              <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center gap-3">
                <Layers className="w-4 h-4 text-[#C5A059]" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{cat}</span>
                <span className="ml-auto px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400">
                  {groupedItems[cat].length} {groupedItems[cat].length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="text-left pl-8 pr-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                      <th className="text-left px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Available In</th>
                      <th className="text-center px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                      <th className="text-right px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                      <th className="text-right pr-8 pl-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedItems[cat].map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`transition-all hover:bg-slate-50/80 ${idx < groupedItems[cat].length - 1 ? 'border-b border-slate-50' : ''}`}
                      >
                        <td className="pl-8 pr-6 py-5 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 flex items-center justify-center shrink-0">
                              <Tag className="w-4 h-4 text-[#C5A059]" />
                            </div>
                            <span className="font-black text-slate-900 text-sm tracking-wide">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-middle">
                           {(!item.item_type || item.item_type === 'BOTH') && (
                              <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] bg-slate-100 text-slate-500">
                                Both
                              </span>
                           )}
                           {item.item_type === 'LABOUR' && (
                              <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] bg-orange-100 text-orange-600">
                                Labour Only
                              </span>
                           )}
                           {item.item_type === 'SHOWROOM' && (
                              <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] bg-indigo-100 text-indigo-600">
                                Showroom Only
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-5 text-center align-middle">
                          <span className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border border-slate-100">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right align-middle">
                          <span className="font-black text-slate-900 text-base">
                            Rs {Number(item.price).toLocaleString('en-PK')}
                          </span>
                        </td>
                        <td className="pr-8 pl-6 py-5 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 hover:border-blue-100"
                              title="Edit item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 hover:border-red-100"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl relative border-t-4 border-[#C5A059] animate-in zoom-in-95 duration-200">
            <button
              onClick={() => { setEditingItem(null); setError(''); }}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight mb-6 flex items-center gap-3">
              <Pencil className="w-5 h-5 text-[#C5A059]" /> Edit Item
            </h4>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Item Name *</label>
                <input required className={inputClass} value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Price (Rs) *</label>
                  <input required type="number" min="0" step="0.01" className={inputClass} value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unit</label>
                  <select className={selectClass} value={editUnit} onChange={e => setEditUnit(e.target.value)}>
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Available In</label>
                <div className="flex gap-2">
                  {[ {l:'Both', v:'BOTH'}, {l:'Labour Only', v:'LABOUR'}, {l:'Showroom Only', v:'SHOWROOM'} ].map(t => (
                    <button key={t.v} type="button" onClick={() => setEditItemType(t.v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-1 ${editItemType === t.v ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button key={cat} type="button" onClick={() => setEditCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${editCategory === cat ? 'bg-[#C5A059] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-2 active:scale-95 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-4 h-4 text-[#C5A059]" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative border-t-4 border-red-500 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="font-black text-slate-900 text-xl tracking-tight mb-2">Delete Item?</h4>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                Are you sure you want to delete <span className="font-black text-slate-900">{itemToDelete.name}</span>? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ItemsCatalog;
