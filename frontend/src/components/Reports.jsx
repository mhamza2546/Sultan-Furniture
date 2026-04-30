import React, { useState, useEffect } from 'react';
import {
  Calendar, Search, Package, Users, TrendingUp, ShoppingCart,
  ArrowUp, ArrowDown, Loader2, AlertCircle, ClipboardList, Briefcase
} from 'lucide-react';
import { API } from '../lib/api';

function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [mode, setMode] = useState('day'); // 'day' | 'month'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    if (mode === 'day' && !date) return;
    if (mode === 'month' && !month) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const url = mode === 'month'
        ? `${API}/api/reports/month?month=${month}`
        : `${API}/api/reports?date=${date}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) { setError(json.error); }
      else { setData(json); }
    } catch (err) {
      setError('Failed to connect to the server. Please try again later.');
    }
    setLoading(false);
  };

  // Auto-fetch on component load with today's date
  useEffect(() => { fetchReport(); }, []);

  const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className={`${bg} rounded-3xl p-6 border border-white/50`}>
      <div className={`w-12 h-12 rounded-2xl ${color} bg-white/60 flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">History & Reports</h1>
        <p className="text-slate-500 mt-1">Comprehensive historical records — accessible in one click</p>
      </div>

      {/* Date Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3">
          <Calendar className="w-5 h-5 text-[#C5A059] shrink-0" />
          {mode === 'day' ? (
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
            onClick={() => setMode('day')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setMode('month')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Monthly
          </button>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-[0.98] text-sm shadow-lg shadow-slate-900/10 disabled:opacity-70 min-w-[160px]"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
            : <><Search className="w-4 h-4" /> Get Report</>
          }
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-8">
          {/* Date Heading */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100"></div>
            <span className="text-sm font-bold text-slate-400 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
              {mode === 'month'
                ? `🗓️ ${new Date((month || today.slice(0, 7)) + '-01T00:00:00').toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })}`
                : `📅 ${new Date(date + 'T00:00:00').toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
              }
            </span>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ArrowUp} label="Material IN" value={`${data.summary.totalMaterialIn} units`} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard icon={ArrowDown} label="Material OUT" value={`${data.summary.totalMaterialOut} units`} color="text-red-500" bg="bg-red-50" />
            <StatCard icon={Users} label="Labour Paid" value={`Rs. ${Number(data.summary.totalLabourPaid).toLocaleString()}`} color="text-[#C5A059]" bg="bg-amber-50" />
            <StatCard icon={ShoppingCart} label="Sales" value={`Rs. ${Number(data.summary.totalSales).toLocaleString()}`} color="text-blue-600" bg="bg-blue-50" />
          </div>



          {/* Inventory Logs */}
          <Section title="Inventory Movements" icon={Package} count={data.inventoryLogs.length}>
            {data.inventoryLogs.length === 0
              ? <Empty text="No inventory movement recorded for this date" />
              : <div className="table-responsive"><table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 text-left pl-4">Date / Time</th>
                    <th className="pb-3 text-left px-4">Material</th>
                    <th className="pb-3 text-left px-4">Reason</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Stock In (+)</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Stock Out (-)</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.inventoryLogs.map((l, i) => {
                      const qty = Number(l.qty) || 0;
                      const isIn = String(l.type).toUpperCase() === 'IN';
                      return (
                        <tr key={l.id || i} className="hover:bg-slate-50">
                          <td className="py-4 pl-4 whitespace-nowrap">
                            <p className="text-xs font-black text-slate-900">{new Date(l.created_at).toLocaleDateString('en-GB')}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800">{l.material_name}</td>
                          <td className="py-4 px-4 text-slate-500 text-xs italic">{l.reason || '—'}</td>
                          <td className="py-4 px-4 text-right font-black tabular-nums text-emerald-600 whitespace-nowrap">
                            {isIn ? `${qty.toLocaleString()} units` : <span className="opacity-10">—</span>}
                          </td>
                          <td className="py-4 px-4 text-right font-black tabular-nums text-red-500 whitespace-nowrap">
                            {!isIn ? `${qty.toLocaleString()} units` : <span className="opacity-10">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 font-bold">
                    <tr>
                      <td colSpan="3" className="py-4 pl-4 text-[10px] uppercase tracking-widest text-[#C5A059]">Total Inventory Movement</td>
                      <td className="py-4 px-4 text-right text-emerald-400 font-black tabular-nums whitespace-nowrap">
                        {data.summary.totalMaterialIn.toLocaleString()} units IN
                      </td>
                      <td className="py-4 pr-4 text-right text-red-400 font-black tabular-nums whitespace-nowrap">
                        {data.summary.totalMaterialOut.toLocaleString()} units OUT
                      </td>
                    </tr>
                  </tfoot>
                </table></div>
            }
          </Section>
          {/* Vendor Purchases */}
          <Section title="Vendor Purchases" icon={Briefcase} count={(data.vendorPurchases || []).length}>
            {!(data.vendorPurchases || []).length
              ? <Empty text="No vendor purchases recorded for this date" />
              : <div className="table-responsive"><table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 text-left pl-4">Date</th>
                    <th className="pb-3 text-left px-4">Vendor</th>
                    <th className="pb-3 text-left px-4">Description</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Bill Amt (+)</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Paid (-)</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Remaining</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.vendorPurchases.map((v, i) => {
                      const amt = Number(v.amount) || 0;
                      const isBill = String(v.type).toUpperCase() === 'BILL';
                      const isPayment = String(v.type).toUpperCase() === 'PAYMENT';
                      return (
                        <tr key={v.id || i} className="hover:bg-slate-50">
                          <td className="py-4 text-xs font-black text-slate-900 pl-4 whitespace-nowrap">{new Date(v.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="py-4 font-semibold text-slate-800 px-4">{v.vendor_name}</td>
                          <td className="py-4 text-slate-500 px-4 italic text-xs">{v.description}</td>
                          <td className="py-4 text-right px-4 font-black tabular-nums text-slate-900 whitespace-nowrap">
                            {isBill ? `₨ ${amt.toLocaleString()}` : <span className="opacity-10">—</span>}
                          </td>
                          <td className="py-4 text-right px-4 font-black tabular-nums text-emerald-600 whitespace-nowrap">
                            {isPayment ? `₨ ${amt.toLocaleString()}` : <span className="opacity-10">—</span>}
                          </td>
                          <td className="py-4 text-right px-4 font-black tabular-nums text-orange-500 whitespace-nowrap">
                            {isBill ? `₨ ${amt.toLocaleString()}` : <span className="opacity-10">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 font-bold">
                    <tr>
                      <td colSpan="3" className="py-4 pl-4 text-[10px] uppercase tracking-widest text-[#C5A059]">Gross Vendor Summary</td>
                      <td className="py-4 px-4 text-right text-white font-black tabular-nums whitespace-nowrap">₨ {(data.summary.totalVendorBills || 0).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-emerald-400 font-black tabular-nums whitespace-nowrap">₨ {(data.summary.totalVendorPaid || 0).toLocaleString()}</td>
                      <td className="py-4 pr-4 text-right text-orange-400 font-black tabular-nums whitespace-nowrap">₨ {((data.summary.totalVendorBills || 0) - (data.summary.totalVendorPaid || 0)).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table></div>
            }
          </Section>

          {/* Labour Payouts */}
          <Section title="Labour Payouts" icon={Users} count={data.labourPayouts.length}>
            {data.labourPayouts.length === 0
              ? <Empty text="No labour transactions recorded for this date" />
              : <div className="table-responsive"><table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 text-left pl-4">Date</th>
                    <th className="pb-3 text-left px-4">Worker</th>
                    <th className="pb-3 text-left px-4">Description</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Work Amount (+)</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Paid (-)</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Advance (-)</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.labourPayouts.map(p => {
                      const amt = Number(p.amount) || 0;
                      const isEarning = String(p.type).toUpperCase() === 'EARNING';
                      const isAdvance = !isEarning && String(p.description || '').toLowerCase().includes('advance');
                      const isPaid = !isEarning && !isAdvance;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-4 text-xs font-black text-slate-900 pl-4 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="py-4 font-semibold text-slate-800 px-4">{p.worker_name}</td>
                          <td className="py-4 text-slate-500 px-4 italic text-xs">{p.description}</td>
                          <td className="py-4 text-right px-4 font-black tabular-nums text-emerald-600 whitespace-nowrap">
                            {isEarning ? `₨ ${amt.toLocaleString()}` : <span className="opacity-10">—</span>}
                          </td>
                          <td className="py-4 text-right px-4 font-black tabular-nums text-blue-500 whitespace-nowrap">
                            {isPaid ? `₨ ${amt.toLocaleString()}` : <span className="opacity-10">—</span>}
                          </td>
                          <td className="py-4 text-right px-4 font-black tabular-nums text-red-500 whitespace-nowrap">
                            {isAdvance ? `₨ ${amt.toLocaleString()}` : <span className="opacity-10">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 font-bold">
                    <tr>
                      <td colSpan="3" className="py-4 pl-4 text-[10px] uppercase tracking-widest text-[#C5A059]">Gross Labour Summary</td>
                      <td className="py-4 px-4 text-right text-emerald-400 font-black tabular-nums whitespace-nowrap">₨ {(data.summary.totalLabourEarned || 0).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-blue-400 font-black tabular-nums whitespace-nowrap">₨ {(data.summary.totalLabourPaid || 0).toLocaleString()}</td>
                      <td className="py-4 pr-4 text-right text-red-400 font-black tabular-nums whitespace-nowrap">
                        ₨ {data.labourPayouts.filter(p => String(p.description || '').toLowerCase().includes('advance') && String(p.type).toUpperCase() !== 'EARNING').reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table></div>
            }
          </Section>

          {/* Sales */}
          <Section title="Showroom Sales" icon={TrendingUp} count={data.salesRecords.length}>
            {data.salesRecords.length === 0
              ? <Empty text="No sales recorded for this date" />
              : <div className="table-responsive"><table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 text-left pl-4">Customer</th>
                    <th className="pb-3 text-left px-4">Product</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Sale (+)</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Received (-)</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Remaining</th>
                    <th className="pb-3 text-right px-4 whitespace-nowrap">Net Balance</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.salesRecords.map(s => {
                      const sale = Number(s.total_amount) || 0;
                      const received = Number(s.down_payment) || 0;
                      const remaining = sale - received;
                      return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-slate-800 pl-4">{s.customer_name}</td>
                        <td className="py-3 text-slate-600 px-4">{s.product}</td>
                        <td className="py-3 text-right px-4 font-black tabular-nums text-slate-900 whitespace-nowrap">{sale > 0 ? `₨ ${sale.toLocaleString()}` : <span className="opacity-10">—</span>}</td>
                        <td className="py-3 text-right px-4 font-black tabular-nums text-emerald-600 whitespace-nowrap">{received > 0 ? `₨ ${received.toLocaleString()}` : <span className="opacity-10">—</span>}</td>
                        <td className="py-3 text-right px-4 font-black tabular-nums text-orange-500 whitespace-nowrap">{remaining !== 0 ? `₨ ${remaining.toLocaleString()}` : <span className="opacity-10">—</span>}</td>
                        <td className="py-3 text-right px-4 font-black tabular-nums text-[#C5A059] whitespace-nowrap">₨ {Number(s.balance_due).toLocaleString()}</td>
                      </tr>
                    )})}
                  </tbody>
                  <tfoot className="bg-slate-900 font-bold">
                    <tr>
                      <td colSpan="2" className="py-4 pl-4 text-[10px] uppercase tracking-widest text-[#C5A059]">Gross Sales Revenue</td>
                      <td className="py-4 px-4 text-right text-white font-black tabular-nums whitespace-nowrap">₨ {data.salesRecords.reduce((sum, s) => sum + Number(s.total_amount || 0), 0).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-emerald-400 font-black tabular-nums whitespace-nowrap">₨ {data.salesRecords.reduce((sum, s) => sum + Number(s.down_payment || 0), 0).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-orange-400 font-black tabular-nums whitespace-nowrap">₨ {data.salesRecords.reduce((sum, s) => sum + (Number(s.total_amount || 0) - Number(s.down_payment || 0)), 0).toLocaleString()}</td>
                      <td className="py-4 pr-4"></td>
                    </tr>
                  </tfoot>
                </table></div>
            }
          </Section>
        </div>
      )}

      {/* Initial empty state */}
      {!data && !loading && !error && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-400">Select a date and click "Get Report"</h3>
          <p className="text-slate-300 text-sm mt-1">The detailed metrics will appear here</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, count, children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#C5A059]" />
          {title}
        </h3>
        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">{count} records</span>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return (
    <p className="text-center text-slate-400 text-sm py-6 bg-slate-50 rounded-2xl">{text}</p>
  );
}

export default Reports;
