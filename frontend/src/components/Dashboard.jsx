import React, { useEffect, useMemo, useState } from 'react';
import { 
  TrendingUp as TrendingUpIcon, 
  Users as UsersIcon, 
  Package, 
  AlertCircle as AlertIcon, 
  ArrowUpRight as UpIcon, 
  ArrowDownRight as DownIcon,
  Clock,
  Loader2 as LoaderIcon,
  WifiOff as OfflineIcon,
  ShoppingBag as SaleIcon,
  Activity as ActivityIcon,
  Store as StoreIcon,
  X as XIcon
} from 'lucide-react';
import { API } from '../lib/api';

function startOfMonthISO(d = new Date()) {
  const dt = new Date(d);
  dt.setDate(1);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
}

function formatCurrencyShort(value) {
  const num = Number(value) || 0;
  const absNum = Math.abs(num);
  if (absNum >= 10000000) {
    return (num / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  } else if (absNum >= 100000) {
    return (num / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  }
  return num.toLocaleString('en-PK');
}

function Dashboard({ onGenerateReport }) {
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState('');
  const [selectedStat, setSelectedStat] = useState(null);

  const [sales, setSales] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [monthSummary, setMonthSummary] = useState(null);

  const monthStart = useMemo(() => new Date(startOfMonthISO()), []);
  const currentMonthStr = useMemo(() => startOfMonthISO().slice(0, 7), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [healthRes, salesRes, materialsRes, customersRes, workersRes, vendorsRes, reportRes] = await Promise.all([
          fetch(`${API}/`),
          fetch(`${API}/api/reports/latest-sales`),
          fetch(`${API}/api/materials`),
          fetch(`${API}/api/customers`),
          fetch(`${API}/api/workers`),
          fetch(`${API}/api/vendors`),
          fetch(`${API}/api/reports/month?month=${currentMonthStr}`)
        ]);

        if (cancelled) return;

        setIsOnline(healthRes.ok);

        const [salesJson, materialsJson, customersJson, workersJson, vendorsJson, reportJson] = await Promise.all([
          salesRes.json(),
          materialsRes.json(),
          customersRes.json(),
          workersRes.json(),
          vendorsRes.json(),
          reportRes.json()
        ]);

        setSales(Array.isArray(salesJson) ? salesJson : []);
        setMaterials(Array.isArray(materialsJson) ? materialsJson : []);
        setCustomers(Array.isArray(customersJson) ? customersJson : []);
        setWorkers(Array.isArray(workersJson) ? workersJson : []);
        setVendors(Array.isArray(vendorsJson) ? vendorsJson : []);
        setMonthSummary(reportJson?.summary || null);
      } catch (e) {
        if (cancelled) return;
        setIsOnline(false);
        setError('Failed to establish connection. System offline.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [currentMonthStr]);

  const totalShowroomSales = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.total_sales_bill) || 0), 0);
  }, [customers]);

  const totalShowroomBalance = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
  }, [customers]);

  const totalShowroomReceived = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.total_received) || 0), 0);
  }, [customers]);

  const stats = useMemo(() => ([
    { label: 'Total Showroom Sales', value: `₨ ${formatCurrencyShort(totalShowroomSales)}`, fullValue: `₨ ${Number(totalShowroomSales).toLocaleString('en-PK')}`, change: 'All Time', isUp: true, icon: TrendingUpIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Showrooms', value: String(customers.length).padStart(2, '0'), fullValue: String(customers.length), change: 'Partners', isUp: true, icon: StoreIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Net Pending Balance', value: `₨ ${formatCurrencyShort(Math.abs(Number(totalShowroomBalance)))}`, fullValue: `₨ ${Math.abs(Number(totalShowroomBalance)).toLocaleString('en-PK')}`, change: 'Remaining', isUp: false, icon: AlertIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Received Amount', value: `₨ ${formatCurrencyShort(totalShowroomReceived)}`, fullValue: `₨ ${Number(totalShowroomReceived).toLocaleString('en-PK')}`, change: 'Recovered', isUp: true, icon: ActivityIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]), [totalShowroomSales, customers.length, totalShowroomBalance, totalShowroomReceived]);

  const totalLabourEarned = useMemo(() => {
    return workers.reduce((sum, w) => sum + (Number(w.total_earned) || 0), 0);
  }, [workers]);

  const totalLabourAdvance = useMemo(() => {
    return workers.reduce((sum, w) => sum + (Number(w.total_advance) || 0), 0);
  }, [workers]);

  const totalLabourBalance = useMemo(() => {
    return workers.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  }, [workers]);

  const labourStats = useMemo(() => ([
    { label: 'Total Labour Earned', value: `₨ ${formatCurrencyShort(totalLabourEarned)}`, fullValue: `₨ ${Number(totalLabourEarned).toLocaleString('en-PK')}`, change: 'All Time', isUp: true, icon: ActivityIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Labours', value: String(workers.length).padStart(2, '0'), fullValue: String(workers.length), change: 'Active', isUp: true, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Net Labour Balance', value: `₨ ${formatCurrencyShort(Math.abs(Number(totalLabourBalance)))}`, fullValue: `₨ ${Math.abs(Number(totalLabourBalance)).toLocaleString('en-PK')}`, change: 'Remaining', isUp: false, icon: AlertIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Advance Given', value: `₨ ${formatCurrencyShort(totalLabourAdvance)}`, fullValue: `₨ ${Number(totalLabourAdvance).toLocaleString('en-PK')}`, change: 'Paid', isUp: true, icon: SaleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]), [totalLabourEarned, workers.length, totalLabourAdvance, totalLabourBalance]);

  const totalVendorPurchase = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (Number(v.total_purchase) || 0), 0);
  }, [vendors]);

  const totalVendorPaid = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (Number(v.total_paid) || 0), 0);
  }, [vendors]);

  const totalVendorBalance = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (Number(v.balance) || 0), 0);
  }, [vendors]);

  const supplierStats = useMemo(() => ([
    { label: 'Total Purchase', value: `₨ ${formatCurrencyShort(totalVendorPurchase)}`, fullValue: `₨ ${Number(totalVendorPurchase).toLocaleString('en-PK')}`, change: 'All Time', isUp: true, icon: SaleIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Suppliers', value: String(vendors.length).padStart(2, '0'), fullValue: String(vendors.length), change: 'Active', isUp: true, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Net Pending Balance', value: `₨ ${formatCurrencyShort(Math.abs(Number(totalVendorBalance)))}`, fullValue: `₨ ${Math.abs(Number(totalVendorBalance)).toLocaleString('en-PK')}`, change: 'Remaining', isUp: false, icon: AlertIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Paid Against Bill', value: `₨ ${formatCurrencyShort(totalVendorPaid)}`, fullValue: `₨ ${Number(totalVendorPaid).toLocaleString('en-PK')}`, change: 'Cleared', isUp: true, icon: ActivityIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]), [totalVendorPurchase, vendors.length, totalVendorBalance, totalVendorPaid]);

  const otherStats = useMemo(() => ([
    { label: 'Total Receivables & Advances', value: `₨ ${formatCurrencyShort(totalShowroomBalance + totalLabourAdvance)}`, fullValue: `₨ ${Number(totalShowroomBalance + totalLabourAdvance).toLocaleString('en-PK')}`, change: 'Market Assets', isUp: true, icon: TrendingUpIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Market Payables', value: `₨ ${formatCurrencyShort(Math.abs(Number(totalLabourBalance + totalVendorBalance)))}`, fullValue: `₨ ${Math.abs(Number(totalLabourBalance + totalVendorBalance)).toLocaleString('en-PK')}`, change: 'Liabilities', isUp: false, icon: AlertIcon, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Sales + Labour Advances', value: `₨ ${formatCurrencyShort(totalShowroomSales + totalLabourAdvance)}`, fullValue: `₨ ${Number(totalShowroomSales + totalLabourAdvance).toLocaleString('en-PK')}`, change: 'Operations', isUp: true, icon: ActivityIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]), [totalShowroomBalance, totalLabourAdvance, totalLabourBalance, totalVendorBalance, totalShowroomSales]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Factory Overview</h1>
          <p className="text-slate-500 mt-1">Sultan Furniture Real-time Operations Dashboard</p>
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
                <OfflineIcon className="w-4 h-4 text-red-500" />
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
          <AlertIcon className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Stat Detail Modal */}
      {selectedStat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelectedStat(null)}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedStat(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <div className={`${selectedStat.bg} ${selectedStat.color} p-5 rounded-3xl`}>
              <selectedStat.icon className="w-8 h-8" />
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest text-center">{selectedStat.label}</p>
            <h2 className="text-4xl font-black text-slate-900 text-center tracking-tight leading-tight">
              {selectedStat.fullValue || selectedStat.value}
            </h2>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
              selectedStat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>
              {selectedStat.isUp ? <UpIcon className="w-3 h-3" /> : <DownIcon className="w-3 h-3" />}
              {selectedStat.change}
            </span>
          </div>
        </div>
      )}

      {/* Stats Grids */}
      <div className="space-y-8">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center justify-center gap-2"><StoreIcon className="w-4 h-4 text-[#C5A059]" /> Showroom Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card group cursor-pointer" onClick={() => setSelectedStat(stat)}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold ${stat.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stat.isUp ? <UpIcon className="w-3 h-3" /> : <DownIcon className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2 truncate" title={stat.fullValue || stat.value}>
                  {loading ? <LoaderIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-400" /> : null}
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center justify-center gap-2"><UsersIcon className="w-4 h-4 text-[#C5A059]" /> Labour Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {labourStats.map((stat, i) => (
              <div key={i} className="stat-card group cursor-pointer" onClick={() => setSelectedStat(stat)}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold ${stat.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stat.isUp ? <UpIcon className="w-3 h-3" /> : <DownIcon className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2 truncate" title={stat.fullValue || stat.value}>
                  {loading ? <LoaderIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-400" /> : null}
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center justify-center gap-2"><Package className="w-4 h-4 text-[#C5A059]" /> Supplier Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supplierStats.map((stat, i) => (
              <div key={i} className="stat-card group cursor-pointer" onClick={() => setSelectedStat(stat)}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold ${stat.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stat.isUp ? <UpIcon className="w-3 h-3" /> : <DownIcon className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2 truncate" title={stat.fullValue || stat.value}>
                  {loading ? <LoaderIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-400" /> : null}
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center justify-center gap-2"><ActivityIcon className="w-4 h-4 text-[#C5A059]" /> Other Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherStats.map((stat, i) => (
              <div key={i} className="stat-card group cursor-pointer" onClick={() => setSelectedStat(stat)}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold ${stat.isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stat.isUp ? <UpIcon className="w-3 h-3" /> : <DownIcon className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2 truncate" title={stat.fullValue || stat.value}>
                  {loading ? <LoaderIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-400" /> : null}
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Dispatch Activity */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Showroom Dispatches</h2>
            <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <SaleIcon className="w-4 h-4" />
            </div>
          </div>
          
          <div className="space-y-6">
            {loading ? (
              <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin" />
                Loading dispatches...
              </div>
            ) : sales.length === 0 ? (
              <div className="text-slate-400 text-sm font-medium h-40 flex items-center justify-center border-2 border-dashed border-slate-50 rounded-3xl">
                No dispatch records found yet.
              </div>
            ) : sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                  <ActivityIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-900 truncate">{sale.customer_name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{sale.product}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">₨ {Number(sale.amount).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(sale.created_at).toLocaleDateString('en-PK')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alert */}
        <div className="space-y-6">
           <div className="bg-[#000B1A] rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20">
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-2 tracking-tight">QR Scanner</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed font-medium">Quickly update stock levels or mark as dispatched.</p>
                <button className="w-full py-4 bg-[#C5A059] hover:bg-white hover:text-slate-900 text-white font-black rounded-2xl transition-all duration-300 transform group-hover:translate-y-[-2px] uppercase text-xs tracking-widest">
                  Start Scanning
                </button>
              </div>
              <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-[#C5A059]/20 blur-[50px] rounded-full group-hover:bg-[#C5A059]/40 transition-all duration-500"></div>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-100 shadow-lg p-8">
              <h3 className="text-slate-900 font-black mb-6 flex items-center gap-2">
                <AlertIcon className="w-5 h-5 text-red-500" />
                Stock Alerts
              </h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                    Checking stock...
                  </div>
                ) : materials.filter(m => Number(m.qty) < 10).length === 0 ? (
                  <div className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-bold text-center">
                    All materials are in healthy stock.
                  </div>
                ) : (
                  materials.filter(m => Number(m.qty) < 10).slice(0, 4).map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                      <span className="text-slate-600 font-bold text-xs">{m.name}</span>
                      <span className="text-red-500 font-black text-xs">{Number(m.qty)} {m.unit}</span>
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
