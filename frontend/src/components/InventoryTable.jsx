import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Box, Package, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { API } from '../lib/api';

function InventoryTable({ refreshTrigger }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchInventory = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/materials`)
      .then(res => res.json())
      .then(data => {
        setInventory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setInventory([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this item from inventory?')) return;
    setDeleting(id);
    try {
      await fetch(`${API}/api/materials/${id}`, { method: 'DELETE' });
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
    setDeleting(null);
  };

  return (
    <div className="bg-white rounded-[32px] shadow-[0_8px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden ring-1 ring-slate-900/5">
      <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Stock Management</h3>
          <p className="text-xs text-slate-400 font-medium">Real-time factory stock tracking</p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A059]/10 text-[#C5A059] rounded-xl hover:bg-[#C5A059]/20 transition-all text-xs font-bold border border-[#C5A059]/20"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="table-responsive">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              <th className="px-8 py-5">Material Item</th>
              <th className="px-8 py-5">Category</th>
              <th className="px-8 py-5">Available Stock</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Date Added</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium">Loading inventory...</p>
                  </div>
                </td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-8 py-20 text-center">
                  <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No materials in warehouse</p>
                  <p className="text-slate-300 text-xs mt-1">Use the form to add your first item</p>
                </td>
              </tr>
            ) : (
              inventory.map(item => {
                const isLowStock = item.qty < 10;
                const date = item.created_at ? new Date(item.created_at).toLocaleDateString('en-PK') : '—';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-all group cursor-default">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                          <Box className="w-5 h-5 text-[#C5A059]" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono tracking-tighter">SKU-00{item.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{item.category || 'General'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.qty} {item.unit}</span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full rounded-full ${isLowStock ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(item.qty, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase tracking-wide">
                          <AlertCircle className="w-3 h-3" /> Low Level
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
                          <ShieldCheck className="w-3 h-3" /> Secure
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs text-slate-400 font-medium">{date}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === item.id
                            ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400 italic">Showing {inventory.length} total inventory items</p>
        <button className="text-xs font-bold text-[#C5A059] flex items-center gap-1 hover:underline">
          Manage Warehouse Locations <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default InventoryTable;
