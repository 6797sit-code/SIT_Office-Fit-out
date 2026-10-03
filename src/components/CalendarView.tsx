import React, { useState, useMemo } from 'react';
import { 
  MilestoneTask, 
  ProcurementItem, 
  TradeCategory 
} from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Phone, 
  Filter, 
  Layers, 
  MapPin, 
  Check, 
  Info,
  CalendarCheck,
  AlertCircle,
  Trash2,
  Edit3
} from 'lucide-react';
import { getTodayDateString, getTodayDisplayDate } from '../utils/date';

interface CalendarViewProps {
  milestones: MilestoneTask[];
  procurementItems: ProcurementItem[];
  onSelectMilestone?: (milestone: MilestoneTask) => void;
  onSelectProcurement?: (item: ProcurementItem) => void;
  onOpenCalendarSyncModal?: () => void;
  onDeleteMilestone?: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  milestones,
  procurementItems,
  onSelectMilestone,
  onSelectProcurement,
  onOpenCalendarSyncModal,
  onDeleteMilestone,
}) => {
  const todayStr = getTodayDateString(); // Dynamic Taiwan baseline (2026-10-02)

  // Current view year and month (Default to October 2026, today's month)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 1-12
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [onlyCritical, setOnlyCritical] = useState<boolean>(false);
  const [showProcurementEvents, setShowProcurementEvents] = useState<boolean>(true);

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

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const setMonthDirect = (m: number) => {
    setCurrentYear(2026);
    setCurrentMonth(m);
  };

  // Generate calendar grid days for currentYear and currentMonth
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

    const list: {
      date: Date;
      dateStr: string;
      dayOfMonth: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth === 1 ? 12 : currentMonth - 1;
      const y = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      list.push({
        date: new Date(y, m - 1, d),
        dateStr,
        dayOfMonth: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: new Date(y, m - 1, d).getDay() === 0 || new Date(y, m - 1, d).getDay() === 6,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(currentYear, currentMonth - 1, d);
      list.push({
        date: dayDate,
        dateStr,
        dayOfMonth: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
      });
    }

    // Next month padding to fill complete weeks (42 or 35 cells)
    const remaining = 7 - (list.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = currentMonth === 12 ? 1 : currentMonth + 1;
        const y = currentMonth === 12 ? currentYear + 1 : currentYear;
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDate = new Date(y, m - 1, d);
        list.push({
          date: dayDate,
          dateStr,
          dayOfMonth: d,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
        });
      }
    }

    return list;
  }, [currentYear, currentMonth]);

  // Filtered milestones (依需求排除備料，只呈現工程施工相關)
  const activeMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (m.actionType === '備料') return false;
      if (selectedTrade !== 'all' && m.trade !== selectedTrade) return false;
      if (selectedActionType !== 'all' && m.actionType !== selectedActionType) return false;
      if (onlyCritical && !m.isCriticalPath) return false;
      return true;
    });
  }, [milestones, selectedTrade, selectedActionType, onlyCritical]);

  // Map tasks to dates
  const eventsByDate = useMemo(() => {
    const map: Record<string, { milestones: MilestoneTask[]; procurements: ProcurementItem[] }> = {};

    activeMilestones.forEach((m) => {
      // Loop from start to end date
      const s = new Date(m.startDate);
      const e = new Date(m.endDate);
      const curr = new Date(s);
      while (curr <= e) {
        const y = curr.getFullYear();
        const mon = String(curr.getMonth() + 1).padStart(2, '0');
        const day = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${y}-${mon}-${day}`;

        if (!map[dateStr]) {
          map[dateStr] = { milestones: [], procurements: [] };
        }
        if (!map[dateStr].milestones.some((x) => x.id === m.id)) {
          map[dateStr].milestones.push(m);
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    if (showProcurementEvents) {
      procurementItems.forEach((p) => {
        // Delivery date
        if (p.expectedDeliveryDate) {
          const dStr = p.expectedDeliveryDate;
          if (!map[dStr]) map[dStr] = { milestones: [], procurements: [] };
          if (!map[dStr].procurements.some((x) => x.id === p.id)) {
            map[dStr].procurements.push(p);
          }
        }
        // Installation date
        if (p.installationDate && p.installationDate !== p.expectedDeliveryDate) {
          const iStr = p.installationDate;
          if (!map[iStr]) map[iStr] = { milestones: [], procurements: [] };
          if (!map[iStr].procurements.some((x) => x.id === p.id)) {
            map[iStr].procurements.push(p);
          }
        }
      });
    }

    return map;
  }, [activeMilestones, procurementItems, showProcurementEvents]);

  // Selected date agenda
  const selectedDayEvents = eventsByDate[selectedDateStr] || { milestones: [], procurements: [] };

  const getActionBadgeColor = (actionType: string) => {
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

  return (
    <div className="space-y-4">
      {/* Calendar Top Control Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Month Selector & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition shadow-2xs"
              title="上個月"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-900 min-w-[130px] text-center font-mono">
              {currentYear} 年 {currentMonth} 月
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition shadow-2xs"
              title="下個月"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Month Jumps */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => setMonthDirect(9)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentMonth === 9
                  ? 'bg-[#566B64] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              9月 (拆除木作)
            </button>
            <button
              onClick={() => setMonthDirect(10)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentMonth === 10
                  ? 'bg-[#566B64] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              10月 (油漆水電系統)
            </button>
            <button
              onClick={() => setMonthDirect(11)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentMonth === 11
                  ? 'bg-[#566B64] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              11月 (教室與驗收)
            </button>
          </div>
        </div>

        {/* Milestone Quick Anchors */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => {
              setCurrentYear(2026);
              setCurrentMonth(10);
              setSelectedDateStr(todayStr);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
            今日基準 ({getTodayDisplayDate()})
          </button>

          <button
            onClick={() => {
              setCurrentYear(2026);
              setCurrentMonth(10);
              setSelectedDateStr('2026-10-07');
            }}
            className="px-2.5 py-1.5 rounded-lg font-semibold bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
            title="10/7 現場粗清"
          >
            10/07 粗清
          </button>

          <button
            onClick={() => {
              setCurrentYear(2026);
              setCurrentMonth(10);
              setSelectedDateStr('2026-10-15');
            }}
            className="px-2.5 py-1.5 rounded-lg font-semibold bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
            title="10/15 辦公室OA家具安裝"
          >
            10/15 OA進場
          </button>

          <button
            onClick={() => {
              setCurrentYear(2026);
              setCurrentMonth(11);
              setSelectedDateStr('2026-11-25');
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-[#FDF0ED] text-[#E76F51] border border-[#F8C8BD] hover:bg-[#FAE3DE] transition shadow-2xs"
            title="11/25 完工總驗收"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#E76F51]" />
            11/25 完工總驗收
          </button>

          {onOpenCalendarSyncModal && (
            <button
              onClick={onOpenCalendarSyncModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-[#264653] hover:bg-[#1D353F] text-white shadow-2xs transition"
              title="同步當日工程至個人 Google 日曆與逾期催辦通知"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>行事曆同步與逾期催辦</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Option Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#264653]" />
            工種篩選：
          </span>
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-hidden focus:border-[#264653]"
          >
            <option value="all">所有施工工種 (全部14項)</option>
            {tradeList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">所有施工作業型態</option>
            <option value="施工">施工</option>
            <option value="簽圖">簽圖</option>
            <option value="配管">配管</option>
            <option value="配線">配線</option>
            <option value="裝燈">裝燈</option>
            <option value="粗清">粗清</option>
            <option value="細清">細清</option>
            <option value="安裝">安裝</option>
            <option value="驗收">驗收</option>
          </select>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-amber-800">
            <input
              type="checkbox"
              checked={onlyCritical}
              onChange={(e) => setOnlyCritical(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-amber-600 cursor-pointer"
            />
            <span className="flex items-center gap-1 font-bold">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              僅顯示關鍵要徑 (Critical Path)
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-sky-800">
            <input
              type="checkbox"
              checked={showProcurementEvents}
              onChange={(e) => setShowProcurementEvents(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-sky-600 cursor-pointer"
            />
            <span className="flex items-center gap-1 font-semibold">
              <Truck className="w-3.5 h-3.5 text-sky-600" />
              標註設備到貨/安裝節點
            </span>
          </label>
        </div>
      </div>

      {/* Main Layout: Calendar Grid + Day Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left 3 Columns: Month Calendar Grid */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2 text-xs font-bold text-slate-700">
            <span className="text-rose-600">週日 (日)</span>
            <span>週一 (一)</span>
            <span>週二 (二)</span>
            <span>週三 (三)</span>
            <span>週四 (四)</span>
            <span>週五 (五)</span>
            <span className="text-rose-600">週六 (六)</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 border-b border-slate-200">
            {calendarDays.map((day) => {
              const dayEvents = eventsByDate[day.dateStr] || { milestones: [], procurements: [] };
              const totalEventsCount = dayEvents.milestones.length + dayEvents.procurements.length;
              const isSelected = selectedDateStr === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`min-h-[115px] sm:min-h-[130px] p-1.5 transition flex flex-col justify-between cursor-pointer relative group ${
                    isSelected
                      ? 'bg-[#EBF3F5]/70 ring-2 ring-[#264653] ring-inset z-10'
                      : day.isToday
                      ? 'bg-[#FDF8EC]/90'
                      : !day.isCurrentMonth
                      ? 'bg-slate-100/50 opacity-40'
                      : day.isWeekend
                      ? 'bg-slate-50/50'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  {/* Date Number Strip */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold inline-block px-1.5 py-0.5 rounded font-mono ${
                        day.isToday
                          ? 'bg-[#E9C46A] text-slate-900 font-black shadow-2xs'
                          : isSelected
                          ? 'bg-[#264653] text-white font-bold'
                          : day.isWeekend
                          ? 'text-[#E76F51] font-semibold'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.dayOfMonth}
                    </span>

                    {totalEventsCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                        {totalEventsCount}
                      </span>
                    )}
                  </div>

                  {/* Event Badges List */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    {/* Milestones */}
                    {dayEvents.milestones.slice(0, 3).map((m) => {
                      const badgeClass = getActionBadgeColor(m.actionType);
                      return (
                        <div
                          key={m.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(day.dateStr);
                            if (onSelectMilestone) onSelectMilestone(m);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] truncate flex items-center gap-1 border shadow-2xs ${badgeClass} ${
                            m.isCriticalPath ? 'ring-1 ring-amber-400 font-bold' : ''
                          }`}
                          title={`${m.trade} - ${m.name} (${m.actionType})`}
                        >
                          {m.isCriticalPath && (
                            <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                          <span className="font-bold opacity-80 shrink-0">[{m.actionType}]</span>
                          <span className="truncate">{m.trade}</span>
                        </div>
                      );
                    })}

                    {/* Procurement events */}
                    {showProcurementEvents &&
                      dayEvents.procurements.slice(0, 2).map((p) => {
                        const isDelivery = p.expectedDeliveryDate === day.dateStr;
                        return (
                          <div
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDateStr(day.dateStr);
                              if (onSelectProcurement) onSelectProcurement(p);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] truncate flex items-center gap-1 border ${
                              isDelivery
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                            title={`設備: ${p.name}`}
                          >
                            <Truck className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">
                              {isDelivery ? '到貨: ' : '裝機: '}
                              {p.name}
                            </span>
                          </div>
                        );
                      })}

                    {totalEventsCount > 3 && (
                      <div className="text-[9px] font-bold text-slate-500 pl-1">
                        + 尚有 {totalEventsCount - 3} 項...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: Selected Date Detailed Agenda Drawer */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#264653]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    {selectedDateStr} 施工節點
                  </h3>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {selectedDateStr === todayStr ? '📍 今日工程重點排程' : '當日排定工種與設備'}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF3F5] text-[#264653] border border-[#C5DCE2] font-mono">
                {selectedDayEvents.milestones.length + selectedDayEvents.procurements.length} 項
              </span>
            </div>

            {/* List of Tasks on Selected Date */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {/* Construction Milestones */}
              {selectedDayEvents.milestones.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMilestone && onSelectMilestone(m)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition hover:border-slate-400 ${
                    m.isCriticalPath 
                      ? 'bg-amber-50/50 border-amber-300' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900">
                      {m.trade}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(m.actionType)}`}>
                        {m.actionType}
                      </span>
                      {onDeleteMilestone && (
                        deletingMilestoneId === m.id ? (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="flex items-center gap-1 bg-rose-50 border border-rose-300 rounded px-1.5 py-0.5 shadow-2xs animate-in fade-in"
                          >
                            <span className="text-[10px] text-rose-700 font-bold">刪除？</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteMilestone(m.id);
                                setDeletingMilestoneId(null);
                              }}
                              className="px-1.5 py-0.2 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px]"
                            >
                              確定
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingMilestoneId(null)}
                              className="px-1 py-0.2 rounded bg-white text-slate-700 border border-slate-300 text-[10px]"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingMilestoneId(m.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="刪除此工項"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="font-bold text-slate-800 text-xs mb-1">
                    {m.name}
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1 font-mono text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{m.startDate} ~ {m.endDate}</span>
                    </div>

                    {m.contractorName && (
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span className="truncate">{m.contractorName}</span>
                        {m.contractorPhone && (
                          <a
                            href={`tel:${m.contractorPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-indigo-600 hover:underline"
                          >
                            {m.contractorPhone}
                          </a>
                        )}
                      </div>
                    )}

                    {m.description && (
                      <div className="text-slate-500 text-[10px] border-t border-slate-200/80 pt-1 mt-1">
                        📝 {m.description}
                      </div>
                    )}

                    {m.designerNotes && (
                      <div className="text-emerald-800 text-[10px] bg-emerald-50/80 p-1.5 rounded border border-emerald-200 mt-1 line-clamp-2">
                        📐 {m.designerNotes.split('\n')[0]}
                      </div>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">進度: {m.progress}%</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold border ${
                      m.status === '已完成' 
                        ? 'bg-[#EAF6F4] text-[#2A9D8F] border-[#BBE4DE]' 
                        : m.status === '進行中' 
                        ? 'bg-[#EBF3F5] text-[#264653] border-[#C5DCE2]' 
                        : m.status === '延遲預警'
                        ? 'bg-[#FDF0ED] text-[#E76F51] border-[#F8C8BD]'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}

              {/* Equipment Deliveries on Selected Date */}
              {selectedDayEvents.procurements.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProcurement && onSelectProcurement(p)}
                  className="p-3 rounded-lg border border-sky-200 bg-sky-50 text-xs cursor-pointer hover:border-sky-400 transition"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-sky-900 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      設備進場 / 裝機
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white text-sky-800 font-mono text-[10px] border border-sky-200 font-bold">
                      {p.category}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                    <span>數量: {p.totalQty} 組</span>
                    <span className="font-mono text-emerald-700 font-bold">NT$ {p.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    供應商：{p.vendorName}
                  </div>
                </div>
              ))}

              {selectedDayEvents.milestones.length === 0 && selectedDayEvents.procurements.length === 0 && (
                <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                  當日尚無排定施工或設備到貨節點
                </div>
              )}
            </div>
          </div>

          {/* Quick Date Inspector Footer */}
          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>點擊任務可直接檢視或修改進度</span>
            <span className="text-indigo-600 font-bold font-mono">{selectedDateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
