import React, { useState, useMemo } from 'react';
import { MilestoneTask, TradeCategory, MilestoneStatus, DesignerChangeLog } from '../types';
import { getTodayDateString } from '../utils/date';
import { 
  MessageSquare, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  Save, 
  Copy, 
  Check, 
  X, 
  Layers, 
  Send, 
  History, 
  Phone,
  Flame,
  ArrowRight,
  Filter
} from 'lucide-react';

interface DesignerCoordinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestones: MilestoneTask[];
  onUpdateMilestone: (updated: MilestoneTask) => void;
  onAddMilestone: (newTask: MilestoneTask) => void;
  designerName?: string;
}

const TRADE_LIST: TradeCategory[] = [
  '保護工程',
  '拆除工程',
  '木工工程',
  '油漆工程',
  '水電工程',
  '燈具工程',
  '系統工程',
  '玻璃隔間工程',
  '辦公設備工程',
  '清潔工程',
  '窗簾工程',
  '投影機設備工程',
  '音響設備工程',
  '冷氣設備工程',
  '完工驗收',
];

const QUICK_COMMUNICATION_TEMPLATES = [
  { label: '📏 現場尺寸變更', text: '設計師現場丈量核對：尺寸配合現場調整，需通知工班變更施作規格。' },
  { label: '⚡ 插座弱電移位', text: '設計師指示：插座/網路孔位置移位，配合辦公桌與電視牆動線配置。' },
  { label: '🎨 板材選色定案', text: '設計師已確認板材規格與油漆色號，工班可依核准樣板進料施工。' },
  { label: '⏳ 配合前工種展延', text: '因現場前置工種作業尚未退場，設計師協調本工項順延進場。' },
  { label: '🛠️ 施工工法調整', text: '設計師交代工法變更：天花板封板方式調整，並加強吊筋結構。' },
  { label: '📋 驗收缺失改善', text: '設計師現場巡檢指出細部收邊待改善，安排收尾修補。' }
];

