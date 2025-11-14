
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trade, TradeDirection, FilterState, BackupData, Audit, Strategy, Settings } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeModal from './components/TradeModal';
import { calculateMetrics, calculateCurrentLosingTradeStreak } from './utils/tradeCalculations';
import GoogleSheetImportModal from './components/GoogleSheetImportModal';
import TradeFilters from './components/TradeFilters';
import SyncModal from './components/SyncModal';
import ConfirmationModal from './components/ConfirmationModal';
import TabNavigation from './components/TabNavigation';
import AiAudit from './components/AiAudit';
import { auditTradesWithGemini } from './services/geminiService';
import FilteredMetricsSummary from './components/FilteredMetricsSummary';
import LiveTrading from './components/LiveTrading';
import SettingsModal from './components/SettingsModal';


const DEFAULT_SETTINGS: Settings = {
  auditRemindersEnabled: true,
  auditMilestoneFrequency: 10,
};


const App: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    asset: '',
    pnlOutcome: 'all',
    tradeId: '',
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tradeList' | 'aiAudit' | 'liveTrading'>('dashboard');
  
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
  const [dismissedStreakAuditUntil, setDismissedStreakAuditUntil] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'id', direction: 'descending' });
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;


  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    onDismiss: undefined as (() => void) | undefined,
    confirmButtonText: 'Confirm',
    confirmButtonClassName: 'bg-red hover:opacity-80',
    dismissButtonText: undefined as string | undefined,
  });
  
  const prevTradesCountRef = useRef<number | undefined>(undefined);


  useEffect(() => {
    try {
      const savedTrades = localStorage.getItem('cryptoTrades');
      if (savedTrades) {
        const parsedData = JSON.parse(savedTrades);
        if (Array.isArray(parsedData)) {
            const filteredData = parsedData.filter(t => t && t.date);
            filteredData.sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const tradesWithDates = filteredData.map((t: any, index: number) => ({
                ...t,
                id: index + 1,
                date: new Date(t.date),
                status: t.status || 'closed', 
            }));
            setTrades(tradesWithDates as Trade[]);
        }
      }
      
      const savedCapital = localStorage.getItem('initialCapital');
      if (savedCapital) {
        setInitialCapital(parseFloat(savedCapital));
      }
      
      const savedAudits = localStorage.getItem('cryptoAudits');
      if (savedAudits) {
          const parsedData = JSON.parse(savedAudits);
          if (Array.isArray(parsedData)) {
            setAudits(parsedData);
          }
      }
      
      const savedStrategies = localStorage.getItem('tradingStrategies');
       if (savedStrategies) {
        setStrategies(JSON.parse(savedStrategies));
      }

      const savedActiveStrategyId = localStorage.getItem('activeStrategyId');
      if (savedActiveStrategyId) {
        setActiveStrategyId(savedActiveStrategyId);
      }
      
      const dismissedUntil = localStorage.getItem('dismissedStreakAuditUntil');
      if (dismissedUntil) {
        setDismissedStreakAuditUntil(parseInt(dismissedUntil, 10));
      }
      
      const savedSettings = localStorage.getItem('tradingJournalSettings');
      if (savedSettings) {
          const loadedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
          setSettings(loadedSettings);
      }


    } catch (error) {
      console.error("Failed to load or parse data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cryptoTrades', JSON.stringify(trades));
    } catch (error) {
      console.error("Failed to save trades to localStorage", error);
    }
  }, [trades]);

  useEffect(() => {
    try {
      localStorage.setItem('initialCapital', initialCapital.toString());
    } catch (error) {
      console.error("Failed to save initial capital to localStorage", error);
    }
  }, [initialCapital]);
  
  useEffect(() => {
    try {
      localStorage.setItem('cryptoAudits', JSON.stringify(audits));
    } catch (error) {
      console.error("Failed to save audits to localStorage", error);
    }
  }, [audits]);
  
  useEffect(() => {
    try {
        localStorage.setItem('tradingStrategies', JSON.stringify(strategies));
    } catch (error) {
        console.error("Failed to save strategies to localStorage", error);
    }
  }, [strategies]);

  useEffect(() => {
      try {
          if (activeStrategyId) {
              localStorage.setItem('activeStrategyId', activeStrategyId);
          } else {
              localStorage.removeItem('activeStrategyId');
          }
      } catch (error) {
          console.error("Failed to save active strategy ID to localStorage", error);
      }
  }, [activeStrategyId]);

  useEffect(() => {
    if (dismissedStreakAuditUntil !== null) {
        localStorage.setItem('dismissedStreakAuditUntil', dismissedStreakAuditUntil.toString());
    } else {
        localStorage.removeItem('dismissedStreakAuditUntil');
    }
  }, [dismissedStreakAuditUntil]);
  
  useEffect(() => {
      try {
          localStorage.setItem('tradingJournalSettings', JSON.stringify(settings));
      } catch (error) {
          console.error("Failed to save settings to localStorage", error);
      }
  }, [settings]);
  
  const closeConfirmation = useCallback(() => {
    setConfirmationState(prev => ({...prev, isOpen: false, onDismiss: undefined}));
  }, []);

  const promptConfirmation = useCallback(({
    title,
    message,
    onConfirm,
    onCancel,
    onDismiss,
    confirmButtonText,
    confirmButtonClassName,
    dismissButtonText,
  }: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    onDismiss?: () => void;
    confirmButtonText: string;
    confirmButtonClassName?: string;
    dismissButtonText?: string;
  }) => {
    setConfirmationState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
            onConfirm();
            closeConfirmation();
        },
        onCancel: () => {
            if (onCancel) onCancel();
            closeConfirmation();
        },
        onDismiss: onDismiss ? () => {
            onDismiss();
            closeConfirmation();
        } : undefined,
        confirmButtonText: confirmButtonText || 'Confirm',
        confirmButtonClassName: confirmButtonClassName || 'bg-primary hover:bg-primary_hover',
        dismissButtonText: dismissButtonText,
    });
  }, [closeConfirmation]);


  useEffect(() => {
    if (!settings.auditRemindersEnabled) return;

    const prevCount = prevTradesCountRef.current;
    const currentCount = trades.length;
    prevTradesCountRef.current = currentCount;

    if (dismissedStreakAuditUntil !== null && currentCount > dismissedStreakAuditUntil) {
        setDismissedStreakAuditUntil(null);
    }

    if (prevCount === undefined || currentCount <= prevCount) {
        return;
    }

    const losingTradeStreak = calculateCurrentLosingTradeStreak(trades);
    if (losingTradeStreak >= 3) {
        if (dismissedStreakAuditUntil !== null && currentCount <= dismissedStreakAuditUntil) {
            return; 
        }

        promptConfirmation({
            title: 'AI Audit Suggestion',
            message: `You've had ${losingTradeStreak} consecutive losing trades. This could be a good time to run an audit to identify patterns. Would you like to go to the AI Audit tab?`,
            onConfirm: () => setActiveTab('aiAudit'),
            confirmButtonText: 'Yes, Go to Audit',
            confirmButtonClassName: 'bg-primary hover:bg-primary_hover',
            onDismiss: () => {
                setDismissedStreakAuditUntil(currentCount + 10);
            },
            dismissButtonText: 'Dismiss (10 trades)',
        });
        return;
    }
    
    const milestoneFrequency = settings.auditMilestoneFrequency;
    if (milestoneFrequency > 0 && currentCount > 0 && currentCount % milestoneFrequency === 0) {
        promptConfirmation({
            title: 'AI Audit Suggestion',
            message: `You've just logged your ${currentCount}th trade. This is a great time to analyze your last ${milestoneFrequency} trades. Would you like to go to the AI Audit tab?`,
            onConfirm: () => setActiveTab('aiAudit'),
            confirmButtonText: 'Yes, Go to Audit',
            confirmButtonClassName: 'bg-primary hover:bg-primary_hover',
        });
    }
  }, [trades, promptConfirmation, dismissedStreakAuditUntil, settings]);


  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const resetFilters = () => {
    setCurrentPage(1);
    setFilters({
      startDate: '',
      endDate: '',
      asset: '',
      pnlOutcome: 'all',
      tradeId: '',
    });
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
        const isAsc = prevConfig.key === key && prevConfig.direction === 'ascending';
        return { key, direction: isAsc ? 'descending' : 'ascending' };
    });
  };

  const filteredTrades = useMemo(() => {
    let filtered = [...trades];
    const idFilter = filters.tradeId.trim();

    if (idFilter) {
      let startId: number | undefined;
      let endId: number | undefined;

      if (idFilter.includes('-')) {
        const parts = idFilter.split('-');
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          startId = start;
          endId = end;
        }
      } else {
        const singleId = parseInt(idFilter, 10);
        if (!isNaN(singleId)) {
          startId = singleId;
          endId = singleId;
        }
      }

      if (startId !== undefined && endId !== undefined) {
        filtered = trades.filter(trade => trade.id >= startId! && trade.id <= endId!);
      } else {
        filtered = []; // Return empty if format is invalid
      }
    } else {
        filtered = trades.filter(trade => {
            const { startDate, endDate, asset, pnlOutcome } = filters;
            const tradeDate = trade.date;
            
            if (startDate) {
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                if (tradeDate < start) return false;
            }
            
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                if (tradeDate > end) return false;
            }

            if (asset && !trade.asset.toLowerCase().includes(asset.toLowerCase())) {
                return false;
            }

            if (pnlOutcome === 'win' && (trade.pnl === undefined || trade.pnl <= 0)) {
                return false;
            }
            
            if (pnlOutcome === 'loss' && (trade.pnl === undefined || trade.pnl > 0)) {
                return false;
            }

            return true;
        });
    }

    if (sortConfig.key) {
        filtered.sort((a, b) => {
            const key = sortConfig.key as keyof Trade;
            
            const getVal = (item: Trade, k: string) => {
                if (k === 'pnl') return item.pnl ?? 0;
                return item[k as keyof Trade];
            };

            const aValue = getVal(a, key);
            const bValue = getVal(b, key);

            let comparison = 0;
            
            if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                 if (key === 'leverage') {
                    const numA = parseInt(aValue.replace('x', '')) || 0;
                    const numB = parseInt(bValue.replace('x', '')) || 0;
                    comparison = numA - numB;
                } else {
                    comparison = aValue.localeCompare(bValue);
                }
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else {
                const valA = aValue ?? (typeof aValue === 'number' ? -Infinity : '');
                const valB = bValue ?? (typeof bValue === 'number' ? -Infinity : '');
                if (valA < valB) comparison = -1;
                else if (valA > valB) comparison = 1;
            }

            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }
    
    return filtered;

  }, [trades, filters, sortConfig]);

  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTrades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTrades, currentPage]);

  const totalPages = useMemo(() => {
      return Math.ceil(filteredTrades.length / ITEMS_PER_PAGE);
  }, [filteredTrades]);

  const filteredTradesMetrics = useMemo(() => calculateMetrics(filteredTrades, 0), [filteredTrades]);

  const isFilterActive = useMemo(() => {
      return filters.startDate !== '' || filters.endDate !== '' || filters.asset !== '' || filters.pnlOutcome !== 'all' || filters.tradeId !== '';
  }, [filters]);

  const getNextId = (currentTrades: Trade[]): number => {
    if (currentTrades.length === 0) return 1;
    return Math.max(...currentTrades.map(t => t.id)) + 1;
  };

  const handleOpenTrade = (trade: Omit<Trade, 'id' | 'status'>) => {
    setTrades(prev => {
        const nextId = getNextId(prev);
        const newTrade: Trade = { ...trade, id: nextId, status: 'open' };
        const sorted = [...prev, newTrade].sort((a, b) => a.date.getTime() - b.date.getTime());
        return sorted.map((t, index) => ({...t, id: index + 1}));
    });
  };

  const handleAddCompleteTrade = (trade: Omit<Trade, 'id' | 'status'>) => {
    setTrades(prev => {
        const nextId = getNextId(prev);
        const { entryPrice, exitPrice, size, direction } = trade;
        let pnl = 0;
        if (exitPrice) {
            if (direction === TradeDirection.Long) {
                pnl = (exitPrice - entryPrice) * size;
            } else {
                pnl = (entryPrice - exitPrice) * size;
            }
        }
        
        const newTrade: Trade = { ...trade, id: nextId, status: 'closed', pnl };
        const sorted = [...prev, newTrade].sort((a, b) => a.date.getTime() - b.date.getTime());
        return sorted.map((t, index) => ({...t, id: index + 1}));
    });
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    setTrades(prev => {
        const updated = prev.map(t => t.id === updatedTrade.id ? updatedTrade : t);
        const sorted = updated.sort((a, b) => a.date.getTime() - b.date.getTime());
        return sorted.map((t, index) => ({...t, id: index + 1}));
    });
  };
  
  const handleConfirmDelete = (id: number) => {
    setTrades(prev => {
      const remainingTrades = prev.filter(trade => trade.id !== id);
      remainingTrades.sort((a, b) => a.date.getTime() - b.date.getTime());
      return remainingTrades.map((trade, index) => ({
        ...trade,
        id: index + 1,
      }));
    });
  };

  const handlePromptDelete = (id: number) => {
    promptConfirmation({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to permanently delete this trade? This action cannot be undone.',
      onConfirm: () => handleConfirmDelete(id),
      confirmButtonText: 'Delete Trade',
      confirmButtonClassName: 'bg-red hover:opacity-80',
    });
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                alert("Error reading file.");
                return;
            }
            const data: BackupData = JSON.parse(result);
            
            const isValidBackup = (d: any): d is BackupData => {
              return Array.isArray(d.trades) && typeof d.initialCapital === 'number' && Array.isArray(d.strategies) && typeof d.timestamp === 'string';
            }

            if (!isValidBackup(data)) {
                alert("Invalid backup file format. Missing required fields.");
                return;
            }

            promptConfirmation({
                title: 'Confirm Restore',
                message: `Are you sure you want to restore from this backup created on ${new Date(data.timestamp).toLocaleString()}? All current data will be overwritten.`,
                onConfirm: () => {
                    const restoredTrades: Trade[] = data.trades.map((t, index: number) => ({
                        ...t,
                        id: index + 1,
                        date: new Date(t.date),
                    })).sort((a,b) => a.date.getTime() - b.date.getTime())
                    .map((t, index) => ({ ...t, id: index + 1 }));

                    setTrades(restoredTrades);
                    setInitialCapital(data.initialCapital);
                    setStrategies(data.strategies || []);
                    setActiveStrategyId(data.activeStrategyId || null);
                    setIsSyncModalOpen(false);
                    alert("Data restored successfully.");
                },
                confirmButtonText: 'Restore',
                confirmButtonClassName: 'bg-primary hover:bg-primary_hover',
            });
        } catch (e) {
            console.error("Restore error:", e);
            alert("Failed to parse backup file. It may be corrupted.");
        }
    };
    reader.readAsText(file);
  };
  
  const handleOpenModal = (trade: Trade | null = null) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTrade(null);
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    setIsSettingsModalOpen(false);
  };
  
  const handleImportFromGoogleSheet = (newTrades: Omit<Trade, 'id'>[]) => {
    if (newTrades.length > 0) {
      setTrades(prev => {
        const combined = [...prev, ...newTrades];
        const sorted = combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return sorted.map((t, index) => ({ ...t, id: index + 1, date: new Date(t.date), status: 'closed' }));
      });
      alert(`Successfully imported ${newTrades.length} trades.`);
    }
  };

  const activeStrategy = useMemo(() => {
      return strategies.find(s => s.id === activeStrategyId) || null;
  }, [strategies, activeStrategyId]);

  const handleRunAudit = async (
    params: Omit<Audit['parameters'], 'strategyName'>,
    tradesToAudit: Trade[]
  ): Promise<void> => {
      const result = await auditTradesWithGemini(tradesToAudit, activeStrategy || undefined);
      const newAudit: Audit = {
          id: new Date().toISOString(),
          date: new Date().toISOString(),
          parameters: {
              ...params,
              strategyName: activeStrategy?.name || 'Default'
          },
          result: result,
      };
      setAudits(prev => [newAudit, ...prev]);
  };
  
  const handleSaveStrategy = (strategy: Strategy) => {
      setStrategies(prev => {
          const exists = prev.some(s => s.id === strategy.id);
          if (exists) {
              return prev.map(s => s.id === strategy.id ? strategy : s);
          }
          return [...prev, strategy];
      });
      setActiveStrategyId(strategy.id);
  };

  const handleDeleteStrategy = (strategyId: string) => {
      promptConfirmation({
          title: 'Delete Strategy',
          message: 'Are you sure you want to permanently delete this strategy?',
          onConfirm: () => {
              setStrategies(prev => prev.filter(s => s.id !== strategyId));
              if (activeStrategyId === strategyId) {
                  setActiveStrategyId(null);
              }
          },
          confirmButtonText: 'Delete',
          confirmButtonClassName: 'bg-red hover:opacity-80',
      });
  };
  
  const handleDeleteAllData = () => {
    setTrades([]);
    setAudits([]);
    setStrategies([]);
    setInitialCapital(0);
    setActiveStrategyId(null);
    localStorage.removeItem('cryptoTrades');
    localStorage.removeItem('cryptoAudits');
    localStorage.removeItem('tradingStrategies');
    localStorage.removeItem('initialCapital');
    localStorage.removeItem('activeStrategyId');
    localStorage.removeItem('dismissedStreakAuditUntil');
    setIsSyncModalOpen(false);
    alert('All records have been deleted.');
  };

  const uniqueAssets = useMemo(() => {
    const assets = new Set(trades.map(t => t.asset.trim()).filter(Boolean));
    return Array.from(assets).sort();
  }, [trades]);

  const uniqueLeverages = useMemo(() => {
    const leverages = new Set(trades.flatMap(t => {
      const trimmed = t.leverage?.trim();
      return trimmed ? [trimmed] : [];
    }));
    // Fix: Explicitly type the sort parameters `a` and `b` as strings to resolve
    // type inference issues where they were being treated as `unknown`.
    return Array.from(leverages).sort((a: string, b: string) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.localeCompare(b);
    });
  }, [trades]);

  const allTradesMetrics = useMemo(() => calculateMetrics(trades, initialCapital), [trades, initialCapital]);

  return (
    <div className="min-h-screen bg-background text-text_primary">
      <div className="container mx-auto p-4 md:p-8">
        <Header 
          onAddTrade={() => handleOpenModal()} 
          onImportFromGoogleSheet={() => setIsGoogleSheetModalOpen(true)}
          onSync={() => setIsSyncModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="mt-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              metrics={allTradesMetrics}
              initialCapital={initialCapital}
              onInitialCapitalChange={setInitialCapital}
            />
          )}
          {activeTab === 'tradeList' && (
            <>
              <TradeFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
                tradeCount={filteredTrades.length}
                totalTradeCount={trades.length}
                uniqueAssets={uniqueAssets}
              />
              {isFilterActive && (
                <FilteredMetricsSummary
                  totalPnl={filteredTradesMetrics.totalPnl}
                  winRate={filteredTradesMetrics.winRate}
                  profitFactor={filteredTradesMetrics.profitFactor}
                />
              )}
              <TradeList 
                trades={paginatedTrades} 
                onEdit={handleOpenModal} 
                onDelete={handlePromptDelete}
                onUpdateTrade={handleUpdateTrade}
                onSort={handleSort}
                sortConfig={sortConfig}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalTradesCount={trades.length}
                totalFilteredCount={filteredTrades.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          )}
          {activeTab === 'aiAudit' && (
             <AiAudit 
                allTrades={trades}
                pastAudits={audits}
                onRunAudit={handleRunAudit}
                activeStrategy={activeStrategy}
             />
          )}
          {activeTab === 'liveTrading' && (
             <LiveTrading 
                strategies={strategies}
                activeStrategyId={activeStrategyId}
                onStrategyChange={setActiveStrategyId}
                onSaveStrategy={handleSaveStrategy}
                onDeleteStrategy={handleDeleteStrategy}
                onOpenTrade={handleOpenTrade}
             />
          )}
        </main>
      </div>
      {isModalOpen && (
        <TradeModal 
          onClose={handleCloseModal} 
          onOpenTrade={handleOpenTrade}
          onAddCompleteTrade={handleAddCompleteTrade}
          onUpdateTrade={handleUpdateTrade}
          existingTrade={editingTrade}
          uniqueAssets={uniqueAssets}
          uniqueLeverages={uniqueLeverages}
          onPromptConfirmation={promptConfirmation}
        />
      )}
      {isGoogleSheetModalOpen && (
        <GoogleSheetImportModal 
          onClose={() => setIsGoogleSheetModalOpen(false)}
          onImport={handleImportFromGoogleSheet}
        />
      )}
      {isSyncModalOpen && (
        <SyncModal 
          onClose={() => setIsSyncModalOpen(false)}
          trades={trades}
          initialCapital={initialCapital}
          onRestore={handleRestore}
          strategies={strategies}
          activeStrategyId={activeStrategyId}
          onDeleteAll={handleDeleteAllData}
          onPromptConfirmation={promptConfirmation}
        />
      )}
      {isSettingsModalOpen && (
        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onSave={handleSaveSettings}
            currentSettings={settings}
        />
      )}
      {confirmationState.isOpen && (
        <ConfirmationModal
            isOpen={confirmationState.isOpen}
            onClose={confirmationState.onCancel}
            onConfirm={confirmationState.onConfirm}
            onDismiss={confirmationState.onDismiss}
            title={confirmationState.title}
            message={confirmationState.message}
            confirmButtonText={confirmationState.confirmButtonText}
            confirmButtonClassName={confirmationState.confirmButtonClassName}
            dismissButtonText={confirmationState.dismissButtonText}
        />
      )}
    </div>
  );
};

export default App;
