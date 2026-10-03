import React, { useState, useMemo } from 'react';
import { MilestoneTask, ProjectInfo } from '../types';
import { 
  getCalendarSyncTasks, 
  generateGoogleCalendarUrl, 
  generateICSContent, 
  downloadICS,
  CalendarEventData 
} from '../utils/calendarSync';
import { getTodayDateString, getTodayDisplayDate } from '../utils/date';
import { 
  Calendar, 
  CalendarCheck, 
  AlertTriangle, 
  Clock, 
  Download, 
  ExternalLink, 
  Check, 
  X, 
  Bell, 
  Sparkles, 
  Phone, 
  Flame, 
  Layers,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestones: MilestoneTask[];
  projectInfo: ProjectInfo;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  milestones,
  projectInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'all'>('today');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const todayStr = getTodayDateString();
  const { todayTasks, overdueTasks } = useMemo(() => {
    return getCalendarSyncTasks(milestones, todayStr);
  }, [milestones, todayStr]);

  if (!isOpen) return null;

  // Handle batch .ics download
  const handleDownloadBatchICS = (type: 'today' | 'overdue' | 'all') => {
    let targetTasks: CalendarEventData[] = [];
    let filename = '';

    if (type === 'today') {
      targetTasks = todayTasks;
      filename = `翔生資訊_今日工程排程_${todayStr}.ics`;
    } else if (type === 'overdue') {
      targetTasks = overdueTasks;
      filename = `翔生資訊_逾期工程催辦通知_${todayStr}.ics`;
    } else {
      const allTasks = [...todayTasks, ...overdueTasks];
      targetTasks = allTasks;
      filename = `翔生資訊_今日與逾期工程行事曆_${todayStr}.ics`;
    }

    if (targetTasks.length === 0) {
      alert('目前無相應的工項需要匯出');
      return;
    }

    const icsContent = generateICSContent(targetTasks, projectInfo);
    downloadICS(icsContent, filename);
  };

  const handleOpenGoogleCalendar = (task: CalendarEventData) => {
    const url = generateGoogleCalendarUrl(task);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopySummary = (task: CalendarEventData) => {
    const text = `【工程行事曆備忘】\n項目：${task.title}\n地點：${task.location}\n工期：${task.startDate} ~ ${task.endDate}\n進度：${task.progress}%\n負責工班：${task.contractorName || '施工組'} ${task.contractorPhone || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(task.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs text-white shadow-xs">
              <Calendar className="w-5 h-5 text-indigo-100" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  當日工程行事曆同步與逾期通知
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white">
                  今日基準：{getTodayDisplayDate()} ({todayStr})
                </span>
              </div>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                一鍵同步當日施工工項至個人 Google 日曆、手機行事曆，並內建逾期催辦鬧鐘警示
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

        {/* Quick KPI Strip & Batch Actions */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Counter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'today'
                  ? 'bg-[#EAF6F4] text-[#2A9D8F] border border-[#BBE4DE] shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>今日施工進行中</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'today' ? 'bg-[#2A9D8F] text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {todayTasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'overdue'
                  ? 'bg-[#FDF0ED] text-[#E76F51] border border-[#F8C8BD] shadow-2xs'
                  : 'bg-white text-[#E76F51] hover:text-[#C75336] border border-[#F8C8BD]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>逾期預警催辦</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'overdue' ? 'bg-[#E76F51] text-white' : 'bg-[#FDF0ED] text-[#E76F51]'
              }`}>
                {overdueTasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'all'
                  ? 'bg-[#EBF3F5] text-[#264653] font-bold border border-[#C5DCE2] shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>全部檢視 ({todayTasks.length + overdueTasks.length})</span>
            </button>
          </div>

          {/* Quick Batch Download Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadBatchICS(activeTab)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#264653] text-white hover:bg-[#1D353F] shadow-2xs transition"
              title="下載通用行事曆檔 (.ics)，點擊即可匯入 iPhone / Android / Outlook / Google 行事曆"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>匯出 {activeTab === 'today' ? '今日工項' : activeTab === 'overdue' ? '逾期工項' : '全部工項'} (.ics)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Overdue Alert Notification Banner */}
          {overdueTasks.length > 0 && (activeTab === 'overdue' || activeTab === 'all') && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-rose-900 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-sm text-rose-800 flex items-center gap-2">
                  <span>偵測到 {overdueTasks.length} 項工程超期未完工！</span>
                  <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">
                    優先催辦
                  </span>
                </div>
                <p className="mt-1 text-rose-700 leading-relaxed">
                  以下工項之預定結束日期早於今日基準（{todayStr}）且進度尚未達到 100%。點擊右側「加入 Google 日曆」或「匯出行事曆」可自動設鬧鈴每日提醒工班追趕進度。
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeTab === 'today' && todayTasks.length === 0 && (
            <div className="py-12 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
              <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-slate-700">今日 ({todayStr}) 尚無排定施工節點</p>
              <p className="text-xs text-slate-500 mt-1">可切換至「逾期預警催辦」或「施工進度甘特圖」檢視整體排程</p>
            </div>
          )}

          {activeTab === 'overdue' && overdueTasks.length === 0 && (
            <div className="py-12 text-center text-emerald-700 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <Check className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <p className="font-bold">太棒了！目前所有施工工程均在時限內，無逾期預警項目！</p>
              <p className="text-xs text-emerald-600 mt-1">系統將持續自動比對各工種進度與要徑時限</p>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-3">
            {((activeTab === 'today' ? todayTasks : activeTab === 'overdue' ? overdueTasks : [...overdueTasks, ...todayTasks])).map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  task.isOverdue
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Task Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {task.trade}
                    </span>

                    {task.isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FDF0ED] text-[#E76F51] border border-[#F8C8BD]">
                        <AlertTriangle className="w-3 h-3 text-[#E76F51]" />
                        已逾期 {task.daysOverdue} 天 (預定完工日: {task.endDate})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#EAF6F4] text-[#2A9D8F] border border-[#BBE4DE]">
                        <Clock className="w-3 h-3 text-[#2A9D8F]" />
                        今日進行中
                      </span>
                    )}

                    {task.isCritical && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FDF8EC] text-[#9A741A] border border-[#F6E3B0]">
                        <Flame className="w-3 h-3 text-[#E9C46A] fill-[#E9C46A]" />
                        關鍵要徑
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-slate-500">
                      進度：<strong className="text-[#264653]">{task.progress}%</strong>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {task.title.replace(/🚨【工期逾期催辦】|🔨【施工進度】/g, '')}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {task.startDate} ~ {task.endDate}
                    </span>

                    {task.contractorName && (
                      <span className="flex items-center gap-1 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {task.contractorName} {task.contractorPhone ? `(${task.contractorPhone})` : ''}
                      </span>
                    )}

                    <span className="text-slate-500">
                      地點：{task.location}
                    </span>
                  </div>
                </div>

                {/* Action Buttons for this task */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => handleOpenGoogleCalendar(task)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition"
                    title="在瀏覽器中直接開啟 Google 日曆建立此工項行程"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>加入 Google 日曆</span>
                  </button>

                  <button
                    onClick={() => {
                      const ics = generateICSContent([task], projectInfo);
                      downloadICS(ics, `${task.trade}_${task.startDate}.ics`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition"
                    title="下載單筆行事曆檔 (.ics)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>.ics</span>
                  </button>

                  <button
                    onClick={() => handleCopySummary(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="複製文字摘要 (可發 LINE 給工班或設計師)"
                  >
                    {copiedId === task.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>行事曆同步小訣竅：</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>
                <strong>加入 Google 日曆</strong>：點擊按鈕會自動在新分頁開啟 Google 日曆，並已為您填妥案場地點（誠豐金10F）、工種、工班電話與逾期備註，直接按右上角「儲存」即可。
              </li>
              <li>
                <strong>下載 .ics 通用檔</strong>：支援 iPhone 行事曆、Mac 日曆、Outlook 與 Android 系統，下載後點兩下即可批次匯入手機日曆，並自動啟用 30 分鐘前提醒鬧鐘。
              </li>
              <li>
                <strong>逾期催辦機制</strong>：只要工項預定完工日已過且未標註 100%，系統會自動在每日行事曆開頭加上 🚨 符號，方便每日晨會第一時間追蹤進度！
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            翔生資訊辦公室裝潢工程排程管理
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