export const DesignerCoordinationModal: React.FC<DesignerCoordinationModalProps> = ({
  isOpen,
  onClose,
  milestones,
  onUpdateMilestone,
  onAddMilestone,
  designerName = '何設計師',
}) => {
  const todayStr = getTodayDateString();

  // Mode: 'adjust_existing' | 'add_new' | 'history'
  const [activeMode, setActiveMode] = useState<'adjust_existing' | 'add_new' | 'history'>('adjust_existing');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradeFilter, setSelectedTradeFilter] = useState<string>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Form Fields for Adjusting Existing Task
  const [designerInstruction, setDesignerInstruction] = useState('');
  const [categoryTag, setCategoryTag] = useState<'現場尺寸變更' | '追加工項' | '時程順延' | '材料選定' | '管委會協調' | '驗收交代'>('現場尺寸變更');
  const [daysToExtend, setDaysToExtend] = useState<number>(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [progressValue, setProgressValue] = useState<number | null>(null);
  const [statusValue, setStatusValue] = useState<MilestoneStatus | null>(null);
  const [isCritical, setIsCritical] = useState<boolean | null>(null);

  // Form Fields for Adding New Task
  const [newTrade, setNewTrade] = useState<TradeCategory>('木工工程');
  const [newName, setNewName] = useState('');
  const [newActionType, setNewActionType] = useState<any>('施工');
  const [newStartDate, setNewStartDate] = useState(todayStr);
  const [newEndDate, setNewEndDate] = useState(todayStr);
  const [newLocation, setNewLocation] = useState('');
  const [newContractorName, setNewContractorName] = useState('');
  const [newContractorPhone, setNewContractorPhone] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Success Feedback & Clipboard Copy
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);

  // Filtered milestones for quick selection
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (selectedTradeFilter !== 'all' && m.trade !== selectedTradeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.trade.toLowerCase().includes(q) ||
          (m.contractorName || '').toLowerCase().includes(q) ||
          (m.location || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [milestones, selectedTradeFilter, searchQuery]);

  // Current selected task object
  const currentTask = useMemo(() => {
    return milestones.find((m) => m.id === selectedTaskId) || null;
  }, [milestones, selectedTaskId]);

  // When selected task changes, initialize date/progress form values
  const handleSelectTask = (task: MilestoneTask) => {
    setSelectedTaskId(task.id);
    setCustomStartDate(task.startDate);
    setCustomEndDate(task.endDate);
    setProgressValue(task.progress);
    setStatusValue(task.status);
    setIsCritical(task.isCriticalPath || false);
    setDaysToExtend(0);
  };

  // Helper to extend end date by N days
  const handleExtendDays = (days: number) => {
    if (!currentTask) return;
    setDaysToExtend((prev) => prev + days);
    try {
      const baseEnd = new Date(currentTask.endDate);
      baseEnd.setDate(baseEnd.getDate() + (daysToExtend + days));
      const y = baseEnd.getFullYear();
      const m = String(baseEnd.getMonth() + 1).padStart(2, '0');
      const d = String(baseEnd.getDate()).padStart(2, '0');
      setCustomEndDate(`${y}-${m}-${d}`);
    } catch {
      // ignore
    }
  };

  // Submit adjustment to existing task
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask) {
      alert('請先選擇要調整的工項');
      return;
    }
    if (!designerInstruction.trim() && daysToExtend === 0 && progressValue === currentTask.progress) {
      alert('請輸入設計師溝通交辦內容或調整工期');
      return;
    }

    const timestamp = `${todayStr} ${new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })}`;
    const noteEntry = designerInstruction.trim() 
      ? `【設計師溝通 ${todayStr}】${designerInstruction.trim()}`
      : `【設計師時程調整 ${todayStr}】工期展延至 ${customEndDate}`;

    const newLog: DesignerChangeLog = {
      id: `log-${Date.now()}`,
      taskId: currentTask.id,
      taskName: currentTask.name,
      trade: currentTask.trade,
      timestamp,
      author: designerName,
      note: designerInstruction.trim() || `調整工期至 ${customEndDate}`,
      category: categoryTag,
      daysAdjusted: daysToExtend !== 0 ? daysToExtend : undefined,
      newStartDate: customStartDate !== currentTask.startDate ? customStartDate : undefined,
      newEndDate: customEndDate !== currentTask.endDate ? customEndDate : undefined,
      newProgress: progressValue !== null ? progressValue : undefined,
    };

    // Calculate final status
    let finalStatus: MilestoneStatus = statusValue || currentTask.status;
    const finalProgress = progressValue !== null ? progressValue : currentTask.progress;
    if (finalProgress === 100) {
      finalStatus = '已完成';
    } else if (finalProgress > 0 && finalStatus === '尚未開始') {
      finalStatus = '進行中';
    }

    // Combine existing designer notes with new entry
    const updatedDesignerNotes = currentTask.designerNotes 
      ? `${noteEntry}\n${currentTask.designerNotes}`
      : noteEntry;

    const updatedTask: MilestoneTask = {
      ...currentTask,
      startDate: customStartDate || currentTask.startDate,
      endDate: customEndDate || currentTask.endDate,
      progress: finalProgress,
      status: finalStatus,
      isCriticalPath: isCritical !== null ? isCritical : currentTask.isCriticalPath,
      designerNotes: updatedDesignerNotes,
      changeLogs: [newLog, ...(currentTask.changeLogs || [])],
    };

    onUpdateMilestone(updatedTask);

    setSuccessToast(`✅ 已成功同步調整「${currentTask.trade} - ${currentTask.name}」！`);
    setDesignerInstruction('');
    setDaysToExtend(0);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Submit new task from designer
  const handleSaveNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('請輸入工項名稱');
      return;
    }

    const timestamp = `${todayStr} ${new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })}`;
    const newTaskId = `ms-des-${Date.now()}`;
    const initialLog: DesignerChangeLog = {
      id: `log-${Date.now()}`,
      taskId: newTaskId,
      taskName: newName.trim(),
      trade: newTrade,
      timestamp,
      author: designerName,
      note: newDesc.trim() || '設計師現場追加工項',
      category: '追加工項',
    };

    const newTask: MilestoneTask = {
      id: newTaskId,
      trade: newTrade,
      name: newName.trim(),
      startDate: newStartDate,
      endDate: newEndDate,
      actionType: newActionType,
      progress: 0,
      status: '尚未開始',
      location: newLocation.trim() || undefined,
      contractorName: newContractorName.trim() || undefined,
      contractorPhone: newContractorPhone.trim() || undefined,
      description: newDesc.trim() || undefined,
      designerNotes: `【設計師追加工項 ${todayStr}】：${newDesc.trim() || newName.trim()}`,
      changeLogs: [initialLog],
    };

    onAddMilestone(newTask);

    setSuccessToast(`🎉 已成功新增並同步設計師追加工項「${newName}」！`);
    setNewName('');
    setNewDesc('');
    setActiveMode('adjust_existing');
    setSelectedTaskId(newTaskId);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Aggregate all history logs across all milestones
  const allHistoryLogs: DesignerChangeLog[] = useMemo(() => {
    const logs: DesignerChangeLog[] = [];
    milestones.forEach((m) => {
      if (m.changeLogs && m.changeLogs.length > 0) {
        logs.push(...m.changeLogs);
      }
    });
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [milestones]);

  // Copy full summary to clipboard (LINE friendly)
  const handleCopyLineReport = () => {
    const lines = [
      `📐【翔生資訊 誠豐金10F - 設計師現場溝通與工項調整備忘】`,
      `📅 紀錄日期：${todayStr}`,
      `👤 設計師：${designerName}`,
      `---------------------------------`
    ];

    if (allHistoryLogs.length === 0) {
      lines.push('目前尚無最新調整紀錄。');
    } else {
      allHistoryLogs.slice(0, 10).forEach((l, idx) => {
        lines.push(`${idx + 1}. [${l.trade}] ${l.taskName}`);
        lines.push(`   類型：${l.category || '現場調整'}`);
        lines.push(`   重點：${l.note}`);
        if (l.newEndDate) lines.push(`   工期調整至：${l.newEndDate} (順延 ${l.daysAdjusted || 0} 天)`);
        lines.push(`   時間：${l.timestamp}`);
        lines.push('');
      });
    }

    lines.push(`---------------------------------`);
    lines.push(`翔生資訊 裝潢施工排程管理系統即時同步`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#264653] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs text-white shadow-xs">
              <MessageSquare className="w-5 h-5 text-emerald-100" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  設計師溝通與工項即時調整中心
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  對口：{designerName}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                直接輸入設計師交辦事項與變更規格，1 秒立即同步至施工工項、甘特圖與 Google 試算表
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode('adjust_existing')}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeMode === 'adjust_existing'
                  ? 'bg-[#264653] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>快速調整現有工項</span>
            </button>

            <button
              onClick={() => setActiveMode('add_new')}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeMode === 'add_new'
                  ? 'bg-[#264653] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>➕ 追加設計師交辦工項</span>
            </button>

            <button
              onClick={() => setActiveMode('history')}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeMode === 'history'
                  ? 'bg-[#264653] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>溝通履歷 ({allHistoryLogs.length})</span>
            </button>
          </div>

          {/* Quick Copy to LINE Button */}
          <button
            onClick={handleCopyLineReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300 transition shadow-2xs"
            title="複製格式化文字，可直接貼在 LINE 傳給設計師確認"
          >
            {copiedLog ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>已複製 LINE 溝通備忘！</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-emerald-600" />
                <span>複製溝通備忘 (發 LINE 給設計師)</span>
              </>
            )}
          </button>
        </div>

        {/* Success Alert Banner */}
        {successToast && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 text-center animate-in slide-in-from-top-2">
            {successToast}
          </div>
        )}

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* ==================================================== */}
          {/* MODE 1: ADJUST EXISTING TASK */}
          {/* ==================================================== */}
          {activeMode === 'adjust_existing' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Quick Task Picker & Search (5 cols) */}
              <div className="lg:col-span-5 space-y-3 flex flex-col">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-teal-600" />
                      1. 快速搜尋 / 挑選目標工項
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      共 {filteredMilestones.length} 項
                    </span>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="輸入工種、名稱或工班 (如: 木工、插座、粗清)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {/* Trade Category Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedTradeFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition ${
                        selectedTradeFilter === 'all'
                          ? 'bg-teal-700 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      全部
                    </button>
                    {TRADE_LIST.slice(0, 8).map((trade) => (
                      <button
                        key={trade}
                        type="button"
                        onClick={() => setSelectedTradeFilter(trade)}
                        className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition ${
                          selectedTradeFilter === trade
                            ? 'bg-teal-700 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {trade.replace('工程', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Milestone Cards List */}
                <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1 flex-1">
                  {filteredMilestones.map((m) => {
                    const isSelected = m.id === selectedTaskId;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectTask(m)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 shadow-xs ring-1 ring-teal-500'
                            : 'bg-white border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-800 text-xs">
                              {m.trade}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              isSelected ? 'bg-teal-200 text-teal-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {m.actionType}
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 leading-snug">
                            {m.name}
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>{m.startDate} ~ {m.endDate}</span>
                            <span className="text-teal-700 font-bold">{m.progress}% ({m.status})</span>
                          </div>

                          {m.designerNotes && (
                            <div className="mt-1.5 text-[10px] text-emerald-800 bg-emerald-50/70 p-1 rounded border border-emerald-200 truncate">
                              💬 {m.designerNotes.split('\n')[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredMilestones.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      查無符合關鍵字的工項，可切換至「➕ 追加設計師交辦工項」建立！
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Direct Fast Input & Sync Form (7 cols) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                {currentTask ? (
                  <form onSubmit={handleSaveAdjustment} className="space-y-4">
                    {/* Active Selected Task Banner */}
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-700 text-white">
                            {currentTask.trade}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            已選取調整項目：
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-1">
                          {currentTask.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                          <span>工班：{currentTask.contractorName || '施工工班'} {currentTask.contractorPhone ? `(${currentTask.contractorPhone})` : ''}</span>
                          <span>原工期：{currentTask.startDate} ~ {currentTask.endDate}</span>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200">
                        進度 {currentTask.progress}%
                      </span>
                    </div>

                    {/* Step 2: Communication Tag & Quick Templates */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-slate-700 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                          2. 設計師交辦事項 / 現場變更內容：
                        </label>
                        <select
                          value={categoryTag}
                          onChange={(e) => setCategoryTag(e.target.value as any)}
                          className="text-[11px] bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-slate-700 font-semibold"
                        >
                          <option value="現場尺寸變更">現場尺寸變更</option>
                          <option value="追加工項">追加工項</option>
                          <option value="時程順延">時程順延</option>
                          <option value="材料選定">材料選定</option>
                          <option value="管委會協調">管委會協調</option>
                          <option value="驗收交代">驗收交代</option>
                        </select>
                      </div>

                      {/* Quick Prompt Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {QUICK_COMMUNICATION_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.label}
                            type="button"
                            onClick={() => {
                              setDesignerInstruction((prev) => 
                                prev ? `${prev}\n${tmpl.text}` : tmpl.text
                              );
                            }}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 transition"
                          >
                            {tmpl.label}
                          </button>
                        ))}
                      </div>

                      {/* Instruction Textarea */}
                      <textarea
                        rows={3}
                        value={designerInstruction}
                        onChange={(e) => setDesignerInstruction(e.target.value)}
                        placeholder="請直接輸入與設計師溝通結果 (例如：會議室電視牆木作插座往右移30cm，水電順延1天施工)..."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 leading-relaxed font-sans"
                      />
                    </div>

                    {/* Step 3: Fast Schedule / Date Adjustments */}
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          3. 工期快速調整 (展延 / 順延)：
                        </span>
                        {daysToExtend !== 0 && (
                          <span className="text-teal-700 font-bold font-mono">
                            累計順延 +{daysToExtend} 天
                          </span>
                        )}
                      </div>

                      {/* Quick Extend Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleExtendDays(1)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-300 font-semibold"
                        >
                          +1 天
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExtendDays(2)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-300 font-semibold"
                        >
                          +2 天
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExtendDays(3)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-300 font-semibold"
                        >
                          +3 天
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExtendDays(7)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-300 font-semibold"
                        >
                          +1 週
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDaysToExtend(0);
                            setCustomStartDate(currentTask.startDate);
                            setCustomEndDate(currentTask.endDate);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px]"
                        >
                          重設日期
                        </button>
                      </div>

                      {/* Date Inputs */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium block mb-0.5">
                            施工開始日
                          </label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full text-xs font-mono p-1.5 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium block mb-0.5">
                            預定完工日
                          </label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full text-xs font-mono p-1.5 bg-white border border-slate-300 rounded font-bold text-teal-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Progress & Critical Path */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          施工進度調整：{progressValue !== null ? progressValue : currentTask.progress}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={progressValue !== null ? progressValue : currentTask.progress}
                          onChange={(e) => setProgressValue(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-4">
                        <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 font-bold text-xs">
                          <input
                            type="checkbox"
                            checked={isCritical !== null ? isCritical : (currentTask.isCriticalPath || false)}
                            onChange={(e) => setIsCritical(e.target.checked)}
                            className="w-4 h-4 rounded accent-amber-600"
                          />
                          <Flame className="w-4 h-4 text-amber-500" />
                          <span>設為關鍵要徑</span>
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        點擊後立即同步至工項、甘特圖並背景同步至 Google Sheets
                      </span>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#264653] hover:bg-[#1D353F] text-white shadow-md transition"
                      >
                        <Send className="w-4 h-4" />
                        <span>同步更新至工項</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-20 text-center text-slate-400 space-y-2">
                    <Search className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">請從左側點選要與設計師溝通調整的工項</p>
                    <p className="text-xs text-slate-400">系統即會帶出該工項目前的時程、進度與工班資訊供您直接快速輸入！</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODE 2: QUICK ADD NEW TASK FROM DESIGNER */}
          {/* ==================================================== */}
          {activeMode === 'add_new' && (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <form onSubmit={handleSaveNewTask} className="space-y-4 text-xs">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-teal-600" />
                    由設計師現場追加施工工項
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    現場勘查或會勘時設計師若提出額外施工項目，可於此處直接新增，並同步入排程表
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      所屬工種 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newTrade}
                      onChange={(e) => setNewTrade(e.target.value as TradeCategory)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 font-medium"
                    >
                      {TRADE_LIST.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      作業類型
                    </label>
                    <select
                      value={newActionType}
                      onChange={(e) => setNewActionType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600"
                    >
                      <option value="施工">施工</option>
                      <option value="簽圖">簽圖</option>
                      <option value="丈量">丈量</option>
                      <option value="出圖">出圖</option>
                      <option value="備料">備料</option>
                      <option value="配管">配管</option>
                      <option value="配線">配線</option>
                      <option value="安裝">安裝</option>
                      <option value="驗收">驗收</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    追加工項名稱 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例：會議室增設專迴插座、主管室天花板加開維修孔..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      施工開始日
                    </label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      預定完工日
                    </label>
                    <input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-teal-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      施工位置 / 區域
                    </label>
                    <input
                      type="text"
                      placeholder="例：會議室-1、開放辦公區..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      指定負責工班 / 廠商
                    </label>
                    <input
                      type="text"
                      placeholder="例：大同水電工程、優質木作..."
                      value={newContractorName}
                      onChange={(e) => setNewContractorName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    設計師交辦說明 / 施工規格細節
                  </label>
                  <textarea
                    rows={3}
                    placeholder="請輸入設計師現場交代的規格、材質、收邊細節或配合事項..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMode('adjust_existing')}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>確認新增並同步至工項表</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* MODE 3: HISTORY & LINE EXPORT */}
          {/* ==================================================== */}
          {activeMode === 'history' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    設計師現場溝通與工項異動履歷
                  </h3>
                  <p className="text-slate-500 mt-0.5">
                    完整追蹤歷次會勘、現場尺寸變更、展延天數與溝通時間戳記
                  </p>
                </div>

                <button
                  onClick={handleCopyLineReport}
                  className="px-3.5 py-2 rounded-lg font-bold bg-[#2A9D8F] hover:bg-[#207B70] text-white shadow-xs flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>一鍵複製 LINE 溝通報表</span>
                </button>
              </div>

              <div className="space-y-3">
                {allHistoryLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition text-xs shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {log.trade}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {log.taskName}
                        </span>
                        {log.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                            {log.category}
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      {log.note}
                    </p>

                    {(log.daysAdjusted || log.newEndDate) && (
                      <div className="flex items-center gap-3 text-[11px] text-teal-800 font-mono">
                        {log.daysAdjusted && (
                          <span>順延：+{log.daysAdjusted} 天</span>
                        )}
                        {log.newEndDate && (
                          <span>新完工日：{log.newEndDate}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {allHistoryLogs.length === 0 && (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    目前尚未有透過本視窗進行的設計師溝通調整紀錄
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            翔生資訊 辦公室裝潢現場溝通協調
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
