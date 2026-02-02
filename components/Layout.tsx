import React from 'react';
import { Droplets, History, Info, HelpCircle, Settings, Home } from 'lucide-react';
import { COLORS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white dark:bg-slate-950 shadow-xl relative transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="bg-[#2962FF] p-2 rounded-xl shadow-sm">
            <Droplets size={24} color="white" />
          </div>
          <span className="font-poppins text-xl font-bold tracking-tight text-[#212529] dark:text-white">MilQ</span>
        </div>
        <button onClick={() => onNavigate('settings')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Settings size={22} className="text-[#6C757D] dark:text-slate-400" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
        {children}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center shadow-lg transition-colors">
        <NavButton active={activeTab === 'home'} icon={<Home size={22} />} label="Home" onClick={() => onNavigate('home')} />
        <NavButton active={activeTab === 'history'} icon={<History size={22} />} label="History" onClick={() => onNavigate('history')} />
        <NavButton active={activeTab === 'about' || activeTab === 'contact'} icon={<Info size={22} />} label="About" onClick={() => onNavigate('about')} />
        <NavButton active={activeTab === 'help'} icon={<HelpCircle size={22} />} label="Help" onClick={() => onNavigate('help')} />
      </nav>
    </div>
  );
};

const NavButton = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-200 ${active ? 'text-[#2962FF] scale-110' : 'text-[#6C757D] dark:text-slate-500 hover:text-[#2962FF]'}`}
  >
    {icon}
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

export default Layout;