
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardMetrics } from '../types';
import { WalletIcon, TrendingUpIcon, ActivityIcon, EditIcon } from './Icons';

interface DashboardProps {
  metrics: DashboardMetrics;
  initialCapital: number;
  onInitialCapitalChange: (value: number) => void;
  balanceAdjustment: number;
  onBalanceAdjustmentChange: (value: number) => void;
}

const CardWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-surface rounded-2xl border border-white/5 p-5 shadow-lg flex flex-col ${className}`}>
    {children}
  </div>
);

const CombinedBalanceCard: React.FC<{ 
    balance: number; 
    tradePnl: number;
    initialCapital: number;
    balanceAdjustment: number;
    onBalanceChange: (newBalance: number) => void; 
    onInitialCapitalChange: (newCapital: number) => void;
}> = ({ balance, tradePnl, initialCapital, balanceAdjustment, onBalanceChange, onInitialCapitalChange }) => {
    const [editingField, setEditingField] = useState<'balance' | 'initial' | null>(null);
    const [inputValue, setInputValue] = useState('');
    
    const adjustedPnl = tradePnl + balanceAdjustment;
    const roiPercentage = initialCapital > 0 ? (adjustedPnl / initialCapital) * 100 : 0;

    useEffect(() => {
        if (editingField === 'balance') setInputValue(balance.toFixed(2));
        if (editingField === 'initial') setInputValue(initialCapital.toFixed(2));
    }, [editingField, balance, initialCapital]);

    const handleBlur = () => {
        const num = parseFloat(inputValue);
        if (!isNaN(num)) {
             if (editingField === 'balance') {
                 onBalanceChange(num);
             } else if (editingField === 'initial') {
                 onInitialCapitalChange(num);
             }
        }
        setEditingField(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <CardWrapper className="h-full relative overflow-hidden justify-between">
             {/* Decorative background glow */}
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>

             <div>
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-text_secondary">
                        <WalletIcon />
                        <span className="font-semibold text-sm uppercase tracking-wide">Total Balance</span>
                    </div>
                    {editingField !== 'balance' && (
                        <button 
                            onClick={() => setEditingField('balance')} 
                            className="text-text_secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-surface_hover"
                            title="Edit Balance"
                        >
                            <EditIcon />
                        </button>
                    )}
                 </div>
                 
                 <div className="relative h-16 flex items-center">
                    {editingField === 'balance' ? (
                        <div className="flex items-center w-full animate-fadeIn">
                            <span className="text-4xl font-bold text-text_primary mr-2">$</span>
                            <input
                                autoFocus
                                type="number"
                                className="bg-transparent text-4xl font-bold text-text_primary w-full focus:outline-none border-b-2 border-primary"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    ) : (
                        <p 
                            onClick={() => setEditingField('balance')}
                            className="text-5xl font-bold text-text_primary cursor-pointer hover:text-primary_hover transition-colors tracking-tight"
                        >
                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    )}
                 </div>
             </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
                {/* ROI Section */}
                <div>
                    <p className="text-xs font-medium text-text_secondary mb-1">Total PnL (ROI)</p>
                    <div className="flex flex-col">
                         <span className={`text-xl font-bold ${adjustedPnl >= 0 ? 'text-green' : 'text-red'}`}>
                            {roiPercentage > 0 ? '+' : ''}{roiPercentage.toFixed(2)}%
                        </span>
                        <span className="text-xs text-text_tertiary font-mono">
                            {adjustedPnl >= 0 ? '+' : ''}${adjustedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Initial Capital Section */}
                <div className="flex flex-col items-end justify-end">
                     <div className="flex items-center space-x-1 mb-1 group cursor-pointer" onClick={() => setEditingField('initial')}>
                        <p className="text-xs font-medium text-text_secondary group-hover:text-primary transition-colors">Initial Capital</p>
                     </div>
                     
                     {editingField === 'initial' ? (
                        <input
                            autoFocus
                            type="number"
                            className="bg-secondary rounded px-2 py-1 text-sm font-bold text-text_primary w-24 text-right focus:outline-none focus:ring-2 focus:ring-primary"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                        />
                     ) : (
                         <p 
                            onClick={() => setEditingField('initial')}
                            className="text-xl font-bold text-text_primary cursor-pointer hover:text-text_secondary transition-colors"
                        >
                            ${initialCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                     )}
                </div>
            </div>
        </CardWrapper>
    );
};

const StatCard: React.FC<{ 
    title: string; 
    icon?: React.ReactNode;
    children: React.ReactNode 
}> = ({ title, icon, children }) => (
    <CardWrapper className="justify-between">
        <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-text_secondary uppercase tracking-wider">{title}</p>
            {icon && <div className="text-text_secondary opacity-70">{icon}</div>}
        </div>
        <div className="flex-grow flex flex-col justify-end">
            {children}
        </div>
    </CardWrapper>
);

const ChartContainer: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <CardWrapper className="h-96">
        <h3 className="text-lg font-bold mb-6 text-text_primary flex items-center">
            <span className="w-1 h-5 bg-primary rounded-full mr-3"></span>
            {title}
        </h3>
        <div className="flex-grow w-full min-h-0">
            {children}
        </div>
    </CardWrapper>
);

const CurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-text_secondary text-xs mb-1">{label}</p>
          <p className="text-text_primary font-bold text-sm">
            {payload[0].value < 0 ? '-$' : '$'}{Math.abs(payload[0].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
};

const RoiTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-text_secondary text-xs mb-1">{label}</p>
          <p className={`font-bold text-sm ${payload[0].value >= 0 ? 'text-green' : 'text-red'}`}>
            {payload[0].value > 0 ? '+' : ''}{Number(payload[0].value).toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
};

const Dashboard: React.FC<DashboardProps> = ({ metrics, initialCapital, onInitialCapitalChange, balanceAdjustment, onBalanceAdjustmentChange }) => {
    const { totalPnl, winRate, lossRate, totalWins, totalLosses, profitFactor, totalTrades, maxWinStreakTrades, maxLossStreakTrades, currentStreak, chartData, equityChartData } = metrics;

    const currentBalance = initialCapital + totalPnl + balanceAdjustment;

    const handleBalanceChange = (newBalance: number) => {
        const newAdjustment = newBalance - (initialCapital + totalPnl);
        onBalanceAdjustmentChange(newAdjustment);
    };

    const adjustedEquityChartData = useMemo(() => {
        if (equityChartData.length <= 1) return equityChartData;
        return equityChartData.map((point, index) => {
            const progress = index / (equityChartData.length - 1);
            const adjustmentForPoint = balanceAdjustment * progress;
            return {
                ...point,
                equity: point.equity + adjustmentForPoint
            };
        });
    }, [equityChartData, balanceAdjustment]);

    const roiChartData = useMemo(() => {
        if (initialCapital <= 0) return [];
        
        if (chartData.length <= 1) {
             return chartData.map(point => ({
                ...point,
                roi: (point.pnl / initialCapital) * 100
            }));
        }

        return chartData.map((point, index) => {
             const progress = index / (chartData.length - 1);
             const adjustmentForPoint = balanceAdjustment * progress;
             const adjustedPnl = point.pnl + adjustmentForPoint;

            return {
                ...point,
                roi: (adjustedPnl / initialCapital) * 100
            };
        });
    }, [chartData, initialCapital, balanceAdjustment]);

    return (
        <div className="space-y-6 mb-12">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                
                {/* 1. Main Balance Card - Spans full width on mobile, 1 col on large */}
                <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1">
                    <CombinedBalanceCard 
                        balance={currentBalance} 
                        tradePnl={totalPnl}
                        initialCapital={initialCapital}
                        balanceAdjustment={balanceAdjustment}
                        onBalanceChange={handleBalanceChange}
                        onInitialCapitalChange={onInitialCapitalChange}
                    />
                </div>

                {/* 2. Performance Stats */}
                <StatCard title="Performance" icon={<TrendingUpIcon />}>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text_secondary mb-1">Win Rate</p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-3xl font-bold text-text_primary">{winRate.toFixed(0)}%</span>
                                <span className="text-xs text-text_tertiary">/ {lossRate.toFixed(0)}%</span>
                            </div>
                             <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden flex">
                                <div className="bg-green h-full" style={{ width: `${winRate}%` }}></div>
                                <div className="bg-red h-full" style={{ width: `${lossRate}%` }}></div>
                            </div>
                        </div>
                        <div>
                             <p className="text-xs text-text_secondary mb-1">Profit Factor</p>
                             <p className={`text-3xl font-bold ${profitFactor >= 1.5 ? 'text-green' : profitFactor >= 1 ? 'text-yellow-400' : 'text-red'}`}>
                                 {profitFactor.toFixed(2)}
                             </p>
                             <p className="text-xs text-text_tertiary mt-1">
                                 {totalWins}W - {totalLosses}L
                             </p>
                        </div>
                     </div>
                </StatCard>

                {/* 3. Activity & Streaks */}
                <StatCard title="Activity" icon={<ActivityIcon />}>
                     <div className="flex justify-between items-end">
                         <div>
                            <p className="text-4xl font-bold text-text_primary">{totalTrades}</p>
                            <p className="text-xs text-text_secondary mt-1">Total Trades</p>
                         </div>
                         <div className="text-right">
                             <div className="mb-2">
                                 <span className="text-xs text-text_secondary uppercase">Current Streak</span>
                                 <div className={`font-bold text-lg ${currentStreak.type === 'win' ? 'text-green' : currentStreak.type === 'loss' ? 'text-red' : 'text-text_primary'}`}>
                                     {currentStreak.count > 0 ? `${currentStreak.count} ${currentStreak.type === 'win' ? 'Wins' : 'Losses'}` : '—'}
                                 </div>
                             </div>
                             <div className="text-xs text-text_tertiary">
                                 Best: <span className="text-green">{maxWinStreakTrades}W</span> &bull; Worst: <span className="text-red">{maxLossStreakTrades}L</span>
                             </div>
                         </div>
                     </div>
                </StatCard>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Equity (Now First) */}
                <ChartContainer title="Account Equity">
                    {adjustedEquityChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={adjustedEquityChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#0a84ff" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#636366" 
                                tick={{fontSize: 10}} 
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis 
                                stroke="#636366" 
                                tickFormatter={(value) => `$${value}`} 
                                tick={{fontSize: 10}} 
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Tooltip content={<CurrencyTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                            <Area 
                                type="monotone" 
                                dataKey="equity" 
                                stroke="#0a84ff" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorEquity)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                     ) : (
                        <div className="flex items-center justify-center h-full text-text_tertiary bg-secondary/30 rounded-xl text-center px-6">
                            <p>Set starting capital and add trades to view equity curve</p>
                        </div>
                    )}
                </ChartContainer>

                {/* Cumulative ROI (Now Second and Percent-based) */}
                <ChartContainer title="Cumulative ROI (%)">
                    {roiChartData.length > 1 && initialCapital > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={roiChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#64d2ff" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#64d2ff" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#636366" 
                                tick={{fontSize: 10}} 
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis 
                                stroke="#636366" 
                                tickFormatter={(value) => `${value}%`} 
                                tick={{fontSize: 10}} 
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Tooltip content={<RoiTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                            <Area 
                                type="monotone" 
                                dataKey="roi" 
                                stroke="#64d2ff" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorRoi)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-text_tertiary bg-secondary/30 rounded-xl">
                            <p>{initialCapital <= 0 ? 'Set initial capital to view ROI' : 'Not enough data to display chart'}</p>
                        </div>
                    )}
                </ChartContainer>
            </div>
        </div>
    );
};

export default Dashboard;
