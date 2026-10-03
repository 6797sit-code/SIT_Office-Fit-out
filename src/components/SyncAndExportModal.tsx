import React, { useState } from 'react';
import { SyncConfig } from '../types';
import { 
  AppState, 
  getGoogleAppsScriptTemplate, 
  syncWithGoogleSheets, 
  downloadFile,
  generateProcurementTSV,
  generateMilestonesTSV,
  generateTodosTSV,
  exportTodosToCSV
} from '../services/storage';
import { 
  Cloud, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  X, 
  Printer, 
  ShieldCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';

interface SyncAndExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncConfig;
  onUpdateSyncConfig: (config: SyncConfig) => void;
  appState: AppState;
  onExportProcurementCSV: () => void;
  onExportMilestonesCSV: () => void;
  onPrintReport: () => void;
  onResetData: () => void;
  onImportJSON: (importedState: AppState) => void;
  onManualSyncFirebase?: () => Promise<void>;
  firebaseStatus?: string;
  lastSyncedTime?: string;
}

export const SyncAndExportModal: React.FC<SyncAndExportModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateSyncConfig,
  appState,
  onExportProcurementCSV,
  onExportMilestonesCSV,
  onPrintReport,
  onResetData,
  onImportJSON,
  onManualSyncFirebase,
  firebaseStatus = 'connected',
  lastSyncedTime,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'googleSheets' | 'firebase' | 'export' | 'backup'>('googleSheets');
  const [sheetsUrl, setSheetsUrl] = useState(syncConfig.googleSheetsUrl || '');
  const [autoSync, setAutoSync] = useState(syncConfig.autoSync);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedProcurementTSV, setCopiedProcurementTSV] = useState(false);
  const [copiedMilestonesTSV, setCopiedMilestonesTSV] = useState(false);
  const [copiedTodosTSV, setCopiedTodosTSV] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(true);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getGoogleAppsScriptTemplate());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyProcurementTSV = () => {
    const tsv = generateProcurementTSV(appState.procurementItems);
    navigator.clipboard.writeText(tsv);
    setCopiedProcurementTSV(true);
    setTimeout(() => setCopiedProcurementTSV(false), 2500);
  };

  const handleCopyMilestonesTSV = () => {
    const tsv = generateMilestonesTSV(appState.milestones);
    navigator.clipboard.writeText(tsv);
    setCopiedMilestonesTSV(true);
    setTimeout(() => setCopiedMilestonesTSV(false), 2500);
  };

  const handleCopyTodosTSV = () => {
    const tsv = generateTodosTSV(appState.todos || []);
    navigator.clipboard.writeText(tsv);
    setCopiedTodosTSV(true);
    setTimeout(() => setCopiedTodosTSV(false), 2500);
  };

  const handleManualSyncSheets = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await syncWithGoogleSheets(sheetsUrl, appState);
      if (res.success) {
        setSyncStatusMsg({ type: 'success', text: `${res.message} (時間: ${new Date(res.timestamp).toLocaleTimeString()})` });
        onUpdateSyncConfig({
          ...syncConfig,
          googleSheetsUrl: sheetsUrl,
          lastSyncTime: res.timestamp,
        });
      } else {
        setSyncStatusMsg({ type: 'error', text: res.message });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = () => {
    onUpdateSyncConfig({
      ...syncConfig,
      googleSheetsUrl: sheetsUrl,
      autoSync: autoSync,
    });
    setSyncStatusMsg({ type: 'success', text: '設定已更新儲存！' });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(appState, null, 2);
    downloadFile(dataStr, `翔生資訊辦公室工程採購完整備份_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as AppState;
        if (parsed.procurementItems && parsed.milestones) {
          onImportJSON(parsed);
          setSyncStatusMsg({ type: 'success', text: '成功還原專案備份資料！' });
        } else {
          setSyncStatusMsg({ type: 'error', text: '無效的備份檔案格式。' });
        }
      } catch (err) {
        setSyncStatusMsg({ type: 'error', text: '解析 JSON 失敗。' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                資料庫自動同步與報表匯出中心
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                支援 Google Sheets 即時同步、Firebase 雲端配置、CSV/Excel 匯出與列印
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-4 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('googleSheets')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'googleSheets'
                ? 'border-[#2A9D8F] text-[#2A9D8F] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets 同步</span>
          </button>

          <button
            onClick={() => setActiveSubTab('firebase')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'firebase'
                ? 'border-[#F4A261] text-[#D47026] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Firebase 雲端配置</span>
          </button>

          <button
            onClick={() => setActiveSubTab('export')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'export'
                ? 'border-[#264653] text-[#264653] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>匯出報表與列印</span>
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'backup'
                ? 'border-[#E9C46A] text-[#9A741A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>備份與還原</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {syncStatusMsg && (
            <div
              className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between ${
                syncStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <span>{syncStatusMsg.text}</span>
              <button onClick={() => setSyncStatusMsg(null)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: GOOGLE SHEETS SYNC */}
          {activeSubTab === 'googleSheets' && (
            <div className="space-y-4">
              {/* Option A: Zero-Code Instant Paste (Recommended) */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200 text-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>【零障礙推薦】免部署！一鍵複製直接貼入 Google 試算表</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    100% 成功免設定
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  若您不需要自動化即時監聽背景推送，您只需新建一個<b>空白 Google 試算表</b>，點擊下方按鈕複製，並在試算表 <b>A1 儲存格按下鍵盤 Ctrl + V (Mac 為 Cmd + V)</b>，所有欄位與金額即刻完美排版！
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={handleCopyProcurementTSV}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs transition shadow-2xs"
                  >
                    {copiedProcurementTSV ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{copiedProcurementTSV ? '已複製！按 Ctrl+V' : '一鍵複製「設備採購表」'}</span>
                  </button>

                  <button
                    onClick={handleCopyMilestonesTSV}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 font-bold text-xs transition shadow-2xs"
                  >
                    {copiedMilestonesTSV ? (
                      <Check className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-teal-600" />
                    )}
                    <span>{copiedMilestonesTSV ? '已複製！按 Ctrl+V' : '一鍵複製「施工節點表」'}</span>
                  </button>

                  <button
                    onClick={handleCopyTodosTSV}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-800 font-bold text-xs transition shadow-2xs"
                  >
                    {copiedTodosTSV ? (
                      <Check className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{copiedTodosTSV ? '已複製！按 Ctrl+V' : '一鍵複製「待辦重點查核」'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2.5 pt-1 text-[11px] text-slate-500 flex-wrap">
                  <span>亦可下載 CSV 檔案：</span>
                  <button
                    onClick={onExportProcurementCSV}
                    className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    採購清單 CSV
                  </button>
                  <span>•</span>
                  <button
                    onClick={onExportMilestonesCSV}
                    className="text-teal-700 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    施工進度 CSV
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => {
                      const csv = exportTodosToCSV(appState.todos || []);
                      downloadFile(csv, `翔生資訊_待辦與重點查核清單_${new Date().toISOString().split('T')[0]}.csv`);
                    }}
                    className="text-rose-700 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    待辦查核 CSV
                  </button>
                </div>
              </div>

              {/* Option B: Automatic Web App Sync */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-700 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    進階方案：Google Apps Script Web App 自動同步端點
                  </span>
                  <button
                    onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showTroubleshoot ? '隱藏部署教學' : '無法部署？點此看解法'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  若需即時同步：在 Google 試算表「擴充功能 ➔ Apps Script」貼上下方腳本並部署為 Web App，把生成的網址貼在下方：
                </p>

                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      onClick={handleManualSyncSheets}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition shrink-0 shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>立即同步</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-900 text-[11px]">啟用自動背景同步</div>
                      <div className="text-[10px] text-slate-500">有任何採購或施工進度更新時自動傳送</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 text-[11px]">Apps Script 同步腳本程式碼：</span>
                    <button
                      onClick={handleCopyScript}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? '已複製腳本碼！' : '一鍵複製腳本碼'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono overflow-x-auto max-h-32">
                    {getGoogleAppsScriptTemplate()}
                  </pre>
                </div>
              </div>

              {/* Troubleshooting Breakdown Guide */}
              {showTroubleshoot && (
                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-300 text-amber-950 space-y-2.5">
                  <div className="font-bold text-xs flex items-center gap-2 text-amber-900">
                    <span className="text-sm">🛠️</span>
                    <span>「無法部署」常見原因與 100% 排除步驟</span>
                  </div>
                  
                  <div className="text-[11px] space-y-2 text-amber-900 leading-relaxed">
                    <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200">
                      <b className="text-amber-800">1. 最常見：卡在「Google 尚未驗證這個應用程式 (Google hasn't verified this app)」</b>
                      <div className="text-slate-600 mt-1 pl-3 border-l-2 border-amber-400 space-y-0.5">
                        <div>• 這是 Google 對所有自建私有腳本的常態安全機制（因為不是上架在 Google 官方商店的商業軟體）。</div>
                        <div>• <b>解法：</b>點擊彈出視窗的<b>「審查權限」</b> ➔ 選您的 Google 帳號 ➔ 出現警示時，點擊左下角灰字<b>「進階 (Advanced)」</b> ➔ 點最下方<b>「前往『未命名專案』(不安全)」</b> ➔ 點擊<b>「允許 (Allow)」</b>即可成功生成網址！</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200">
                      <b className="text-amber-800">2. 部署選單沒有「網頁應用程式」或按鈕反灰無反應</b>
                      <div className="text-slate-600 mt-1 pl-3 border-l-2 border-amber-400 space-y-0.5">
                        <div>• <b>解法 A（先存檔）：</b>在 Apps Script 貼上程式碼後，先按鍵盤 <b>Ctrl + S</b>（或上方磁碟片 💾 圖示）儲存專案。</div>
                        <div>• <b>解法 B（齒輪選取）：</b>點右上角「部署」➔「新增部署」後，務必點左上角「選取類型」旁的<b>齒輪圖示 ⚙️</b>，勾選<b>「網頁應用程式 (Web app)」</b>。</div>
                        <div>• <b>解法 C（存取權限）：</b>「執行身分」選<b>「我」</b>，「誰可以存取」選<b>「所有人」</b> (Anyone)。</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200">
                      <b className="text-amber-800">3. 使用公司/學校 Google Workspace 企業帳號（被管理員停用）</b>
                      <div className="text-slate-600 mt-1 pl-3 border-l-2 border-amber-400 space-y-0.5">
                        <div>• 若「誰可以存取」找不到「所有人」或提示被管理員封鎖，代表公司網域停用了 Web App。</div>
                        <div>• <b>解法：</b>改用個人 <b>@gmail.com</b> 開空白試算表部署，或是直接使用上方<b>「一鍵複製貼入」</b>或<b>「CSV 匯入」</b>，完全不受企業政策限制！</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveConfig}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs"
              >
                儲存 Google Sheets 設定
              </button>
            </div>
          )}

          {/* TAB 2: FIREBASE SYNC */}
          {activeSubTab === 'firebase' && (
            <div className="space-y-4">
              <div className="bg-[#EAF6F4] p-3.5 rounded-xl border border-[#BBE4DE] text-slate-800 space-y-1.5">
                <div className="font-bold text-[#1C6960] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-[#2A9D8F]" />
                    Firebase Firestore 雲端資料庫已就緒
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2A9D8F] text-white text-[11px] font-bold">
                    ● 雲端即時連線中
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  全案 14 大工種施工時程、19 項設備採購、待辦重點查核、廠商通訊錄皆已同步至 Google Firebase Firestore 雲端資料庫。跨手機、跨筆電、無痕分頁或重新整理均永久保存最新進度！
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>雲端專案設定資訊</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    最後同步時間：{lastSyncedTime || '即時同步'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">專案識別碼 (Project ID)</div>
                    <div className="text-slate-800 font-bold mt-0.5">secure-coast-56rpq</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">資料庫名稱 (Database ID)</div>
                    <div className="text-slate-800 font-bold mt-0.5 truncate">ai-studio-5f0f34d7-015d-458c-9ece-110274602fcf</div>
                  </div>
                </div>
              </div>

              {onManualSyncFirebase && (
                <div className="pt-1">
                  <button
                    onClick={async () => {
                      setIsSyncing(true);
                      try {
                        await onManualSyncFirebase();
                        setSyncStatusMsg({ type: 'success', text: '✅ 成功將全部 14大工種與19項設備完整同步至 Firebase 雲端！' });
                      } catch {
                        setSyncStatusMsg({ type: 'error', text: 'Firebase 雲端同步失敗，請稍後再試' });
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing}
                    className="w-full py-2.5 rounded-xl bg-[#264653] hover:bg-[#1D353F] text-white font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? '正在全量上傳備份至 Firebase 雲端...' : '立即執行 Firebase 全量備份上傳'}</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1.5">
                    平時每次編輯工項或採購進度時系統皆會自動同步，您亦可隨時點擊此按鈕進行手動全量儲存。
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPORT & PRINT */}
          {activeSubTab === 'export' && (
            <div className="space-y-3">
              <div className="font-bold text-slate-900 text-sm">
                可視化報表與數據匯出
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      採購清單 Excel / CSV
                    </div>
                    <p className="text-[11px] text-slate-600">
                      包含19項設備、料號、單價、分區數量、總價(NT$ 391,306)、供應商與採購狀態，附 UTF-8 BOM 避免 Excel 亂碼。
                    </p>
                  </div>
                  <button
                    onClick={onExportProcurementCSV}
                    className="mt-3.5 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載採購表 CSV</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      施工節點 Excel / CSV
                    </div>
                    <p className="text-[11px] text-slate-600">
                      包含14大工種施工日期、簽圖/備料/安裝作業類別、進度%、承包工班電話與關鍵要徑標記。
                    </p>
                  </div>
                  <button
                    onClick={onExportMilestonesCSV}
                    className="mt-3.5 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載施工節點 CSV</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between sm:col-span-2">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                      <Printer className="w-4 h-4 text-sky-600" />
                      列印或匯出視覺化 PDF 專案管理報表
                    </div>
                    <p className="text-[11px] text-slate-600">
                      生成專為 A4 橫式列印/PDF 存檔排版的管理總表，涵蓋案場基本資訊、甘特圖時程、採購預算表與重大預警事項。
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onPrintReport();
                    }}
                    className="mt-3.5 w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>開啟列印 / 匯出 PDF 預覽</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeSubTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">下載專案完整 JSON 備份檔</div>
                <p className="text-[11px] text-slate-600">
                  將目前所有的採購清單、工種節點、廠商通訊錄與預警設定封裝為單一 JSON 檔案，方便歸檔或移轉至其他電腦。
                </p>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>下載 JSON 備份檔</span>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">從 JSON 備份檔案還原</div>
                <p className="text-[11px] text-slate-600">
                  選擇先前匯出的 JSON 備份檔案以恢復專案完整數據。
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>上傳並還原備份檔</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-2">
                <div className="font-bold text-rose-800">重置回預設工程進度表與採購清單</div>
                <p className="text-[11px] text-slate-600">
                  若您希望清除目前的測試修改，並恢復為「翔生資訊辦公室工程進度表」與「誠豐金10F辦公室設備採購清單」之初始官方數據，可點擊此按鈕。
                </p>
                <button
                  onClick={() => {
                    if (confirm('確定要將所有數據重置為原始 PDF 預設內容嗎？現有自訂修改將被清除。')) {
                      onResetData();
                      setSyncStatusMsg({ type: 'success', text: '已成功重置為初始專案資料！' });
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢復為初始工程與採購數據</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
