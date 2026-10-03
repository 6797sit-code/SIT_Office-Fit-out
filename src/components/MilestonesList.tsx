import React, { useState, useMemo } from 'react';
import { MilestoneTask, TradeCategory, MilestoneStatus, TodoItem } from '../types';
import { 
  Search, 
  Filter, 
  Download,
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  MessageSquare, 
  CheckSquare, 
  MapPin, 
  Phone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  HardHat,
  Sliders
} from 'lucide-react';

interface MilestonesListProps {
  milestones: MilestoneTask[];
  todos?: TodoItem[];
  onUpdateMilestone: (milestone: MilestoneTask) => void;
  onDeleteMilestone: (id: string) => void;
  onAddNewMilestone: () => void;
  onEditMilestone: (milestone: MilestoneTask) => void;
  onExportCSV: () => void;
  onOpenDesignerCoordModal?: (task?: MilestoneTask) => void;
  onNavigateToTodos?: () => void;
}

type SortField = 'index' | 'name' | 'dates' | 'contractor' | 'progress';
type SortDirection = 'asc' | 'desc';

export const MilestonesList: React.FC<MilestonesListProps> = ({
  milestones,
  todos = [],
  onUpdateMilestone,
  onDeleteMilestone,
  onAddNewMilestone,
  onEditMilestone,
  onExportCSV,
  onOpenDesignerCoordModal,
  onNavigateToTodos,
}) => {
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Table sorting state
  const [sortField, setSortField] = useState<SortField>('dates');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Expanded row IDs for checklist & details
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Starred / Priority pinned items
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    // Default star critical path items
    return new Set(milestones.filter(m => m.isCriticalPath).map(m => m.id));
  });

  const tradeList: TradeCategory[] = [
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

  // Map each trade to a numeric prefix
  const tradeOrderMap = useMemo(() => {
    const map = new Map<TradeCategory, number>();
    tradeList.forEach((t, idx) => map.set(t, idx));
    return map;
  }, []);

  // Compute item numbers like 0-1., 1-1., 2-1. matching Figure 2
  const indexedMilestones = useMemo(() => {
    // Group by trade to assign sub-indices
    const tradeCounters = new Map<string, number>();
    return milestones.map((m) => {
      const tradeIdx = tradeOrderMap.get(m.trade) ?? 0;
      const subIdx = (tradeCounters.get(m.trade) || 0) + 1;
      tradeCounters.set(m.trade, subIdx);
      const itemNo = `${tradeIdx}-${subIdx}.`;
      return {
        ...m,
        itemNo,
        tradeIdx,
        subIdx,
      };
    });
  }, [milestones, tradeOrderMap]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return indexedMilestones.filter((m) => {
      if (m.actionType === '備料') return false;
      if (selectedTrade !== 'all' && m.trade !== selectedTrade) return false;
      if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesTrade = m.trade.toLowerCase().includes(q);
        const matchesContractor = (m.contractorName || '').toLowerCase().includes(q);
        const matchesDesc = (m.description || '').toLowerCase().includes(q);
        const matchesItemNo = m.itemNo.toLowerCase().includes(q);
        if (!matchesName && !matchesTrade && !matchesContractor && !matchesDesc && !matchesItemNo) {
          return false;
        }
      }
      return true;
    });
  }, [indexedMilestones, selectedTrade, selectedStatus, searchQuery]);

  // Sorted milestones
  const sortedMilestones = useMemo(() => {
    const list = [...filteredMilestones];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'index':
          comparison = (a.tradeIdx - b.tradeIdx) || (a.subIdx - b.subIdx);
          break;
        case 'name':
          comparison = a.trade.localeCompare(b.trade, 'zh-TW') || a.name.localeCompare(b.name, 'zh-TW');
          break;
        case 'dates':
          comparison = a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate);
          break;
        case 'contractor': {
          const ca = a.contractorName || '';
          const cb = b.contractorName || '';
          comparison = ca.localeCompare(cb, 'zh-TW');
          break;
        }
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredMilestones, sortField, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'progress' ? 'desc' : 'asc');
    }
  };

  // Toggle star
  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle row expansion
  const toggleRowExpanded = (id: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleProgressChange = (m: MilestoneTask, newProgress: number) => {
    let newStatus: MilestoneStatus = m.status;
    if (newProgress === 100) {
      newStatus = '已完成';
    } else if (newProgress > 0) {
      newStatus = '進行中';
    } else {
      newStatus = '尚未開始';
    }
    onUpdateMilestone({
      ...m,
      progress: Math.min(100, Math.max(0, newProgress)),
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // Action Type Badge Color Styling
  const getActionTypeBadge = (actionType: string) => {
    switch (actionType) {
      case '施工':
        return 'bg-[#E9F2FF] text-[#0C66E4] border-[#CCE0FF]';
      case '簽圖':
      case '出圖':
      case '下單':
        return 'bg-[#F3F0FF] text-[#6554C0] border-[#DFD8FD]';
      case '丈量':
        return 'bg-[#FFF7D6] text-[#7F5F01] border-[#F5E19A]';
      case '備料':
        return 'bg-[#E6FCFF] text-[#008299] border-[#B3F5FF]';
      case '配管':
      case '配線':
      case '裝燈':
      case '插座配置':
        return 'bg-[#E3FCEF] text-[#216E4E] border-[#BAF3DB]';
      case '粗清':
      case '細清':
        return 'bg-[#E3FCEF] text-[#00875A] border-[#BAF3DB]';
      case '安裝':
      case '裝機':
      case '拆包膜':
        return 'bg-[#E9F2FF] text-[#1D7AFC] border-[#CCE0FF]';
      case '驗收':
        return 'bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD] font-bold';
      default:
        return 'bg-[#F1F2F4] text-[#44546F] border-slate-200';
    }
  };

  // Calculate duration text matching Figure 2 format:
  // "🕒 07/02 ~ 07/15" and "工期: 2 週 (開工:07/02)"
  const getScheduleMeta = (start: string, end: string) => {
    if (!start || !end) return { rangeText: '-', durationText: '-' };
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
    const weeks = Math.round(days / 7);
    const startShort = start.slice(5).replace('-', '/');
    const endShort = end.slice(5).replace('-', '/');
    const durationLabel = weeks > 1 ? `${weeks} 週` : `${days} 天`;
    return {
      rangeText: `${startShort} ~ ${endShort}`,
      durationText: `工期: ${durationLabel} (開工:${startShort})`,
    };
  };

  // Render Sort Icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0C66E4]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0C66E4]" />
    );
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Top Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋項次、工種、施工節點、廠商、說明 (例如: 0-1, 簽圖, 粗清, 配管, 水電)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0C66E4] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0C66E4]"
            >
              <option value="all">所有工程工種 (全部14項)</option>
              {tradeList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0C66E4]"
          >
            <option value="all">所有進度狀態</option>
            <option value="尚未開始">尚未開始</option>
            <option value="進行中">進行中</option>
            <option value="已完成">已完成</option>
            <option value="延遲預警">延遲預警</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDesignerCoordModal && (
            <button
              onClick={() => onOpenDesignerCoordModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EAF6F4] hover:bg-[#D8EFEA] text-[#1C6960] border border-[#BBE4DE] shadow-2xs transition"
              title="直接輸入設計師現場溝通交辦事項，即刻同步至工項與 Google 試算表"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#2A9D8F]" />
              <span>設計師工項速調</span>
            </button>
          )}

          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-[#2A9D8F]" />
            <span>匯出施工節點 CSV</span>
          </button>

          <button
            onClick={onAddNewMilestone}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0C66E4] hover:bg-[#0055CC] text-white shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增施工節點</span>
          </button>
        </div>
      </div>

      {/* Figure 2 Style Table View with Clickable Column Sorting */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left text-xs border-collapse">
            {/* Table Header matching Figure 2 */}
            <thead className="bg-[#F8FAFC] text-slate-700 font-bold border-b border-slate-200 select-none">
              <tr>
                {/* Column 1: 項次 */}
                <th
                  onClick={() => handleSort('index')}
                  className="py-3 px-4 w-[75px] shrink-0 cursor-pointer hover:bg-slate-100 transition group"
                  title="點擊依項次排序"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'index' ? 'text-[#0C66E4] font-black' : ''}>項次</span>
                    {renderSortIcon('index')}
                  </div>
                </th>

                {/* Column 2: 任務名稱 & 執行重點 */}
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 min-w-[320px] cursor-pointer hover:bg-slate-100 transition group"
                  title="點擊依任務工種與名稱排序"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'name' ? 'text-[#0C66E4] font-black' : ''}>
                      任務名稱 & 執行重點
                    </span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                {/* Column 3: 預計時程（週數） */}
                <th
                  onClick={() => handleSort('dates')}
                  className="py-3 px-4 w-[195px] shrink-0 cursor-pointer hover:bg-slate-100 transition group"
                  title="點擊依預計開工時程排序"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'dates' ? 'text-[#0C66E4] font-black' : ''}>
                      預計時程（週數）
                    </span>
                    {renderSortIcon('dates')}
                  </div>
                </th>

                {/* Column 4: 負責人員（工班/廠商） */}
                <th
                  onClick={() => handleSort('contractor')}
                  className="py-3 px-4 w-[185px] shrink-0 cursor-pointer hover:bg-slate-100 transition group"
                  title="點擊依負責人員與廠商排序"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'contractor' ? 'text-[#0C66E4] font-black' : ''}>
                      負責人員（工班/廠商）
                    </span>
                    {renderSortIcon('contractor')}
                  </div>
                </th>

                {/* Column 5: 進度與線上檢核 */}
                <th
                  onClick={() => handleSort('progress')}
                  className="py-3 px-4 w-[245px] shrink-0 text-right cursor-pointer hover:bg-slate-100 transition group pr-6"
                  title="點擊依完工進度百分比排序"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={sortField === 'progress' ? 'text-[#0C66E4] font-black' : ''}>
                      進度與線上檢核
                    </span>
                    {renderSortIcon('progress')}
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedMilestones.map((m) => {
                const schedule = getScheduleMeta(m.startDate, m.endDate);
                const isExpanded = expandedRowIds.has(m.id);
                const isStarred = starredIds.has(m.id);
                const relatedTodos = todos.filter(t => 
                  t.relatedMilestoneId === m.id || 
                  (t.relatedMilestoneName && (m.name.includes(t.relatedMilestoneName) || t.relatedMilestoneName.includes(m.name)))
                );
                const completedTodosCount = relatedTodos.filter(t => t.completed).length;

                return (
                  <React.Fragment key={m.id}>
                    <tr 
                      className={`hover:bg-slate-50/80 transition group ${
                        isExpanded ? 'bg-sky-50/20' : ''
                      }`}
                    >
                      {/* Column 1: 項次 + Star + Critical alert */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-[#0C66E4] font-black font-mono text-sm tracking-tight">
                            {m.itemNo}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <button
                              type="button"
                              onClick={(e) => handleToggleStar(m.id, e)}
                              className="hover:scale-110 transition cursor-pointer"
                              title={isStarred ? '取消關注' : '設為重點關注'}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  isStarred 
                                    ? 'fill-amber-400 text-amber-500' 
                                    : 'text-slate-300 hover:text-amber-400'
                                }`}
                              />
                            </button>
                            {m.isCriticalPath && (
                              <span title="關鍵要徑任務">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: 任務名稱 & 執行重點 */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          {/* Name + Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm leading-snug">
                              {m.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                              {m.trade}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${getActionTypeBadge(m.actionType)}`}>
                              {m.actionType}
                            </span>
                            {m.isCriticalPath && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                🔥 關鍵要徑
                              </span>
                            )}
                          </div>

                          {/* Notes / Description */}
                          {(m.description || m.designerNotes) && (
                            <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {m.description || m.designerNotes}
                            </div>
                          )}

                          {/* Location tag if available */}
                          {m.location && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>{m.location}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 3: 預計時程（週數） */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{schedule.rangeText}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono pl-5">
                            {schedule.durationText}
                          </div>
                        </div>
                      </td>

                      {/* Column 4: 負責人員（工班/廠商） */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                          <HardHat className="w-3.5 h-3.5 text-[#0C66E4] shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {m.contractorName || '劉仲傑 / 設計師'}
                          </span>
                        </div>
                        {m.contractorPhone && (
                          <div className="text-[11px] text-slate-500 font-mono pl-5">
                            {m.contractorPhone}
                          </div>
                        )}
                      </td>

                      {/* Column 5: 進度與線上檢核 */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {/* Progress Input Box [ 100 ] % - Full visibility without clipping */}
                          <div className="inline-flex items-center bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs hover:border-[#0C66E4] transition shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="5"
                              value={m.progress}
                              onChange={(e) => handleProgressChange(m, parseInt(e.target.value, 10) || 0)}
                              className="w-10 text-center font-black font-mono text-xs text-[#0C66E4] focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-pointer"
                              title="點擊直接修改進度百分比"
                            />
                            <span className="text-slate-500 font-bold text-xs ml-0.5">%</span>
                          </div>

                          {/* Online Checklist Button [ 📑 檢核表 ] */}
                          <button
                            type="button"
                            onClick={() => toggleRowExpanded(m.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs border shrink-0 ${
                              isExpanded || m.progress === 100
                                ? 'bg-[#EBF3F5] text-[#0C66E4] border-[#CCE0FF]'
                                : 'bg-[#EAF6F4] text-[#1C6960] border-[#BBE4DE] hover:bg-[#D8EFEA]'
                            }`}
                            title="查看線上檢核表、工項備註與設計師協調事項"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>檢核表</span>
                            {relatedTodos.length > 0 && (
                              <span className="ml-0.5 px-1 py-0.2 rounded-full text-[10px] bg-white text-slate-700 font-black">
                                {completedTodosCount}/{relatedTodos.length}
                              </span>
                            )}
                          </button>

                          {/* Expand Row Chevron */}
                          <button
                            type="button"
                            onClick={() => toggleRowExpanded(m.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                            title={isExpanded ? '收合' : '展開詳情'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-700" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details & Checklist Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={5} className="py-3 px-6 animate-in fade-in duration-100">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-[#0C66E4]" />
                                  <span>{m.itemNo} {m.name} • 施工檢核與執行重點</span>
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  m.status === '已完成'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : m.status === '進行中'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {m.status} ({m.progress}%)
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {onOpenDesignerCoordModal && (
                                  <button
                                    onClick={() => onOpenDesignerCoordModal(m)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#1C6960] bg-[#EAF6F4] hover:bg-[#D8EFEA] border border-[#BBE4DE] flex items-center gap-1 transition"
                                  >
                                    <MessageSquare className="w-3 h-3 text-[#2A9D8F]" />
                                    <span>設計師現場速調</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => onEditMilestone(m)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 transition"
                                >
                                  <Edit3 className="w-3 h-3 text-indigo-600" />
                                  <span>編輯節點</span>
                                </button>
                                {deletingId === m.id ? (
                                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 rounded px-1.5 py-0.5">
                                    <span className="text-[10px] text-rose-700 font-bold">確定刪除？</span>
                                    <button
                                      onClick={() => {
                                        onDeleteMilestone(m.id);
                                        setDeletingId(null);
                                      }}
                                      className="px-1.5 py-0.2 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px]"
                                    >
                                      確定
                                    </button>
                                    <button
                                      onClick={() => setDeletingId(null)}
                                      className="px-1 py-0.2 rounded bg-white text-slate-700 border border-slate-300 text-[10px]"
                                    >
                                      取消
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeletingId(m.id)}
                                    className="px-2 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 transition"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                    <span>刪除</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Two-column layout for details & todos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left: Description & Designer Notes */}
                              <div className="space-y-2 text-xs">
                                <div>
                                  <div className="text-[11px] font-bold text-slate-500 mb-0.5">工項說明：</div>
                                  <div className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                    {m.description || '暫無額外補充說明。'}
                                  </div>
                                </div>

                                {m.designerNotes && (
                                  <div>
                                    <div className="text-[11px] font-bold text-teal-800 mb-0.5 flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3 text-teal-600" />
                                      <span>設計師現場溝通交辦：</span>
                                    </div>
                                    <div className="text-teal-950 bg-teal-50/60 p-2.5 rounded-lg border border-teal-200 leading-relaxed whitespace-pre-line">
                                      {m.designerNotes}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right: Related Todos & Verification Checklist */}
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    <CheckSquare className="w-3.5 h-3.5 text-[#0C66E4]" />
                                    <span>重點待辦查核清單 ({completedTodosCount}/{relatedTodos.length} 完成)</span>
                                  </div>
                                  {onNavigateToTodos && (
                                    <button
                                      onClick={onNavigateToTodos}
                                      className="text-xs text-[#0C66E4] hover:underline font-bold"
                                    >
                                      前往待辦查核頁 ➔
                                    </button>
                                  )}
                                </div>

                                {relatedTodos.length === 0 ? (
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-center text-[11px]">
                                    此工項目前無綁定查核待辦事項
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                                    {relatedTodos.map(rt => (
                                      <div
                                        key={rt.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                                      >
                                        <span className={`flex items-center gap-2 truncate ${rt.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                                          <span className={`w-4 h-4 rounded-xs border flex items-center justify-center text-[10px] shrink-0 ${rt.completed ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
                                            {rt.completed ? '✓' : ''}
                                          </span>
                                          <span className="truncate">{rt.title}</span>
                                        </span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${rt.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                          {rt.completed ? '已檢核' : '待檢核'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Quick slider inside expanded view */}
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                                  <span className="text-[11px] font-bold text-slate-600 shrink-0">完工進度調校：</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={m.progress}
                                    onChange={(e) => handleProgressChange(m, parseInt(e.target.value, 10))}
                                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0C66E4]"
                                  />
                                  <button
                                    onClick={() => handleProgressChange(m, m.progress === 100 ? 0 : 100)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                                      m.progress === 100
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    {m.progress === 100 ? '✓ 已完工' : '標記完工'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {sortedMilestones.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 bg-white">
                    沒有符合條件的施工工程節點
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
