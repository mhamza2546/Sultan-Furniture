import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import InventoryTable from './components/InventoryTable';
import AddMaterialForm from './components/AddMaterialForm';
import WorkerLedger from './components/WorkerLedger';
import VendorLedger from './components/VendorLedger';
import CustomerLedger from './components/CustomerLedger';
import DynamicBOM from './components/DynamicBOM';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Reports from './components/Reports';
import NewOrderModal from './components/NewOrderModal';
import Profile from './components/Profile';
import PrivateVault from './components/PrivateVault';
import { Bell, Search, Globe, ChevronDown, Plus, LayoutGrid, List, Menu } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('sultan_activeTab') || 'dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('sultan_auth') === 'true');

  useEffect(() => {
    localStorage.setItem('sultan_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('sultan_auth', 'true');
    } else {
      localStorage.removeItem('sultan_auth');
    }
  }, [isAuthenticated]);
  const [inventoryRefresh, setInventoryRefresh] = useState(0);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onGenerateReport={() => setActiveTab('reports')}
          />
        );
      case 'inventory':
        return (
          <div className="flex flex-col gap-8 h-full animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Supplier & Material Ledger</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Buy raw materials & track supplier debts</p>
              </div>
            </div>
            <VendorLedger />
          </div>
        );
      case 'labour':
        return (
          <div className="animate-in fade-in duration-500 h-full">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Worker Ledger Management</h2>
            <WorkerLedger />
          </div>
        );
      case 'accounts':
        return (
          <div className="animate-in fade-in duration-500 h-full">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Showroom Sales & Credits</h2>
            <CustomerLedger />
          </div>
        );
      case 'reports':
        return <Reports />;
      case 'vault':
        return <PrivateVault />;
      case 'profile':
        return <Profile onLogout={() => setIsAuthenticated(false)} />;
      default:
        return (
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <div className="text-center p-5 bg-slate-100 rounded-4 border border-dashed border-slate-300">
              <h3 className="font-bold text-slate-400">Coming Soon...</h3>
              <p className="text-sm text-slate-400">This module is part of the next Phase development.</p>
            </div>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden', background: '#F8FAFC' }}>

      {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
      <div className="d-none d-lg-flex flex-column" style={{ width: '288px', flexShrink: 0 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsAuthenticated(false)} />
      </div>

      {/* ===== MOBILE OFFCANVAS SIDEBAR ===== */}
      <div className="offcanvas offcanvas-start offcanvas-sidebar d-lg-none"
        tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
        <div className="offcanvas-header">
          <span className="text-white font-bold" id="mobileSidebarLabel">Abrar's Furniture</span>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body p-0" style={{ overflowY: 'auto' }}>
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              const el = document.getElementById('mobileSidebar');
              const bs = window.bootstrap?.Offcanvas?.getInstance(el);
              if (bs) bs.hide();
            }}
            onLogout={() => setIsAuthenticated(false)}
            hideLogo={true}
          />
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="d-flex flex-column flex-grow-1" style={{ overflow: 'hidden' }}>

        {/* TOP HEADER */}
        <header className="d-flex align-items-center justify-content-between px-3 px-lg-4 bg-white border-bottom"
          style={{ height: '64px', flexShrink: 0, zIndex: 20 }}>

          <div className="d-flex align-items-center gap-3">
            {/* Hamburger — Mobile Only */}
            <button
              className="d-lg-none btn p-2 text-slate-600 rounded-xl border-0 bg-slate-100"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-controls="mobileSidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search — hidden on small mobile */}
            <div className="d-none d-md-flex align-items-center position-relative">
              <Search className="position-absolute ms-3 text-slate-400 w-4 h-4" style={{ left: 0 }} />
              <input
                type="text"
                placeholder="Master Search (Alt + /)"
                className="form-control border-0 rounded-3 ps-5"
                style={{ width: '100%', minWidth: '150px', maxWidth: '320px', background: '#F1F5F9', fontSize: '14px', fontWeight: 600 }}
              />
            </div>

            {/* Branch badge — desktop only */}
            <div className="d-none d-lg-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-slate-50 border text-slate-400"
              style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Globe className="w-3 h-3" />
              Shadra Main Branch
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="btn p-2 bg-white border rounded-3 text-slate-500 position-relative shadow-sm">
              <Bell className="w-5 h-5" />
              <span className="position-absolute top-0 end-0 translate-middle badge rounded-circle bg-danger"
                style={{ width: '10px', height: '10px', padding: 0, border: '2px solid white' }}>
              </span>
            </button>
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="btn d-flex align-items-center gap-2 px-3 py-2 text-white rounded-3 shadow-sm"
              style={{ background: '#0F172A', fontSize: '14px', fontWeight: 700 }}
            >
              <Plus className="w-4 h-4" style={{ color: '#C5A059' }} />
              <span className="d-none d-sm-inline">New Order</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow-1 overflow-auto py-4 px-3 px-md-4">
          <div className="container-fluid" style={{ maxWidth: '1400px' }}>
            {renderContent()}
          </div>
        </main>
      </div>

      <NewOrderModal
        open={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onCreated={() => setActiveTab('accounts')}
      />
    </div>
  );
}

export default App;
