import React, { useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Car, 
  Key, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  RefreshCw, 
  Download, 
  Plus, 
  FileSpreadsheet,
  Clock,
  Sparkles,
  MessageSquare,
  CheckSquare,
  Share2
} from 'lucide-react';
import { ProjectInfo, ProcurementItem, MilestoneTask, AlertWarning, SyncConfig, NavigationTab, TodoItem } from '../types';
import { getTodayDisplayDate, getTodayDateString } from '../utils/date';

interface HeaderProps {
  projectInfo: ProjectInfo;
  procurementItems: ProcurementItem[];
  milestones: MilestoneTask[];
  alerts: AlertWarning[];
  syncConfig: SyncConfig;
  todos?: TodoItem[];
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenSyncModal: () => void;
  onOpenNewItemModal: () => void;
  onPrintReport: () => void;
  onOpenCalendarSyncModal?: () => void;
  onOpenDesignerCoordModal?: () => void;
  onOpenShareModal?: () => void;
  firebaseStatus?: 'connecting' | 'connected' | 'error' | 'syncing';
  lastSyncedTime?: string;
  onManualSyncFirebase?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectInfo,
  procurementItems,
  milestones,
  alerts,
  syncConfig,
  todos,
  activeTab,
  onTabChange,
  onOpenSyncModal,
  onOpenNewItemModal,
  onPrintReport,
  onOpenCalendarSyncModal,
  onOpenDesignerCoordModal,
  onOpenShareModal,
  firebaseStatus = 'connected',
  lastSyncedTime,
  onManualSyncFirebase,
}) => {
  // Calculations
  const totalBudget = procurementItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Placed or delivered cost
  const committedCost = procurementItems
    .filter((item) => item.status !== '詢價比價')
    .reduce((sum, item) => sum + item.subtotal, 0);
  
  const committedPercent = totalBudget > 0 ? Math.round((committedCost / totalBudget) * 100) : 0;

  // Milestone overall progress
  const avgMilestoneProgress = milestones.length > 0
    ? Math.round(milestones.reduce((acc, m) => acc + m.progress, 0) / milestones.length)
    : 0;

  const completedMilestones = milestones.filter((m) => m.status === '已完成').length;

  const criticalAlertsCount = alerts.filter((a) => a.level === 'critical').length;
  const warningAlertsCount = alerts.filter((a) => a.level === 'warning').length;

  const todayStr = getTodayDateString();
  const overdueCount = milestones.filter((m) => m.progress < 100 && m.endDate < todayStr).length;

  const pendingTodosCount = todos ? todos.filter((t) => !t.completed).length : 0;
  const urgentTodosCount = todos ? todos.filter((t) => !t.completed && t.isUrgent).length : 0;

  // Dynamically calculate today's progress focus based on actual milestone dates!
  const todayFocus = useMemo(() => {
    // Look for active milestones today or in-progress milestones
    const activeTasks = milestones.filter((m) => m.startDate <= todayStr && m.endDate >= todayStr);
    const inProgress = milestones.filter((m) => m.status === '進行中');
    const paint = milestones.find((m) => m.trade === '油漆工程');
    const target = inProgress[0] || activeTasks[0] || paint || milestones[0];

    if (!target) {
      return {
        title: '工程依計畫順利推進中',
        nextText: '下階段工項準備中',
      };
    }

    const sMD = target.startDate.slice(5).replace('-', '/');
    const eMD = target.endDate.slice(5).replace('-', '/');
    
    // Find next upcoming milestone
    const upcoming = milestones
      .filter((m) => m.startDate > target.endDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

    const nextText = upcoming
      ? `下階段關鍵：${upcoming.startDate.slice(5).replace('-', '/')} ${upcoming.name}`
      : '各工種依排程緊密銜接';

    return {
      title: `${target.name} (${sMD}-${eMD})`,
      nextText,
    };
  }, [milestones, todayStr]);

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 shadow-2xs print:hidden">
      {/* Top Banner / Project Info */}
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#EBF3F5] text-[#264653] border border-[#C5DCE2] shadow-2xs">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                    {projectInfo.name}
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#EAF6F4] text-[#2A9D8F] border border-[#BBE4DE]">
                    施工中 • 2026/09/07 - 11/25
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#E76F51]" />
                    {projectInfo.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-[#F4A261]" />
                    停車：{projectInfo.parkingInfo}
                  </span>
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-[#264653]" />
                    門禁：{projectInfo.securityInfo}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Firebase Live Cloud Sync Badge */}
            <div 
              onClick={onManualSyncFirebase || onOpenSyncModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-2xs transition cursor-pointer ${
                firebaseStatus === 'connected'
                  ? 'bg-[#EAF6F4] text-[#2A9D8F] border-[#BBE4DE] hover:bg-[#DCF2ED]'
                  : firebaseStatus === 'syncing'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : firebaseStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title={
                firebaseStatus === 'connected'
                  ? `Firebase Firestore 雲端資料庫連線中！最後同步：${lastSyncedTime || '即時'}。點擊可手動全量上傳備份。`
                  : firebaseStatus === 'syncing'
                  ? '正在同步資料至 Firebase 雲端...'
                  : 'Firebase 連線準備中'
              }
            >
              <span className={`w-2 h-2 rounded-full ${
                firebaseStatus === 'connected' 
                  ? 'bg-[#2A9D8F] animate-pulse' 
                  : firebaseStatus === 'syncing'
                  ? 'bg-amber-500 animate-spin'
                  : 'bg-slate-400'
              }`} />
              <span>
                {firebaseStatus === 'connected' 
                  ? `雲端已同步 (${lastSyncedTime ? lastSyncedTime.slice(0, 5) : '即時'})` 
                  : firebaseStatus === 'syncing'
                  ? '雲端同步中...'
                  : 'Firebase 連線中'}
              </span>
            </div>

            {/* 1. Calendar Sync & Overdue Alerts */}
            {onOpenCalendarSyncModal && (
              <button
                onClick={onOpenCalendarSyncModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-[#264653] border border-slate-200 shadow-2xs transition"
                title="同步當日工程至個人 Google 日曆與逾期催辦通知"
              >
                <Calendar className="w-3.5 h-3.5 text-[#264653]" />
                <span>行事曆同步 (逾期通知)</span>
                {overdueCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#E76F51] text-white animate-pulse" title={`${overdueCount} 項工程逾期未完工`}>
                    {overdueCount}
                  </span>
                )}
              </button>
            )}

            {/* 2. Designer Coordination & In-place Adjust */}
            {onOpenDesignerCoordModal && (
              <button
                onClick={onOpenDesignerCoordModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EAF6F4] hover:bg-[#D8EFEA] text-[#2A9D8F] border border-[#BBE4DE] shadow-2xs transition"
                title="直接輸入設計師現場溝通交辦事項，即刻同步至工項與 Google 試算表"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#2A9D8F]" />
                <span>設計師工項速調</span>
              </button>
            )}

            <button
              onClick={onOpenSyncModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FEF5EF] hover:bg-[#FDEBDD] text-[#D47026] border border-[#FCD8BE] shadow-2xs transition"
              title="設定 Google Sheets 自動同步與雲端資料庫"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncConfig.autoSync ? 'text-[#2A9D8F]' : 'text-slate-400'}`} />
              <span>雲端同步 (Google 試算表)</span>
              {syncConfig.autoSync && (
                <span className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-pulse" title="已啟用自動同步"></span>
              )}
            </button>

            <button
              onClick={onPrintReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
              title="列印或匯出 PDF 報表"
            >
              <Download className="w-3.5 h-3.5 text-[#264653]" />
              <span>匯出報表 / 列印</span>
            </button>

            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EAF6F4] hover:bg-[#D8EFEA] text-[#2A9D8F] border border-[#BBE4DE] shadow-2xs transition"
                title="取得免登入的獨立公開分享網址與手機 QR Code"
              >
                <Share2 className="w-3.5 h-3.5 text-[#2A9D8F]" />
                <span>分享獨立網頁</span>
              </button>
            )}

            <button
              onClick={onOpenNewItemModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#264653] hover:bg-[#1D353F] text-white shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增項目 / 節點</span>
            </button>
          </div>
        </div>

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5">
          {/* Card 1: Budget */}
          <div className="bg-white hover:bg-slate-50/80 rounded-xl p-3 border border-slate-200 shadow-2xs transition">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>設備採購預算總計</span>
              <DollarSign className="w-4 h-4 text-[#2A9D8F]" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-slate-900 font-mono">
                NT$ {totalBudget.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">含稅 (19項)</span>
            </div>
            <div className="mt-1.5">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>已下單/備料: NT$ {committedCost.toLocaleString()}</span>
                <span className="text-[#2A9D8F] font-bold">{committedPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                <div 
                  className="bg-[#2A9D8F] h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${committedPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Construction Progress */}
          <div className="bg-white hover:bg-slate-50/80 rounded-xl p-3 border border-slate-200 shadow-2xs transition">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>裝潢工程完工進度</span>
              <CheckCircle2 className="w-4 h-4 text-[#264653]" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-[#264653] font-mono">
                {avgMilestoneProgress}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                已完工 {completedMilestones} / {milestones.length} 節點
              </span>
            </div>
            <div className="mt-1.5">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>目標：11/25 總驗收</span>
                <span className="text-[#264653] font-bold">14 大工種</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                <div 
                  className="bg-[#264653] h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${avgMilestoneProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Today's Status & Critical Node */}
          <div className="bg-white hover:bg-slate-50/80 rounded-xl p-3 border border-slate-200 shadow-2xs transition">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>今日工程進度焦點 ({getTodayDisplayDate()})</span>
              <Clock className="w-4 h-4 text-[#2A9D8F]" />
            </div>
            <div className="mt-1">
              <div className="text-sm font-bold text-slate-800 truncate" title={todayFocus.title}>
                {todayFocus.title}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5" title={todayFocus.nextText}>
                {todayFocus.nextText}
              </p>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">系統櫃工廠備料中</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF5EF] text-[#D47026] font-bold text-[10px] border border-[#FCD8BE]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4A261]"></span>
                10/9 安裝
              </span>
            </div>
          </div>

          {/* Card 4: Early Warnings & Conflicts */}
          <div 
            onClick={() => onTabChange('alerts')}
            className="bg-white hover:bg-slate-50/80 rounded-xl p-3 border border-slate-200 shadow-2xs cursor-pointer hover:border-[#F8C8BD] transition group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="group-hover:text-[#E76F51] transition">即時工期與交期預警</span>
              <AlertTriangle className={`w-4 h-4 ${criticalAlertsCount > 0 ? 'text-[#E76F51] animate-pulse' : 'text-[#F4A261]'}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-[#E76F51] font-mono">
                {criticalAlertsCount + warningAlertsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                項待檢核 (高危 {criticalAlertsCount} / 警示 {warningAlertsCount})
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#D47026] font-medium">
              <span className="truncate">思科AP交期檢核、OA家具進場細清防護</span>
              <span className="underline group-hover:text-[#B5591A] shrink-0">查看 ➔</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Clean PM Pill Style matching reference image */}
        <div className="mt-3.5 pt-2 border-t border-slate-200">
          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-1.5 w-full">
            <button
              onClick={() => onTabChange('gantt')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs rounded-lg transition ${
                activeTab === 'gantt'
                  ? 'bg-[#264653] text-white shadow-xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="truncate">甘特圖 (Gantt)</span>
            </button>

            <button
              onClick={() => onTabChange('calendar')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs rounded-lg transition ${
                activeTab === 'calendar'
                  ? 'bg-[#264653] text-white shadow-xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-[#F4A261] shrink-0" />
              <span className="truncate">施工日曆</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                activeTab === 'calendar' ? 'bg-white/20 text-white' : 'bg-[#FDF8EC] text-[#9A741A] border border-[#F6E3B0]'
              }`}>
                NEW
              </span>
            </button>

            <button
              onClick={() => onTabChange('milestones')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs rounded-lg transition ${
                activeTab === 'milestones'
                  ? 'bg-[#264653] text-white shadow-xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2A9D8F]" />
              <span className="truncate">14大工種節點</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                activeTab === 'milestones' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {milestones.length}
              </span>
            </button>

            {/* TAB 4: 待辦查核 (重點關注) */}
            <button
              onClick={() => onTabChange('todos')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs rounded-lg transition ${
                activeTab === 'todos'
                  ? 'bg-[#E76F51] text-white shadow-xs font-bold'
                  : 'bg-[#FDF0ED] hover:bg-[#FAE3DE] text-[#E76F51] border border-[#F8C8BD]'
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0 text-[#E76F51]" />
              <span className="truncate">待辦查核 (重點)</span>
              {pendingTodosCount > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                  activeTab === 'todos' 
                    ? 'bg-white text-[#E76F51]' 
                    : urgentTodosCount > 0
                    ? 'bg-[#E76F51] text-white animate-pulse'
                    : 'bg-[#F8C8BD] text-[#B83E23]'
                }`} title={`${pendingTodosCount} 項待辦待確認`}>
                  {pendingTodosCount}
                </span>
              ) : (
                <span className="text-[10px] text-[#2A9D8F] font-bold shrink-0">✓</span>
              )}
            </button>

            <button
              onClick={() => onTabChange('procurement')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs rounded-lg transition ${
                activeTab === 'procurement'
                  ? 'bg-[#264653] text-white shadow-xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className="truncate">設備採購表</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                activeTab === 'procurement' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                19項
              </span>
            </button>

            <button
              onClick={() => onTabChange('alerts')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs rounded-lg transition ${
                activeTab === 'alerts'
                  ? 'bg-[#264653] text-white shadow-xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-[#F4A261] shrink-0" />
              <span className="truncate">預警與衝突</span>
              {criticalAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E76F51] text-white font-black animate-pulse shrink-0">
                  {criticalAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('vendors')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs rounded-lg transition ${
                activeTab === 'vendors'
                  ? 'bg-[#264653] text-white shadow-xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">廠商通訊錄</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
