import React, { useState, useEffect } from 'react';
import {
  Calendar, Search, Package, Users, TrendingUp, ShoppingCart,
  ArrowUp, ArrowDown, Loader2, AlertCircle, ClipboardList
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

          {/* Monthly manufacturing summary */}
          {mode === 'month' && data?.summary && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard icon={ClipboardList} label="Jobs Created" value={data.summary.jobsCreated ?? 0} color="text-slate-700" bg="bg-slate-50" />
              <StatCard icon={TrendingUp} label="Jobs Forwarded" value={data.summary.jobsForwarded ?? 0} color="text-indigo-700" bg="bg-indigo-50" />
              <StatCard icon={Package} label="Jobs Finished" value={data.summary.jobsFinished ?? 0} color="text-emerald-700" bg="bg-emerald-50" />
            </div>
          )}

          {/* Inventory Logs */}
          <Section title="Inventory Movements" icon={Package} count={data.inventoryLogs.length}>
            {data.inventoryLogs.length === 0
              ? <Empty text="No inventory movement recorded for this date" />
              : <div className="table-responsive"><table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 text-left">Material</th>
                    <th className="pb-3 text-left">Type</th>
                    <th className="pb-3 text-left">Qty</th>
                    <th className="pb-3 text-left">Reason</th>
                    <th className="pb-3 text-left">Time</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.inventoryLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-slate-800">{l.material_name}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${l.type === 'IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {l.type}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{l.qty}</td>
                        <td className="py-3 text-slate-400 text-xs">{l.reason}</td>
                        <td className="py-3 text-slate-400 text-xs">{new Date(l.created_at).toLocaleTimeString('en-PK')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <tr>
                      <td colSpan="2" className="py-3 text-right pr-4 text-slate-500 uppercase tracking-widest text-[10px] font-black">Daily Volume Given/Taken</td>
                      <td colSpan="3" className="py-3 text-slate-800">
                        <span className="text-emerald-600">{data.summary.totalMaterialIn} IN</span> / <span className="text-red-500">{data.summary.totalMaterialOut} OUT</span>
                      </td>
                    </tr>
                  </tfoot>
                </table></div>
            }
          </Section>

          {/* Labour Payouts */}
          <Section title="Labour Payouts" icon={Users} count={data.labourPayouts.length}>
            {data.labourPayouts.length === 0
              ? <Empty text="No labour payments recorded for this date" />
              : <div className="table-responsive"><table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 text-left">Worker</th>
                    <th className="pb-3 text-left">Job</th>
                    <th className="pb-3 text-left">Qty</th>
                    <th className="pb-3 text-left">Rate</th>
                    <th className="pb-3 text-left">Total</th>
                    <th className="pb-3 text-left">Time</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.labourPayouts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-slate-800">{p.worker_name}</td>
                        <td className="py-3 text-slate-600">{p.job_type}</td>
                        <td className="py-3 text-slate-600">{p.quantity}</td>
                        <td className="py-3 text-slate-600">Rs. {Number(p.rate_per_unit).toLocaleString()}</td>
                        <td className="py-3 font-bold text-emerald-600">Rs. {Number(p.total_payout).toLocaleString()}</td>
                        <td className="py-3 text-slate-400 text-xs">{new Date(p.created_at).toLocaleTimeString('en-PK')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-emerald-50/50 font-bold border-t-2 border-emerald-100">
                    <tr>
                      <td colSpan="4" className="py-3 text-right pr-4 text-emerald-700/70 uppercase tracking-widest text-[10px] font-black">Gross Labour Total</td>
                      <td colSpan="2" className="py-3 text-emerald-700 text-lg font-black">Rs. {Number(data.summary.totalLabourPaid).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table></div>
            }
          </Section>

          {/* Sales */}
          <Section title="Sales & Receipts" icon={TrendingUp} count={data.salesRecords.length}>
            {data.salesRecords.length === 0
              ? <Empty text="No sales recorded for this date" />
              : <div className="table-responsive"><table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 text-left">Customer</th>
                    <th className="pb-3 text-left">Product</th>
                    <th className="pb-3 text-left">Total</th>
                    <th className="pb-3 text-left">Paid</th>
                    <th className="pb-3 text-left">Balance</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.salesRecords.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-slate-800">{s.customer_name}</td>
                        <td className="py-3 text-slate-600">{s.product}</td>
                        <td className="py-3 font-bold text-blue-600">Rs. {Number(s.total_amount).toLocaleString()}</td>
                        <td className="py-3 text-emerald-600 font-semibold">Rs. {Number(s.down_payment).toLocaleString()}</td>
                        <td className="py-3 font-bold text-slate-400">Rs. {Number(s.balance_due).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50/50 font-bold border-t-2 border-blue-100">
                    <tr>
                      <td colSpan="2" className="py-3 text-right pr-4 text-blue-700/70 uppercase tracking-widest text-[10px] font-black">Gross Sales Revenue</td>
                      <td colSpan="3" className="py-3 text-blue-700 text-lg font-black">Rs. {Number(data.summary.totalSales).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table></div>
            }
          </Section>

          {/* Jobs Created */}
          <Section title="Production Jobs Started" icon={ClipboardList} count={data.jobsCreated.length}>
            {data.jobsCreated.length === 0
              ? <Empty text="No production jobs started on this date" />
              : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.jobsCreated.map(j => (
                    <div key={j.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{j.product}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{j.id}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">{j.stage}</span>
                    </div>
                  ))}
                </div>
            }
          </Section>

          {/* Jobs Forwarded (monthly) */}
          {mode === 'month' && Array.isArray(data.jobsForwarded) && (
            <Section title="Jobs Forwarded (Stage Movements)" icon={TrendingUp} count={data.jobsForwarded.length}>
              {data.jobsForwarded.length === 0
                ? <Empty text="No stage movements logged for this month" />
                : <table className="w-full text-sm">
                    <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                      <th className="pb-3 text-left">Job</th>
                      <th className="pb-3 text-left">From</th>
                      <th className="pb-3 text-left">To</th>
                      <th className="pb-3 text-left">Time</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.jobsForwarded.slice(0, 200).map(l => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-3 font-semibold text-slate-800">{l.product} — {l.job_id}</td>
                          <td className="py-3 text-slate-600">{l.from_stage}</td>
                          <td className="py-3 text-slate-600">{l.to_stage}</td>
                          <td className="py-3 text-slate-400 text-xs">{new Date(l.changed_at).toLocaleString('en-PK')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </Section>
          )}
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
