import React, { useState, useEffect } from 'react';
import { AssetRecord, AppView } from './types';
import { saveRecords, loadRecords } from './services/storageService';
import Dashboard from './components/Dashboard';
import RecordTable from './components/TransactionList';
import ImportView from './components/ImportView';
import AIAssistant from './components/AIAssistant';
import { LayoutDashboard, Table2, Upload, Bot, Wallet, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [records, setRecords] = useState<AssetRecord[]>([]);
  const [assetKeys, setAssetKeys] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loaded = loadRecords();
    setRecords(loaded);
    
    if (loaded.length > 0) {
      const allKeys = new Set<string>();
      loaded.forEach(r => Object.keys(r.assets).forEach(k => allKeys.add(k)));
      setAssetKeys(Array.from(allKeys));
    }
  }, []);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const recalculateGains = (data: AssetRecord[]): AssetRecord[] => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.map((record, index) => {
      if (index === 0) return { ...record, gain: 0 };
      const prev = sorted[index - 1];
      const newGain = record.total - prev.total;
      return { ...record, gain: newGain };
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return recalculateGains(filtered);
    });
  };

  const handleAddRecord = (record: AssetRecord) => {
    setRecords(prev => {
      const updated = [...prev, record];
      return recalculateGains(updated);
    });
    const newKeys = Object.keys(record.assets);
    setAssetKeys(prev => Array.from(new Set([...prev, ...newKeys])));
  };

  const handleUpdateRecord = (updated: AssetRecord) => {
    setRecords(prev => {
      const list = prev.map(r => r.id === updated.id ? updated : r);
      return recalculateGains(list);
    });
    const newKeys = Object.keys(updated.assets);
    setAssetKeys(prev => Array.from(new Set([...prev, ...newKeys])));
  };

  const handleAddAssetKey = (key: string) => {
    setAssetKeys(prev => {
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  };

  const handleDeleteAssetKey = (keyToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete the column "${keyToDelete}"? This will remove "${keyToDelete}" data from ALL records.`)) {
      return;
    }

    setAssetKeys(prev => prev.filter(k => k !== keyToDelete));
    
    setRecords(prev => {
      const updatedRecords = prev.map(r => {
        const newAssets = { ...r.assets };
        delete newAssets[keyToDelete];
        const newTotal = Object.values(newAssets).reduce((sum, val) => sum + val, 0);
        return { ...r, assets: newAssets, total: newTotal };
      });
      return recalculateGains(updatedRecords);
    });
  };

  const handleImport = (newRecords: AssetRecord[], detectedKeys: string[]) => {
    setRecords(prev => {
      const merged = [...prev, ...newRecords];
      return recalculateGains(merged);
    });
    setAssetKeys(prev => Array.from(new Set([...prev, ...detectedKeys])));
    setCurrentView(AppView.DASHBOARD);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const NavItem = ({ view, icon, label }: { view: AppView, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => handleViewChange(view)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left mb-1 ${
        currentView === view 
          ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <Wallet size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">NetWorth AI</h1>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem view={AppView.DASHBOARD} icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem view={AppView.RECORDS} icon={<Table2 size={20} />} label="Records Table" />
          <NavItem view={AppView.IMPORT} icon={<Upload size={20} />} label="Import Excel" />
          <NavItem view={AppView.AI_INSIGHTS} icon={<Bot size={20} />} label="AI Analyst" />
        </nav>

        <div className="p-6 border-t border-gray-100">
          {records.length > 0 && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white shadow-lg">
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Latest Net Worth</p>
              <h3 className="text-2xl font-bold truncate">
                ${records[records.length - 1].total.toLocaleString()}
              </h3>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 flex items-center justify-between p-4 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
               <Wallet size={18} />
            </div>
            <h1 className="font-bold text-lg text-gray-900">NetWorth AI</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Main Scrollable View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {currentView === AppView.DASHBOARD && 'Financial Overview'}
                {currentView === AppView.RECORDS && 'Monthly Records'}
                {currentView === AppView.IMPORT && 'Import Data'}
                {currentView === AppView.AI_INSIGHTS && 'AI Financial Analyst'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {currentView === AppView.DASHBOARD && 'Visualize your asset growth and income trends.'}
                {currentView === AppView.RECORDS && 'View, edit, or add manual monthly data.'}
                {currentView === AppView.IMPORT && 'Append data from your Excel sheet.'}
                {currentView === AppView.AI_INSIGHTS && 'Get insights about your portfolio and income.'}
              </p>
            </div>

            {currentView === AppView.DASHBOARD && <Dashboard records={records} assetKeys={assetKeys} />}
            {currentView === AppView.RECORDS && (
              <RecordTable 
                records={records} 
                assetKeys={assetKeys}
                onDelete={handleDeleteRecord}
                onAdd={handleAddRecord}
                onUpdate={handleUpdateRecord}
                onAddKey={handleAddAssetKey}
                onDeleteKey={handleDeleteAssetKey}
              />
            )}
            {currentView === AppView.IMPORT && <ImportView onImport={handleImport} />}
            {currentView === AppView.AI_INSIGHTS && <AIAssistant records={records} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
