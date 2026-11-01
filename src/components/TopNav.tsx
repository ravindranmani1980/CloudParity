import React, { useState, useEffect, useRef } from 'react';
import { Download, Menu, X, ChevronRight } from 'lucide-react';

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

const NAV_ITEMS: { id: ActiveTab; label: string; shortLabel: string; subtitle: string }[] = [
  {
    id: 'calculator',
    label: 'Workload Calculator',
    shortLabel: 'Calculator',
    subtitle: 'Multi-region TCO & SKU parity sizing',
  },
  {
    id: 'assessment',
    label: 'Live Assessment',
    shortLabel: 'Live Assessment',
    subtitle: 'AWS, Azure & GCP read-only discovery',
  },
  {
    id: 'performance',
    label: 'Benchmarks',
    shortLabel: 'Benchmarks',
    subtitle: 'Compute, IOPS & network latency metrics',
  },
  {
    id: 'forecasts',
    label: 'Forecasts',
    shortLabel: 'Forecasts',
    subtitle: '36-month growth & commitment modeling',
  },
  {
    id: 'quarterly',
    label: 'Quarterly & History',
    shortLabel: 'Quarterly',
    subtitle: 'Seasonal billing cycles & YoY trends',
  },
  {
    id: 'monitoring',
    label: 'Live Monitoring',
    shortLabel: 'Monitoring',
    subtitle: 'Real-time burn rate & D3 spike overages',
  },
  {
    id: 'advisor',
    label: 'AI Advisor',
    shortLabel: 'AI Advisor',
    subtitle: 'Architectural & FinOps optimization',
  },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenExport,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const mobileStripRef = useRef<HTMLDivElement | null>(null);

  // Close mobile drawer if viewport resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep active mobile tab scrolled into view in the horizontal quick-strip
  useEffect(() => {
    const container = mobileStripRef.current;
    if (!container) return;
    const activeEl = container.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab]);

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="rm-site-header">
      {/* Primary Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 lg:gap-6 min-h-[60px] lg:min-h-[64px] py-2">
        {/* Zone 1: Brand lockup with RM mono mark */}
        <a
          href="#calculator"
          onClick={(e) => {
            e.preventDefault();
            handleSelectTab('calculator');
          }}
          className="rm-brand whitespace-nowrap shrink-0"
        >
          <span className="rm-mono-mark" aria-hidden="true">
            RM
          </span>
          <span>
            Maniq <span className="text-[#A9B7BF] font-light mx-0.5">|</span>{' '}
            <span className="accent">Compare</span>
          </span>
        </a>

        {/* Zone 2: Desktop Navigation links (visible on lg: 1024px and up) */}
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-4 xl:gap-6 overflow-x-auto no-scrollbar"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
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

        {/* Zone 3: Primary Action + Mobile/Tablet Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenExport}
            className="xh-btn primary whitespace-nowrap shrink-0 !px-3 !py-1.5 sm:!px-3.5 sm:!py-2"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </button>

          {/* Hamburger / Drawer Toggle for Small & Medium Screens (< 1024px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden xh-btn !px-2.5 !py-1.5 sm:!py-2 text-[#EEF3F1]"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-[#5FD3BF]" />
            ) : (
              <Menu className="w-4 h-4 text-[#5FD3BF]" />
            )}
            <span className="text-xs font-mono hidden xs:inline">Menu</span>
          </button>
        </div>
      </div>

      {/* Small/Medium Screen Full-Width Scrollable Navigation Strip (< 1024px) */}
      <div
        ref={mobileStripRef}
        aria-label="Mobile quick navigation"
        className="lg:hidden border-t border-[#3E6E86]/30 bg-[#0A1826]/95 px-4 sm:px-6 overflow-x-auto no-scrollbar flex items-center gap-4"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-active={isActive}
              onClick={() => handleSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`rm-navlink !py-2.5 !text-xs whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'rm-navlink-active' : ''
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Collapsible Mobile/Tablet Drawer when Menu button is toggled */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="lg:hidden border-t border-[#3E6E86]/40 bg-[#081420] px-4 sm:px-6 py-4 shadow-2xl"
        >
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#5FD3BF] mb-2.5">
            Select Analytical Workspace
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center justify-between text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#102236] border-[#5FD3BF] text-[#EEF3F1]'
                      : 'bg-[#0D1C2D]/70 border-[#3E6E86]/30 text-[#C9D3D9] hover:border-[#3E6E86] hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-2">
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="text-[10px] font-mono text-[#EBC385] uppercase">
                          · Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#A9B7BF] mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#5FD3BF]' : 'text-[#7F909A]'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
