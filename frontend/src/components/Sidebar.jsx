import React from 'react';
import { 
  Boxes, 
  Factory, 
  Users, 
  Wallet, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Truck,
  CreditCard,
  CalendarSearch,
  Lock
} from 'lucide-react';

function Sidebar({ activeTab, setActiveTab, onLogout, hideLogo = false }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory & Materials', icon: Boxes },
    { id: 'orders', label: 'Order Tracking', icon: Truck },
    { id: 'labour', label: 'Labour Ledger', icon: Users },
    { id: 'accounts', label: 'Showroom Sales', icon: Wallet },
    { id: 'vault', label: 'Private Vault', icon: Lock },
    { id: 'reports', label: 'History & Reports', icon: CalendarSearch },
  ];

  return (
    <aside className="w-72 bg-[#000B1A] text-slate-400 flex flex-col h-full shrink-0 border-r border-white/5">
      {/* Brand Logo — hidden in mobile offcanvas */}
      {!hideLogo && (
        <div className="h-64 flex items-center justify-center p-2 border-b border-white/5 group bg-[#000B1A]">
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src="/logo.png"
              alt="Abrar's Furniture"
              className="w-full h-auto max-h-full object-contain transition-all duration-700 group-hover:scale-110 [filter:drop-shadow(0_15px_45px_rgba(0,0,0,0.65))_drop-shadow(0_0_30px_rgba(197,160,89,0.4))] opacity-95"
              onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
            />
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-1 custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Operations</p>
        
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 w-full text-left font-medium text-sm
                ${isActive 
                  ? 'bg-gradient-to-r from-[#C5A059]/20 to-transparent text-[#C5A059] border-l-2 border-[#C5A059]' 
                  : 'hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#C5A059]' : 'text-slate-500 group-hover:text-[#C5A059]'}`} />
              {item.label}
            </button>
          );
        })}
      </div>
      
      {/* Footer / User Settings */}
      <div className="p-6 border-t border-white/5 space-y-4 bg-black/20">
        <button 
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-white transition-colors text-sm font-medium group"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          System Settings
        </button>
        <div className="flex items-center gap-3 px-4 py-2 border border-white/5 rounded-2xl bg-white/5">
           <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#C5A059] to-[#8E6F3E] flex items-center justify-center text-xs font-bold text-white shadow-lg">
             A
           </div>
           <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setActiveTab('profile')}>
             <p className="text-xs font-bold text-white truncate">Administrator</p>
             <p className="text-[10px] text-slate-500 truncate">Shadra Main Branch</p>
           </div>
           <LogOut
              onClick={() => onLogout && onLogout()}
              className="w-4 h-4 text-slate-500 hover:text-red-400 cursor-pointer"
              title="Sign Out"
           />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
