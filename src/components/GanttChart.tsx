import React, { useState, useMemo, useRef } from 'react';
import { 
  MilestoneTask, 
  ProcurementItem, 
  TradeCategory, 
  ProcurementCategory 
} from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Info, 
  Layers, 
  Flame, 
  Check, 
  Filter, 
  Download,
  AlertCircle
} from 'lucide-react';
import { getTodayDateString, getTodayDisplayDate } from '../utils/date';

interface GanttChartProps {
  milestones: MilestoneTask[];
  procurementItems: ProcurementItem[];
  onSelectMilestone?: (milestone: MilestoneTask) => void;
  onSelectProcurement?: (item: ProcurementItem) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  milestones,
  procurementItems,
  onSelectMilestone,
  onSelectProcurement,
}) => {
  const [viewMode, setViewMode] = useState<'integrated' | 'construction' | 'procurement'>('integrated');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<'compact' | 'normal' | 'wide'>('normal');
  const [hoveredTask, setHoveredTask] = useState<any | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Date range definition: 2026-09-07 through 2026-11-26
  const startDate = new Date('2026-09-07');
  const endDate = new Date('2026-11-26');
  const todayStr = getTodayDateString(); // Dynamic Taiwan baseline (2026-10-02)

  // Column width based on zoom level
  const colWidth = zoomLevel === 'compact' ? 24 : zoomLevel === 'normal' ? 36 : 50;

  // Generate all days in the project
  const days = useMemo(() => {
    const list: { date: Date; dateStr: string; dayOfMonth: number; month: number; dayOfWeek: string; isWeekend: boolean; isToday: boolean }[] = [];
    const curr = new Date(startDate);
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    while (curr <= endDate) {
      const year = curr.getFullYear();
      const month = curr.getMonth() + 1;
      const day = curr.getDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeekIdx = curr.getDay();

      list.push({
        date: new Date(curr),
        dateStr,
        dayOfMonth: day,
        month,
        dayOfWeek: dayNames[dayOfWeekIdx],
        isWeekend: dayOfWeekIdx === 0 || dayOfWeekIdx === 6,
        isToday: dateStr === todayStr,
      });

      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, []);

  // Month headers grouped
  const monthGroups = useMemo(() => {
    const groups: { month: number; label: string; count: number }[] = [];
    days.forEach((d) => {
      const existing = groups.find((g) => g.month === d.month);
      if (existing) {
        existing.count++;
      } else {
        const label = d.month === 9 ? '9月 (開工動線與拆除木作)' : d.month === 10 ? '10月 (油漆水電系統櫃與第一批設備)' : '11月 (教室桌椅與完工驗收)';
        groups.push({ month: d.month, label, count: 1 });
      }
    });
    return groups;
  }, [days]);

  // Date helper to compute position and width
  const getPosition = (startStr: string, endStr: string) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    
    // Clamp to timeline
    const effectiveStart = s < startDate ? startDate : s;
    const effectiveEnd = e > endDate ? endDate : e;

    const diffStartDays = Math.max(0, Math.floor((effectiveStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const durationDays = Math.max(1, Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    return {
      left: diffStartDays * colWidth,
      width: durationDays * colWidth,
    };
  };

  // Group milestones by trade
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

  // Filtered milestones: 依使用者需求，把「備料」從行程中移除，甘特圖只呈現工程施工相關
  const filteredMilestones = useMemo(() => {
    const constructionMilestones = milestones.filter((m) => m.actionType !== '備料');
    if (selectedTrade === 'all') return constructionMilestones;
    return constructionMilestones.filter((m) => m.trade === selectedTrade);
  }, [milestones, selectedTrade]);

  // Grouped milestones map
  const groupedMilestones = useMemo(() => {
    const map: Record<string, MilestoneTask[]> = {};
    tradeList.forEach((trade) => {
      const items = filteredMilestones.filter((m) => m.trade === trade);
      if (items.length > 0) {
        map[trade] = items;
      }
    });
    return map;
  }, [filteredMilestones]);

  // Procurement items timeline representation
  const procurementGanttItems = useMemo(() => {
    return procurementItems.map((p) => {
      const start = p.orderDate || '2026-09-18';
      const delivery = p.expectedDeliveryDate || '2026-10-05';
      const install = p.installationDate || '2026-10-09';
      return {
        ...p,
        start,
        delivery,
        install,
      };
    });
  }, [procurementItems]);

  // Colors for trade badges in modern PM palette matching reference image
  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case '施工':
        return 'bg-[#0C66E4] text-white border-[#0055CC]';
      case '簽圖':
      case '出圖':
      case '下單':
        return 'bg-[#6554C0] text-white border-[#5243AA]';
      case '丈量':
        return 'bg-[#B35F00] text-white border-[#974F0C]';
      case '備料':
        return 'bg-[#008299] text-white border-[#00667A]';
      case '配管':
      case '配線':
      case '裝燈':
      case '插座配置':
        return 'bg-[#216E4E] text-white border-[#1F845A]';
      case '粗清':
      case '細清':
        return 'bg-[#00875A] text-white border-[#006644]';
      case '安裝':
      case '裝機':
      case '拆包膜':
        return 'bg-[#1D7AFC] text-white border-[#0C66E4]';
      case '驗收':
        return 'bg-[#C9372C] text-white border-[#AE2A19] font-bold';
      default:
        return 'bg-[#626F86] text-white border-[#44546F]';
    }
  };

  const scrollToToday = () => {
    if (containerRef.current) {
      const todayIdx = days.findIndex((d) => d.dateStr === todayStr);
      if (todayIdx >= 0) {
        containerRef.current.scrollTo({
          left: Math.max(0, todayIdx * colWidth - 200),
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-slate-800">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#264653]" />
            檢視視角：
          </span>
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('integrated')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                viewMode === 'integrated' ? 'bg-[#264653] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              整合雙軌對照
            </button>
            <button
              onClick={() => setViewMode('construction')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                viewMode === 'construction' ? 'bg-[#264653] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              施工工種 (14項)
            </button>
            <button
              onClick={() => setViewMode('procurement')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                viewMode === 'procurement' ? 'bg-[#264653] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              設備採購交期
            </button>
          </div>

          {/* Trade Filter */}
          <div className="flex items-center gap-1.5 ml-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#264653]"
            >
              <option value="all">全部工程工種 (全部14項)</option>
              {tradeList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-medium text-[#1C6960] bg-[#EAF6F4] border border-[#BBE4DE] px-2 py-1 rounded-md hidden lg:inline-flex items-center gap-1">
            <Check className="w-3 h-3 text-[#2A9D8F]" />
            僅呈現施工相關（已排除廠商備料時程）
          </span>
        </div>

        {/* Zoom & Quick Jump */}
        <div className="flex items-center gap-2">
          <button
            onClick={scrollToToday}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FDF8EC] text-[#9A741A] border border-[#F6E3B0] hover:bg-[#FDF3DA] transition shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#E9C46A] animate-ping"></span>
            今日基準 ({getTodayDisplayDate()})
          </button>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setZoomLevel('compact')}
              className={`p-1.5 rounded text-xs ${zoomLevel === 'compact' ? 'bg-[#264653] text-white' : 'text-slate-600 hover:text-slate-900'}`}
              title="縮小 (緊湊日檢視)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel('normal')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${zoomLevel === 'normal' ? 'bg-[#264653] text-white' : 'text-slate-600 hover:text-slate-900'}`}
              title="標準檢視"
            >
              標準
            </button>
            <button
              onClick={() => setZoomLevel('wide')}
              className={`p-1.5 rounded text-xs ${zoomLevel === 'wide' ? 'bg-[#264653] text-white' : 'text-slate-600 hover:text-slate-900'}`}
              title="放大 (寬幅日檢視)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Info Strip */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-slate-800">圖例說明：</span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded bg-purple-600"></span> 簽圖/下單/出圖
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded bg-blue-600"></span> 現場施工
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded bg-emerald-600"></span> 配管/配線/裝燈
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded bg-sky-600"></span> 工廠備料
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded bg-teal-600"></span> 粗清/細清
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded bg-indigo-600"></span> 設備安裝/裝機
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded bg-rose-600"></span> 完工總驗收
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> 關鍵路徑 (Critical Path)
          </span>
        </div>
        <div className="text-slate-500 font-medium">
          💡 點擊任一長條可檢視詳細工務與供應商聯絡資訊
        </div>
      </div>

      {/* Scrollable Gantt Body */}
      <div 
        ref={containerRef}
        className="overflow-x-auto relative select-none max-h-[700px] overflow-y-auto"
      >
        <div style={{ width: `${Math.max(1100, 240 + days.length * colWidth)}px` }} className="relative">
          {/* Header Row: Months */}
          <div className="sticky top-0 z-30 flex bg-white border-b border-slate-200 shadow-2xs">
            <div className="w-60 min-w-60 max-w-60 sticky left-0 z-40 bg-white border-r border-slate-200 p-2.5 text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>施工項目 / 採購品項</span>
              <span className="text-[10px] text-slate-500 font-normal">工種與階段</span>
            </div>
            <div className="flex">
              {monthGroups.map((mg) => (
                <div
                  key={mg.month}
                  style={{ width: `${mg.count * colWidth}px` }}
                  className="border-r border-slate-200 px-2 py-1.5 text-center text-xs font-bold text-indigo-900 bg-slate-100/80"
                >
                  {mg.label}
                </div>
              ))}
            </div>
          </div>

          {/* Header Row: Days & Weekdays */}
          <div className="sticky top-8 z-30 flex bg-slate-50/95 border-b border-slate-200">
            <div className="w-60 min-w-60 max-w-60 sticky left-0 z-40 bg-slate-50 border-r border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>任務名稱</span>
              <span>負責廠商</span>
            </div>
            <div className="flex">
              {days.map((d) => (
                <div
                  key={d.dateStr}
                  style={{ width: `${colWidth}px` }}
                  className={`border-r border-slate-200 text-center py-1 flex flex-col items-center justify-center ${
                    d.isToday 
                      ? 'bg-sky-100 font-bold text-sky-900' 
                      : d.isWeekend 
                      ? 'bg-slate-100/60 text-slate-500' 
                      : 'text-slate-700'
                  }`}
                >
                  <span className={`text-[11px] leading-tight font-mono ${d.isToday ? 'px-1 rounded bg-sky-600 text-white font-bold' : ''}`}>
                    {d.dayOfMonth}
                  </span>
                  <span className="text-[9px] text-slate-500 leading-tight">
                    {d.dayOfWeek}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today Indicator Line (Spanning Full Height) */}
          {(() => {
            const todayIdx = days.findIndex((d) => d.dateStr === todayStr);
            if (todayIdx >= 0) {
              const leftPos = 240 + todayIdx * colWidth + colWidth / 2;
              return (
                <div
                  style={{ left: `${leftPos}px` }}
                  className="absolute top-16 bottom-0 w-0.5 bg-sky-500 z-20 pointer-events-none opacity-90"
                >
                  <div className="sticky top-16 -ml-9 bg-sky-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md">
                    今日 (10/01)
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* GANTT ROWS */}
          <div className="divide-y divide-slate-200">
            {/* CONSTRUCTION SECTION */}
            {(viewMode === 'integrated' || viewMode === 'construction') && (
              <>
                <div className="sticky left-0 bg-slate-100 px-4 py-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2 border-y border-slate-200">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  裝潢施工工程時程表 (設計師進度表 14項工程工種)
                </div>

                {Object.entries(groupedMilestones).map(([trade, tasks]) => (
                  <div key={trade} className="relative">
                    {/* Trade Category Header */}
                    <div className="flex bg-white hover:bg-slate-50/80 transition">
                      <div className="w-60 min-w-60 max-w-60 sticky left-0 z-10 bg-white border-r border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span className="truncate">{trade}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                          {tasks.length}節點
                        </span>
                      </div>
                      <div className="flex-1 bg-slate-50/30 relative h-8">
                        {/* Render tasks in this trade */}
                        {tasks.map((task) => {
                          const { left, width } = getPosition(task.startDate, task.endDate);
                          const actionClass = getActionColor(task.actionType);

                          return (
                            <div
                              key={task.id}
                              onClick={() => onSelectMilestone && onSelectMilestone(task)}
                              onMouseEnter={(e) => {
                                setHoveredTask(task);
                                setHoverPos({ x: e.clientX, y: e.clientY });
                              }}
                              onMouseLeave={() => setHoveredTask(null)}
                              style={{
                                left: `${left}px`,
                                width: `${Math.max(width, 24)}px`,
                                top: '4px',
                                height: '24px',
                              }}
                              className={`absolute rounded-md cursor-pointer transition transform hover:scale-[1.02] hover:z-30 shadow-xs flex items-center px-1.5 text-[11px] font-semibold overflow-hidden border ${actionClass} ${
                                task.isCriticalPath ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white' : ''
                              }`}
                            >
                              {/* Progress bar inside */}
                              <div
                                style={{ width: `${task.progress}%` }}
                                className="absolute left-0 top-0 bottom-0 bg-white/20 pointer-events-none"
                              />

                              <div className="relative z-10 flex items-center gap-1 truncate w-full">
                                {task.isCriticalPath && (
                                  <Flame className="w-3 h-3 text-amber-200 fill-amber-200 shrink-0" />
                                )}
                                <span className="text-[10px] font-bold px-1 rounded bg-black/25 shrink-0">
                                  {task.actionType}
                                </span>
                                <span className="truncate">{task.name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* PROCUREMENT SECTION */}
            {(viewMode === 'integrated' || viewMode === 'procurement') && (
              <>
                <div className="sticky left-0 bg-slate-100 px-4 py-1.5 text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-2 border-y border-slate-200 mt-2">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  設備採購交期與現場安裝進度 (誠豐金10F採購需求清單)
                </div>

                {procurementGanttItems.map((item) => {
                  const orderPos = getPosition(item.start, item.start);
                  const deliveryPos = getPosition(item.delivery, item.delivery);
                  const installPos = getPosition(item.install, item.install);

                  return (
                    <div key={item.id} className="flex bg-white hover:bg-slate-50/80 transition">
                      <div 
                        onClick={() => onSelectProcurement && onSelectProcurement(item)}
                        className="w-60 min-w-60 max-w-60 sticky left-0 z-10 bg-white border-r border-slate-200 px-3 py-1.5 text-xs text-slate-800 flex flex-col justify-center cursor-pointer hover:text-indigo-600"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold truncate">{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-sky-800 font-semibold border border-slate-200 shrink-0 ml-1">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                          <span>數量: {item.totalQty} | NT$ {item.subtotal.toLocaleString()}</span>
                          <span className={`px-1 rounded text-[9px] font-bold ${
                            item.status === '已到貨驗收' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : item.status === '已下單' 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 relative h-9 bg-slate-50/20">
                        {/* Timeline span line from order to install */}
                        <div
                          style={{
                            left: `${orderPos.left + colWidth / 2}px`,
                            width: `${Math.max(0, installPos.left - orderPos.left)}px`,
                            top: '16px',
                            height: '2px',
                          }}
                          className="absolute bg-slate-300 border-dashed border-b border-slate-400 pointer-events-none"
                        />

                        {/* Order Milestone Node */}
                        <div
                          style={{ left: `${orderPos.left + 2}px`, top: '7px' }}
                          title={`下單日: ${item.start}`}
                          className="absolute w-5 h-5 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center text-[9px] font-bold text-white shadow-xs z-10 cursor-pointer"
                        >
                          單
                        </div>

                        {/* Delivery Node */}
                        <div
                          style={{ left: `${deliveryPos.left + 2}px`, top: '7px' }}
                          title={`預計到貨日: ${item.delivery}`}
                          className="absolute w-5 h-5 rounded-full bg-amber-500 border border-amber-300 flex items-center justify-center text-[9px] font-bold text-slate-900 shadow-xs z-10 cursor-pointer"
                        >
                          貨
                        </div>

                        {/* Installation Node */}
                        <div
                          style={{ left: `${installPos.left + 2}px`, top: '7px' }}
                          title={`現場安裝測試日: ${item.install}`}
                          className="absolute px-2 py-0.5 rounded-md bg-emerald-600 border border-emerald-500 flex items-center gap-1 text-[10px] font-bold text-white shadow-xs z-10 cursor-pointer"
                        >
                          <Check className="w-2.5 h-2.5" />
                          <span>裝機</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Hover Card */}
      {hoveredTask && hoverPos && (
        <div
          style={{
            left: `${Math.min(window.innerWidth - 320, hoverPos.x + 15)}px`,
            top: `${hoverPos.y + 15}px`,
          }}
          className="fixed z-50 w-72 bg-white text-slate-900 rounded-xl shadow-2xl p-3.5 border border-slate-200 text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-indigo-700 text-sm">{hoveredTask.trade}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              hoveredTask.status === '已完成' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {hoveredTask.status} ({hoveredTask.progress}%)
            </span>
          </div>
          <div className="font-bold text-slate-900 mb-1">{hoveredTask.name}</div>
          <div className="text-[11px] text-slate-600 space-y-1 mb-2">
            <div>📅 日期區間：{hoveredTask.startDate} ~ {hoveredTask.endDate}</div>
            <div>⚡ 作業類別：{hoveredTask.actionType}</div>
            {hoveredTask.contractorName && (
              <div>👷 施工廠商：{hoveredTask.contractorName} ({hoveredTask.contractorPhone || '電話洽設計師'})</div>
            )}
            {hoveredTask.description && (
              <div className="text-slate-500 mt-1 border-t border-slate-200 pt-1">
                📝 {hoveredTask.description}
              </div>
            )}
          </div>
          {hoveredTask.isCriticalPath && (
            <div className="flex items-center gap-1 text-amber-800 font-bold text-[11px] bg-amber-50 border border-amber-200 p-1.5 rounded">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              關鍵要徑節點，延誤將直接衝擊後續工種！
            </div>
          )}
        </div>
      )}
    </div>
  );
};
