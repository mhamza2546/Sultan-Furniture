import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Loader2,
  WifiOff
} from 'lucide-react';
import { API } from '../lib/api';

function startOfMonthISO(d = new Date()) {
  const dt = new Date(d);
  dt.setDate(1);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
}

function Dashboard({ onGenerateReport, onViewPipeline }) {
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState('');

  const [sales, setSales] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [materials, setMaterials] = useState([]);

  const monthStart = useMemo(() => new Date(startOfMonthISO()), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [healthRes, salesRes, jobsRes, payoutsRes, materialsRes] = await Promise.all([
          fetch(`${API}/`),
          fetch(`${API}/api/sales`),
          fetch(`${API}/api/jobs`),
          fetch(`${API}/api/payouts`),
          fetch(`${API}/api/materials`),
        ]);

        if (cancelled) return;

        setIsOnline(healthRes.ok);

        const [salesJson, jobsJson, payoutsJson, materialsJson] = await Promise.all([
          salesRes.json(),
          jobsRes.json(),
          payoutsRes.json(),
          materialsRes.json(),
        ]);

        setSales(Array.isArray(salesJson) ? salesJson : []);
        setJobs(Array.isArray(jobsJson) ? jobsJson : []);
        setPayouts(Array.isArray(payoutsJson) ? payoutsJson : []);
        setMaterials(Array.isArray(materialsJson) ? materialsJson : []);
      } catch (e) {
        if (cancelled) return;
        setIsOnline(false);
        setError('Failed to establish connection. System offline.');
        setSales([]);
        setJobs([]);
        setPayouts([]);
        setMaterials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 30000); // keep dashboard fresh
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [monthStart]);

  const parsedSales = useMemo(() => {
    return sales
      .map(s => ({
        ...s,
        createdAt: s.created_at ? new Date(s.created_at) : null,
        totalAmount: Number(s.total_amount ?? 0),
      }))
      .filter(s => s.createdAt && !Number.isNaN(s.createdAt.getTime()));
  }, [sales]);

  const monthRevenue = useMemo(() => {
    return parsedSales
      .filter(s => s.createdAt >= monthStart)
      .reduce((sum, s) => sum + (Number.isFinite(s.totalAmount) ? s.totalAmount : 0), 0);
  }, [parsedSales, monthStart]);

  const activeJobsCount = useMemo(() => {
    return jobs.filter(j => !j.is_completed).length;
  }, [jobs]);

  const monthPayoutTotal = useMemo(() => {
    return payouts
      .map(p => ({
        createdAt: p.created_at ? new Date(p.created_at) : null,
        total: Number(p.total_payout ?? 0),
      }))
      .filter(p => p.createdAt && p.createdAt >= monthStart && Number.isFinite(p.total))
      .reduce((sum, p) => sum + p.total, 0);
  }, [payouts, monthStart]);

  const lowStock = useMemo(() => {
    return materials
      .filter(m => Number(m.qty) < 10)
      .sort((a, b) => Number(a.qty) - Number(b.qty));
  }, [materials]);

  const recentJobs = useMemo(() => {
    const withDate = jobs
      .map(j => ({ ...j, createdAt: j.created_at ? new Date(j.created_at) : null }))
      .filter(j => j.createdAt && !Number.isNaN(j.createdAt.getTime()));
    withDate.sort((a, b) => b.createdAt - a.createdAt);
    return withDate.slice(0, 3);
  }, [jobs]);

  const stats = useMemo(() => ([
    { label: 'Monthly Revenue', value: `₨ ${Number(monthRevenue).toLocaleString('en-PK')}`, change: 'This Month', isUp: true, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Jobs', value: String(activeJobsCount), change: 'In Pipeline', isUp: true, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Labour Payouts', value: `₨ ${Number(monthPayoutTotal).toLocaleString('en-PK')}`, change: 'This Month', isUp: true, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Low Stock Items', value: String(lowStock.length).padStart(2, '0'), change: lowStock.length ? 'Action Required' : 'All Good', isUp: lowStock.length === 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]), [monthRevenue, activeJobsCount, monthPayoutTotal, lowStock.length]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Factory Overview</h1>
          <p className="text-slate-500 mt-1">Abrar's Furniture Real-time Operations Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 shadow-sm flex items-center gap-2">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Online
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                System Offline
              </>
            )}
          </div>
          <button
            onClick={onGenerateReport}
            className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#8E6F3E] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#C5A059]/20 transition-all active:scale-[0.98]"
          >
            Open Reports
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card group">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : null}
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Production Pipeline</h2>
            <button onClick={onViewPipeline} className="text-sm font-bold text-[#C5A059] hover:underline">View Pipeline</button>
          </div>
          
          <div className="space-y-6">
            {loading ? (
              <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading pipeline...
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="text-slate-400 text-sm font-medium">
                No jobs found yet. Create a job in Production Line.
              </div>
            ) : recentJobs.map((job) => (
              <div key={job.id} className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">{job.product} — {job.id}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Stage: {job.stage}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${
                    job.is_completed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {job.is_completed ? 'COMPLETED' : 'IN PROGRESS'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{job.createdAt ? job.createdAt.toLocaleString('en-PK') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Inventory Alert */}
        <div className="space-y-6">
           <div className="bg-[#000B1A] rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">QR Inventory Control</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">Quickly scan product QR codes to update locations or mark as finished.</p>
                <button className="w-full py-3 bg-[#C5A059] hover:bg-white hover:text-slate-900 text-white font-bold rounded-2xl transition-all duration-300 transform group-hover:translate-y-[-2px]">
                  Open Scanner
                </button>
              </div>
              {/* Decorative Blur */}
              <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-[#C5A059]/20 blur-[50px] rounded-full group-hover:bg-[#C5A059]/40 transition-all duration-500"></div>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-100 shadow-lg p-8">
              <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Inventory Alerts
              </h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking stock...
                  </div>
                ) : lowStock.length === 0 ? (
                  <div className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-sm font-medium">
                    No low stock alerts. Warehouse is healthy.
                  </div>
                ) : (
                  lowStock.slice(0, 3).map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-2">
                      <span className="text-slate-600">{m.name} ({m.unit})</span>
                      <span className="text-red-500 font-bold">{Number(m.qty)} {m.unit} Remaining</span>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
