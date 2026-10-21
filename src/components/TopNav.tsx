import React from 'react';
import { Cloud, Download } from 'lucide-react';

export type ActiveTab = 
  | 'calculator'
  | 'assessment'
  | 'performance'
  | 'forecasts'
  | 'quarterly'
  | 'monitoring'
  | 'advisor';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenExport: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenExport,
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'calculator', label: 'Workload Calculator' },
    { id: 'assessment', label: 'Live Assessment' },
    { id: 'performance', label: 'Performance Benchmarks' },
    { id: 'forecasts', label: 'Pricing & Forecasts' },
    { id: 'quarterly', label: 'Quarterly & History' },
    { id: 'monitoring', label: 'Live Monitoring' },
    { id: 'advisor', label: 'AI Advisor' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single element brand wordmark */}
          <div 
            onClick={() => onTabChange('calculator')}
            className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              CloudParity
            </span>
          </div>

          {/* Zone 2: 4-6 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenExport}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-md transition-all shadow-sm shadow-cyan-600/30 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex md:hidden overflow-x-auto gap-1 py-2 border-t border-slate-800/80 -mx-4 px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50'
                  : 'text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
