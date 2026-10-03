import React from 'react';
import { ProjectInfo, ProcurementItem, MilestoneTask, AlertWarning, VendorContact, TodoItem } from '../types';
import { Printer, X, Download, Building2, MapPin, Car, Key, DollarSign, CheckSquare, Square } from 'lucide-react';

interface ReportPrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  projectInfo: ProjectInfo;
  procurementItems: ProcurementItem[];
  milestones: MilestoneTask[];
  alerts: AlertWarning[];
  vendors: VendorContact[];
  todos?: TodoItem[];
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  isOpen,
  onClose,
  projectInfo,
  procurementItems,
  milestones,
  alerts,
  vendors,
  todos = [],
}) => {
  if (!isOpen) return null;

  const totalBudget = procurementItems.reduce((acc, it) => acc + it.subtotal, 0);
  const constructionMilestones = milestones.filter((m) => m.actionType !== '備料');
  const avgMilestoneProgress = Math.round(
    constructionMilestones.reduce((acc, m) => acc + m.progress, 0) / (constructionMilestones.length || 1)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Floating Action Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-4 bg-white border border-slate-200 p-3.5 rounded-xl shadow-lg print:hidden">
        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Printer className="w-4 h-4 text-indigo-600" />
          <span>專案管理報表預覽 (列印版面 / 匯出 PDF)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>立即列印 / 另存為 PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-5xl mx-auto w-full bg-white text-slate-900 rounded-xl p-8 shadow-2xl print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">
                EXECUTIVE PROJECT PROGRESS & PROCUREMENT REPORT
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                翔生資訊辦公室裝潢工程與設備採購整合管理表
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 font-medium">
                <span>📍 地址：{projectInfo.address}</span>
                <span>🅿️ 停車：{projectInfo.parkingInfo}</span>
                <span>🔑 門禁：{projectInfo.securityInfo}</span>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <div>報表生成日期：2026/10/01</div>
              <div>目標完工總驗收：2026/11/25</div>
              <div className="text-slate-900 font-bold mt-1">統包協調：{projectInfo.designerContact}</div>
            </div>
          </div>
        </div>

        {/* Executive KPI Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">設備採購總預算 (含稅)</div>
            <div className="text-lg font-black text-slate-900 font-mono">
              NT$ {totalBudget.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">共 19 項採購品項</div>
          </div>

          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">裝潢工程平均進度</div>
            <div className="text-lg font-black text-indigo-700 font-mono">
              {avgMilestoneProgress}%
            </div>
            <div className="text-[11px] text-slate-600 mt-1">14 項工程工種</div>
          </div>

          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">關鍵要徑衝撞警報</div>
            <div className="text-lg font-black text-rose-600 font-mono">
              {alerts.filter((a) => a.level === 'critical').length} 項高風險
            </div>
            <div className="text-[11px] text-slate-600 mt-1">交期與工序銜接檢核</div>
          </div>

          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">主要工程供應商</div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {vendors.length} 家
            </div>
            <div className="text-[11px] text-slate-600 mt-1">涵蓋網路/視訊/弱電/家具</div>
          </div>
        </div>

        {/* SECTION 1: Procurement Table */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
            <span>一、設備採購清單與分區配置 (誠豐金10F需求清單)</span>
            <span className="text-xs font-mono font-normal">總額 NT$ {totalBudget.toLocaleString()}</span>
          </h2>

          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-1.5 border-r border-slate-300">類別</th>
                <th className="p-1.5 border-r border-slate-300">料號</th>
                <th className="p-1.5 border-r border-slate-300">品項名稱</th>
                <th className="p-1.5 text-right border-r border-slate-300">單價</th>
                <th className="p-1.5 text-center border-r border-slate-300">會議1</th>
                <th className="p-1.5 text-center border-r border-slate-300">會議2</th>
                <th className="p-1.5 text-center border-r border-slate-300">教室</th>
                <th className="p-1.5 text-center border-r border-slate-300">全區</th>
                <th className="p-1.5 text-center border-r border-slate-300">總數</th>
                <th className="p-1.5 text-right border-r border-slate-300">金額合計(含稅)</th>
                <th className="p-1.5 border-r border-slate-300">採購狀態</th>
                <th className="p-1.5">配合廠商</th>
              </tr>
            </thead>
            <tbody>
              {procurementItems.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-1.5 border-r border-slate-300 font-semibold">{item.category}</td>
                  <td className="p-1.5 border-r border-slate-300 font-mono text-[10px]">{item.partNo}</td>
                  <td className="p-1.5 border-r border-slate-300 font-medium">{item.name}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right font-mono">${item.unitPrice.toLocaleString()}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center">{item.qtyMeetingRoom1 || '-'}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center">{item.qtyMeetingRoom2 || '-'}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center">{item.qtyClassroom || '-'}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center">{item.qtyGeneral || '-'}</td>
                  <td className="p-1.5 border-r border-slate-300 text-center font-bold">{item.totalQty}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold">${item.subtotal.toLocaleString()}</td>
                  <td className="p-1.5 border-r border-slate-300 font-semibold">{item.status}</td>
                  <td className="p-1.5 truncate max-w-[120px]">{item.vendorName}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 font-bold border-t-2 border-slate-400">
                <td colSpan={9} className="p-2 text-right">總計金額 (含稅)：</td>
                <td className="p-2 text-right font-mono text-xs">NT$ {totalBudget.toLocaleString()}</td>
                <td colSpan={2} className="p-2">共 19 項</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* SECTION 2: Construction Milestones Highlights */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
            二、工程施工節點關鍵排程 (14項工程工種與驗收)
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {constructionMilestones.filter((m) => m.isCriticalPath || m.progress > 0 || m.actionType === '安裝' || m.actionType === '驗收').map((m) => (
              <div key={m.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{m.trade}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 font-semibold">{m.actionType}</span>
                    {m.isCriticalPath && (
                      <span className="text-[10px] text-amber-700 font-bold">★ 關鍵要徑</span>
                    )}
                  </div>
                  <div className="text-slate-700 font-medium mt-0.5">{m.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    日期：{m.startDate} ~ {m.endDate} ｜ 廠商：{m.contractorName || '-'} ({m.contractorPhone || ''})
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-indigo-700">{m.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Major Alerts & Action Required */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
            三、即時工期衝突與現場預警對策
          </h2>

          <div className="space-y-2 text-xs">
            {alerts.map((a) => (
              <div key={a.id} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>{a.title}</span>
                  <span className="font-mono text-[10px] text-slate-500">日期：{a.relatedDate}</span>
                </div>
                <p className="text-slate-700 mt-0.5">{a.message}</p>
                {a.actionRequired && (
                  <div className="mt-1 font-semibold text-amber-800 text-[11px]">
                    👉 建議對策：{a.actionRequired}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Punch-list / Todo Checklist */}
        {todos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>四、重點待辦與現場查核清單 (天花板破壞還原 / 應拆未拆處理)</span>
              <span className="text-[11px] font-mono text-slate-500 font-normal">
                完成率：{todos.filter(t => t.completed).length} / {todos.length} 項
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {todos.map((t) => (
                <div 
                  key={t.id} 
                  className={`p-2 rounded border ${
                    t.completed ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold">
                      {t.completed ? '☑' : '☐'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] px-1 py-0.2 rounded border font-mono ${
                          t.isUrgent ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {t.category}
                        </span>
                        <span className={t.completed ? 'line-through' : ''}>{t.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                        {t.location && <span>地點: {t.location}</span>}
                        {t.assignedTo && <span>負責: {t.assignedTo}</span>}
                        {t.dueDate && <span>期限: {t.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Signature Strip */}
        <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-xs text-slate-600">
          <div>
            <div>業主簽核 (翔生資訊)：</div>
            <div className="mt-8 border-b border-slate-400 w-40"></div>
          </div>
          <div>
            <div>設計與工務總監 (境寬設計)：</div>
            <div className="mt-8 border-b border-slate-400 w-40"></div>
          </div>
          <div>
            <div>現場機電與設備工程窗口：</div>
            <div className="mt-8 border-b border-slate-400 w-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
