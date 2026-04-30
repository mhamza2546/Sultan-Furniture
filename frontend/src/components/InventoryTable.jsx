import React, { useState, useEffect } from 'react';
import { Loader2, Search, Package, Plus, Pencil, Trash2, Tag, Layers, ArrowUpRight, History, MoreVertical, X, Check, Boxes, ShoppingCart } from 'lucide-react';
import { API } from '../lib/api';

const InventoryTable = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('sqft');
    const [minStock, setMinStock] = useState('10');
    const [saving, setSaving] = useState(false);

    const fetchMaterials = async () => {
        try {
            const res = await fetch(`${API}/api/materials`);
            const data = await res.json();
            setMaterials(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMaterials(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API}/api/materials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category, unit, min_stock: minStock })
            });
            if (res.ok) {
                setName(''); setCategory(''); setShowAddModal(false);
                fetchMaterials();
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this material and its history?')) return;
        try {
            const res = await fetch(`${API}/api/materials/${id}`, { method: 'DELETE' });
            if (res.ok) fetchMaterials();
        } catch (e) { console.error(e); }
    };

    const filtered = materials.filter(m => 
        (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (m.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const inputClass = "w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-[#C5A059] focus:bg-white outline-none transition-all";

    return (
        <div className="space-y-6">
            
            {/* TOP HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <Boxes className="w-8 h-8 text-[#C5A059]"/> Inventory Hub
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Raw Materials & Stock Tracking</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C5A059] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search materials..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-14 pl-12 pr-4 w-full sm:w-[280px] bg-white border border-slate-200 rounded-[20px] text-xs font-black outline-none shadow-sm focus:border-[#C5A059] transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="h-14 px-8 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Plus className="w-5 h-5 text-[#C5A059]"/> Register New
                    </button>
                </div>
            </div>

            {/* STAT CARDS (Fluid Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><Package className="w-5 h-5"/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total SKU</p>
                        <p className="text-xl font-black text-slate-900">{materials.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><ArrowUpRight className="w-5 h-5"/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock</p>
                        <p className="text-xl font-black text-red-500">{materials.filter(m => (m.stock || 0) < (m.min_stock || 10)).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><ShoppingCart className="w-5 h-5"/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Stock</p>
                        <p className="text-xl font-black text-emerald-600">{materials.filter(m => (m.stock || 0) > 0).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500"><Tag className="w-5 h-5"/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categories</p>
                        <p className="text-xl font-black text-slate-900">{new Set(materials.map(m => m.category)).size}</p>
                    </div>
                </div>
            </div>

            {/* SMART INVENTORY DATA TABLE */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="pl-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material Name</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Stock</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Minimum</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="pr-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#C5A059] mx-auto"/></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="py-24 text-center font-bold text-slate-300 uppercase text-[10px]">No materials registered yet</td></tr>
                            ) : filtered.map(m => {
                                const isLowStock = (m.stock || 0) <= (m.min_stock || 10);
                                return (
                                    <tr key={m.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                                        <td className="pl-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-all"><Package className="w-4 h-4"/></div>
                                                <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{m.category || 'General'}</span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className={`font-black text-sm tabular-nums ${isLowStock ? 'text-red-500' : 'text-slate-900'}`}>
                                                {Number(m.stock || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-400 ml-1">{m.unit}</span>
                                            </p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-[11px] font-bold text-slate-400 tabular-nums">{Number(m.min_stock || 10).toLocaleString()} {m.unit}</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            {isLowStock ? (
                                                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Refill Needed</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Healthy</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="pr-10 py-6 text-right opacity-0 group-hover:opacity-100 transition-all">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleDelete(m.id)} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REGISTER MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 sm:p-0">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative border-4 border-slate-50 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X className="w-6 h-6"/></button>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center text-[#C5A059]"><Plus className="w-6 h-6"/></div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Material</h3>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Material Name</label>
                                <input required placeholder="e.g. Sheesham Wood" className={inputClass} value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                    <input required placeholder="Category" className={inputClass} value={category} onChange={e => setCategory(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unit</label>
                                    <select className={inputClass} value={unit} onChange={e => setUnit(e.target.value)}>
                                        <option value="sqft">Sq. Ft</option>
                                        <option value="feet">Running Feet</option>
                                        <option value="kg">Kilograms</option>
                                        <option value="piece">Pieces</option>
                                        <option value="set">Sets</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-red-500 uppercase tracking-widest mb-2 ml-1">Min Stock Warning Level</label>
                                <input type="number" required className={inputClass} value={minStock} onChange={e => setMinStock(e.target.value)} />
                            </div>
                            <button type="submit" disabled={saving} className="w-full h-14 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 pt-1">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Check className="w-5 h-5 text-[#C5A059]"/>}
                                {saving ? 'Registering...' : 'Complete Registration'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTable;
