import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  UploadCloud,
  BarChart3,
  Database,
  Activity,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  modelsLoadedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ modelsLoadedCount = 1 }) => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Risk Prediction', path: '/predict', icon: ShieldAlert },
    { name: 'Upload Your Data', path: '/upload', icon: UploadCloud },
    { name: 'Model Performance', path: '/performance', icon: BarChart3 },
    { name: 'Data Explorer', path: '/explorer', icon: Database },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-white flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-navy-800 shadow-xl select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center p-1.5 border border-teal-accent/30 shadow-inner">
            <svg viewBox="0 0 40 40" className="w-full h-full fill-none">
              <path
                d="M8 28L16 18L23 23L32 12"
                stroke="#20C7C9"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="12" r="3.5" fill="#1463E8" />
              <circle cx="8" cy="28" r="2.5" fill="#20C7C9" />
              <circle cx="16" cy="18" r="2.5" fill="#20C7C9" />
              <circle cx="23" cy="23" r="2.5" fill="#20C7C9" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-white font-sans">Invest<span className="text-teal-accent">IQ</span></span>
              <span className="text-[10px] bg-primary/30 text-teal-accent font-semibold px-1.5 py-0.5 rounded border border-teal-accent/30">ML</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Investment Risk Intelligence</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 italic border-l-2 border-teal-accent/60 pl-2">
          Smarter Insights. Better Investments.
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Platform Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-accent' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-teal-accent" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-navy-800 bg-navy-900/90 text-xs">
        <div className="flex items-center justify-between text-slate-300 mb-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">System Engine</span>
          </div>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
            Online
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Active Model</span>
          </div>
          <span className="text-slate-300 font-medium">Random Forest</span>
        </div>
        <div className="mt-3 pt-2 border-t border-navy-800 text-[10px] text-slate-400 text-center">
          Academic Research v1.0 • Not Financial Advice
        </div>
      </div>
    </aside>
  );
};
