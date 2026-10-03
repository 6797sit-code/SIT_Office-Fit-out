import React, { useState } from 'react';
import { AlertWarning, MilestoneTask, ProcurementItem } from '../types';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Calendar, 
  Bell, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface AlertCenterProps {
  alerts: AlertWarning[];
  milestones: MilestoneTask[];
  procurementItems: ProcurementItem[];
  onAddAlert: (alert: AlertWarning) => void;
  onDismissAlert: (id: string) => void;
  onOpenCalendarSyncModal?: () => void;
  onOpenDesignerCoordModal?: () => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  alerts,
  milestones,
  procurementItems,
  onAddAlert,
  onDismissAlert,
  onOpenCalendarSyncModal,
  onOpenDesignerCoordModal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newLevel, setNewLevel] = useState<'critical' | 'warning' | 'info'>('warning');
  const [newDate, setNewDate] = useState('2026-10-05');
  const [newAction, setNewAction] = useState('');

  const criticalList = alerts.filter((a) => a.level === 'critical');
  const warningList = alerts.filter((a) => a.level === 'warning');
  const infoList = alerts.filter((a) => a.level === 'info');

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const newAlert: AlertWarning = {
      id: `alt-${Date.now()}`,
      level: newLevel,
      type: 'schedule_conflict',
      title: newTitle.trim(),
      message: newMessage.trim(),
      relatedDate: newDate,
      actionRequired: newAction.trim() || undefined,
    };

    onAddAlert(newAlert);
    setNewTitle('');
    setNewMessage('');
    setNewAction('');
    setShowAddModal(false);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-[#E76F51]" />,
          badge: 'bg-[#FDF0ED] text-[#E76F51] border-[#F8C8BD]',
          border: 'border-[#F8C8BD] bg-white',
          title: '🚨 高度緊急風險',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-[#D47026]" />,
          badge: 'bg-[#FEF5EF] text-[#D47026] border-[#FCD8BE]',
          border: 'border-[#FCD8BE] bg-white',
          title: '⚠️ 工期/交期預警',
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-[#2A9D8F]" />,
          badge: 'bg-[#EAF6F4] text-[#2A9D8F] border-[#BBE4DE]',
          border: 'border-[#BBE4DE] bg-white',
          title: '💡 案場營運提醒',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Add */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FDF0ED] text-[#E76F51] border border-[#F8C8BD]">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                即時工期衝突與採購交期預警中心
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                自動比對施工關鍵要徑、採購前置天數、工班跨工種銜接與案場管委會規範
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCalendarSyncModal && (
            <button
              onClick={onOpenCalendarSyncModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#EFF2F4] hover:bg-[#E2E8EC] text-[#465E6B] border border-[#D1DCE2] shadow-2xs transition"
              title="將逾期與今日工程同步至個人行事曆並設定鬧鈴"
            >
              <Calendar className="w-4 h-4 text-[#5E7A88]" />
              <span>逾期催辦與行事曆同步</span>
            </button>
          )}

          {onOpenDesignerCoordModal && (
            <button
              onClick={onOpenDesignerCoordModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#EAF0EE] hover:bg-[#DEE7E4] text-[#426159] border border-[#CCD8D4] shadow-2xs transition"
              title="與設計師溝通調整工項與工期"
            >
              <MessageSquare className="w-4 h-4 text-[#566B64]" />
              <span>設計師工項速調</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#264653] hover:bg-[#1D353F] text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>建立自訂工程提醒 / 預警</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#FDF0ED] border border-[#F8C8BD] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-[#FAE0D9] text-[#E76F51]">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs text-[#B83E23] font-semibold">高危衝撞節點</div>
              <div className="text-xl font-black text-[#E76F51] font-mono">{criticalList.length} 項</div>
            </div>
          </div>
          <span className="text-[11px] text-[#B83E23] font-bold bg-[#FAE0D9] px-2 py-0.5 rounded">需今日處置</span>
        </div>

        <div className="bg-[#FEF5EF] border border-[#FCD8BE] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-[#FCE5D4] text-[#D47026]">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs text-[#A85012] font-semibold">前置交期監控</div>
              <div className="text-xl font-black text-[#D47026] font-mono">{warningList.length} 項</div>
            </div>
          </div>
          <span className="text-[11px] text-[#A85012] font-bold bg-[#FCE5D4] px-2 py-0.5 rounded">未來7日內到期</span>
        </div>

        <div className="bg-[#EAF6F4] border border-[#BBE4DE] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-[#D3EFEA] text-[#2A9D8F]">
              <Info className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs text-[#1C6960] font-semibold">門禁停車與規範</div>
              <div className="text-xl font-black text-[#2A9D8F] font-mono">{infoList.length} 項</div>
            </div>
          </div>
          <span className="text-[11px] text-[#1C6960] font-bold bg-[#D3EFEA] px-2 py-0.5 rounded">大樓配合要點</span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const style = getLevelBadge(alert.level);
          return (
            <div
              key={alert.id}
              className={`border rounded-xl p-4 transition shadow-xs flex flex-col justify-between ${style.border}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{style.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        {alert.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.badge}`}>
                        {style.title}
                      </span>
                      {alert.relatedDate && (
                        <span className="text-[11px] font-mono text-slate-600 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          關鍵節點日：{alert.relatedDate}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                      {alert.message}
                    </p>

                    {alert.actionRequired && (
                      <div className="mt-2.5 text-xs bg-white border border-slate-200 rounded-lg p-2.5 flex items-start gap-2 text-slate-800 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-800">建議對策行動：</span>
                          {alert.actionRequired}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition shrink-0 shadow-2xs"
                  title="解除或標記為已處理"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
            目前所有施工工序與設備交期均在受控範圍內，無異常警報！
          </div>
        )}
      </div>

      {/* Modal to Add Custom Alert */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              新增工程預警或施工提醒
            </h3>

            <form onSubmit={handleCreateAlert} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">風險等級</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewLevel('critical')}
                    className={`py-1.5 rounded-lg border font-bold text-xs ${
                      newLevel === 'critical'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🚨 高度緊急
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewLevel('warning')}
                    className={`py-1.5 rounded-lg border font-bold text-xs ${
                      newLevel === 'warning'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    ⚠️ 預警檢核
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewLevel('info')}
                    className={`py-1.5 rounded-lg border font-bold text-xs ${
                      newLevel === 'info'
                        ? 'bg-sky-100 text-sky-800 border-sky-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    💡 一般提醒
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">提醒標題 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 辦公室冷氣排水測試、門禁卡申請..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">關鍵日期</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">警示內容說明 *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="詳細描述工序前後相依性、潛在衝撞風險或交期瓶頸..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">建議對策行動 (選填)</label>
                <input
                  type="text"
                  placeholder="例如: 請工務主任於10/5前聯絡廠商確認..."
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
