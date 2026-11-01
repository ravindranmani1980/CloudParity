import React from 'react';
import { Download } from 'lucide-react';

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
    { id: 'performance', label: 'Benchmarks' },
    { id: 'forecasts', label: 'Forecasts' },
    { id: 'quarterly', label: 'Quarterly & History' },
    { id: 'monitoring', label: 'Live Monitoring' },
    { id: 'advisor', label: 'AI Advisor' },
  ];

  return (
    <header className="rm-site-header px-6">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 min-h-[64px] py-2">
        {/* Zone 1: Brand lockup with RM mono mark */}
        <a
          href="#calculator"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('calculator');
          }}
          className="rm-brand whitespace-nowrap shrink-0"
        >
          <span className="rm-mono-mark" aria-hidden="true">
            RM
          </span>
          <span>
            Maniq <span className="text-[#A9B7BF] font-light mx-0.5">|</span> <span className="accent">Compare</span>
          </span>
        </a>

        {/* Zone 2: Navigation links */}
        <nav aria-label="Main navigation" className="flex items-center gap-6 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`rm-navlink whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive ? 'rm-navlink-active' : ''
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenExport}
            className="xh-btn primary whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
