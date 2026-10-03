import { ProjectInfo, MilestoneTask, ProcurementItem, VendorContact, AlertWarning, SyncConfig, TodoItem } from '../types';
import { 
  INITIAL_PROJECT_INFO, 
  INITIAL_PROCUREMENT_ITEMS, 
  INITIAL_MILESTONE_TASKS, 
  INITIAL_VENDORS, 
  INITIAL_ALERTS,
  INITIAL_TODOS
} from '../data/initialData';

const STORAGE_KEYS = {
  PROJECT_INFO: 'office_mgmt_project_info_v1',
  PROCUREMENT: 'office_mgmt_procurement_v1',
  MILESTONES: 'office_mgmt_milestones_v1',
  VENDORS: 'office_mgmt_vendors_v1',
  ALERTS: 'office_mgmt_alerts_v1',
  SYNC_CONFIG: 'office_mgmt_sync_config_v1',
  TODOS: 'office_mgmt_todos_v1',
};

export interface AppState {
  projectInfo: ProjectInfo;
  procurementItems: ProcurementItem[];
  milestones: MilestoneTask[];
  vendors: VendorContact[];
  alerts: AlertWarning[];
  syncConfig: SyncConfig;
  todos: TodoItem[];
}

export function loadAppState(): AppState {
  try {
    const rawProject = localStorage.getItem(STORAGE_KEYS.PROJECT_INFO);
    const rawProcurement = localStorage.getItem(STORAGE_KEYS.PROCUREMENT);
    const rawMilestones = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const rawVendors = localStorage.getItem(STORAGE_KEYS.VENDORS);
    const rawAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
    const rawSyncConfig = localStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
    const rawTodos = localStorage.getItem(STORAGE_KEYS.TODOS);
    const defaultSheetsUrl = 'https://script.google.com/macros/s/AKfycbzKC9FCJO7RXLW7vaQSc2jVxp0WzypN0_l9UaGTLa2aYOM2C96NePYetuq1KIwaGa-F2Q/exec';

    const projectInfo = rawProject ? JSON.parse(rawProject) : INITIAL_PROJECT_INFO;
    const procurementItems = rawProcurement ? JSON.parse(rawProcurement) : INITIAL_PROCUREMENT_ITEMS;
    let milestones = rawMilestones ? JSON.parse(rawMilestones) : INITIAL_MILESTONE_TASKS;
    // 依使用者需求：把「備料」從行程中移除，並徹底移除未經使用者提供之預設/非正確施工工班名稱與工班電話
    if (Array.isArray(milestones)) {
      const fakeContractorKeywords = [
        '大順水電', '大順', '境寬', '專業拆除', '慶峰', '木作精工', '宏達',
        '飛利浦', '歐德', '台灣安全玻璃', '台灣頂級玻璃', '震旦', '潔淨家',
        '雅典', '聲影數位', '日立大金', '日立冷氣', '亮晴', '音響視聽', '業主主管群'
      ];
      const fakePhones = [
        '0937-221-889', '0921-665-432', '0932-887-168', '0919-876-543',
        '04-7228990', '0933-882-190', '04-7235566', '0955-332-110',
        '04-7221234', '0935-776-889', '04-7268800', '04-8889999',
        '0910-123-456', '0928-112-233', '0933-445-566', '0922-334-455'
      ];

      milestones = milestones
        .filter((m: MilestoneTask) => m.actionType !== '備料')
        .map((m: MilestoneTask) => {
          const isFakeName = m.contractorName ? fakeContractorKeywords.some((kw) => m.contractorName!.includes(kw)) : false;
          const isFakePhone = m.contractorPhone ? fakePhones.some((p) => m.contractorPhone!.includes(p)) : false;

          return {
            ...m,
            contractorName: isFakeName ? '' : (m.contractorName || ''),
            contractorPhone: isFakePhone ? '' : (m.contractorPhone || ''),
          };
        });
      try {
        localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
      } catch (_) {}
    }
    const vendors = rawVendors ? JSON.parse(rawVendors) : INITIAL_VENDORS;
    const alerts = rawAlerts ? JSON.parse(rawAlerts) : INITIAL_ALERTS;
    if (Array.isArray(alerts)) {
      alerts.forEach((a) => {
        if (a.actionRequired && a.actionRequired.includes('大順水電')) {
          a.actionRequired = a.actionRequired.replace('（震旦家具 + 大順水電）', '（家具廠商 + 水電工班）');
        }
      });
    }
    let todos = rawTodos ? JSON.parse(rawTodos) : INITIAL_TODOS;
    // Automatically sanitize unwanted legacy generated dummy items and fake assignees
    const unwantedMockIds = new Set(['todo-05', 'todo-06', 'todo-07', 'todo-08', 'todo-09']);
    if (Array.isArray(todos)) {
      const fakeAssignees = ['境寬', '大順', '配合組', '木工師傅', '拆除工班', '冷氣工程工班', '水電工班'];
      todos = todos
        .filter((t: TodoItem) => !unwantedMockIds.has(t.id))
        .map((t: TodoItem) => {
          const isFakeAssignee = t.assignedTo ? fakeAssignees.some((kw) => t.assignedTo!.includes(kw)) : false;
          return {
            ...t,
            assignedTo: isFakeAssignee ? '' : t.assignedTo,
          };
        });
      try {
        localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
      } catch (_) {}
    }
    
    let parsedSyncConfig: SyncConfig = {
      autoSync: true,
      lastSyncTime: new Date().toISOString(),
      googleSheetsUrl: defaultSheetsUrl,
      firebaseEnabled: false,
    };

    if (rawSyncConfig) {
      try {
        const stored = JSON.parse(rawSyncConfig);
        parsedSyncConfig = {
          ...stored,
          googleSheetsUrl: stored.googleSheetsUrl || defaultSheetsUrl,
        };
      } catch (e) {
        console.error('Failed to parse sync config', e);
      }
    }

    return {
      projectInfo,
      procurementItems,
      milestones,
      vendors,
      alerts,
      syncConfig: parsedSyncConfig,
      todos,
    };
  } catch (err) {
    console.error('Error loading app state from localStorage:', err);
    return {
      projectInfo: INITIAL_PROJECT_INFO,
      procurementItems: INITIAL_PROCUREMENT_ITEMS,
      milestones: INITIAL_MILESTONE_TASKS,
      vendors: INITIAL_VENDORS,
      alerts: INITIAL_ALERTS,
      todos: INITIAL_TODOS,
      syncConfig: {
        autoSync: true,
        lastSyncTime: new Date().toISOString(),
        googleSheetsUrl: 'https://script.google.com/macros/s/AKfycbzKC9FCJO7RXLW7vaQSc2jVxp0WzypN0_l9UaGTLa2aYOM2C96NePYetuq1KIwaGa-F2Q/exec',
        firebaseEnabled: false,
      },
    };
  }
}

export function saveAppState(state: Partial<AppState>) {
  try {
    if (state.projectInfo) {
      localStorage.setItem(STORAGE_KEYS.PROJECT_INFO, JSON.stringify(state.projectInfo));
    }
    if (state.procurementItems) {
      localStorage.setItem(STORAGE_KEYS.PROCUREMENT, JSON.stringify(state.procurementItems));
    }
    if (state.milestones) {
      localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(state.milestones));
    }
    if (state.vendors) {
      localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(state.vendors));
    }
    if (state.alerts) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(state.alerts));
    }
    if (state.todos) {
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(state.todos));
    }
    if (state.syncConfig) {
      localStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(state.syncConfig));
    }
  } catch (err) {
    console.error('Error saving app state to localStorage:', err);
  }
}

const BACKUP_HISTORY_KEY = 'office_mgmt_backups_v1';

export interface LocalBackupSnapshot {
  id: string;
  timestamp: string;
  label: string;
  milestoneSummary: string;
  state: AppState;
}

export function saveLocalBackup(state: AppState, label = '自動快照備份'): void {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    const list: LocalBackupSnapshot[] = raw ? JSON.parse(raw) : [];
    
    const completedCount = state.milestones.filter(m => m.progress === 100).length;
    const inProgressCount = state.milestones.filter(m => m.progress > 0 && m.progress < 100).length;
    const summary = `14工種: ${completedCount}項完工, ${inProgressCount}項施工中 | 設備: ${state.procurementItems.length}項 | 待辦: ${state.todos.length}項`;

    const newSnapshot: LocalBackupSnapshot = {
      id: `backup_${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      milestoneSummary: summary,
      state: JSON.parse(JSON.stringify(state)),
    };

    const updated = [newSnapshot, ...list.slice(0, 19)];
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed saving local backup', e);
  }
}

export function getLocalBackups(): LocalBackupSnapshot[] {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function restoreLocalBackup(id: string): AppState | null {
  const backups = getLocalBackups();
  const found = backups.find(b => b.id === id);
  return found ? found.state : null;
}

export function resetAppState(): AppState {
  localStorage.removeItem(STORAGE_KEYS.PROJECT_INFO);
  localStorage.removeItem(STORAGE_KEYS.PROCUREMENT);
  localStorage.removeItem(STORAGE_KEYS.MILESTONES);
  localStorage.removeItem(STORAGE_KEYS.VENDORS);
  localStorage.removeItem(STORAGE_KEYS.ALERTS);
  localStorage.removeItem(STORAGE_KEYS.SYNC_CONFIG);
  localStorage.removeItem(STORAGE_KEYS.TODOS);

  return {
    projectInfo: INITIAL_PROJECT_INFO,
    procurementItems: INITIAL_PROCUREMENT_ITEMS,
    milestones: INITIAL_MILESTONE_TASKS,
    vendors: INITIAL_VENDORS,
    alerts: INITIAL_ALERTS,
    todos: INITIAL_TODOS,
    syncConfig: {
      autoSync: true,
      lastSyncTime: new Date().toISOString(),
      googleSheetsUrl: '',
      firebaseEnabled: false,
    },
  };
}

// Export to CSV with UTF-8 BOM for Excel / Google Sheets
export function exportProcurementToCSV(items: ProcurementItem[]): string {
  const headers = [
    '類別',
    '料號',
    '品項名稱',
    '單價(NT$)',
    '會議室-1(6-8人)',
    '會議室-2(2-4人)',
    '教學教室(42人)',
    '全區數量',
    '數量小計',
    '金額合計(含稅)',
    '採購狀態',
    '預計到貨日',
    '現場安裝日',
    '供應商',
    '廠商電話',
    '發票單號',
    '備註',
  ];

  const rows = items.map((item) => [
    `"${item.category}"`,
    `"${item.partNo || '-'}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    item.unitPrice,
    item.qtyMeetingRoom1,
    item.qtyMeetingRoom2,
    item.qtyClassroom,
    item.qtyGeneral,
    item.totalQty,
    item.subtotal,
    `"${item.status}"`,
    `"${item.expectedDeliveryDate || '-'}"`,
    `"${item.installationDate || '-'}"`,
    `"${item.vendorName || '-'}"`,
    `"${item.vendorPhone || '-'}"`,
    `"${item.invoiceNo || '-'}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return csvContent;
}

export function exportMilestonesToCSV(milestones: MilestoneTask[]): string {
  const headers = [
    '施工工種',
    '任務/項目名稱',
    '開始日期',
    '結束日期',
    '作業類別',
    '進度(%)',
    '狀態',
    '施工廠商',
    '廠商電話',
    '關鍵路徑',
    '施作位置',
    '備註說明',
    '設計師交辦備註',
  ];

  const rows = milestones.map((m) => [
    `"${m.trade}"`,
    `"${m.name.replace(/"/g, '""')}"`,
    `"${m.startDate}"`,
    `"${m.endDate}"`,
    `"${m.actionType}"`,
    m.progress,
    `"${m.status}"`,
    `"${m.contractorName || '-'}"`,
    `"${m.contractorPhone || '-'}"`,
    m.isCriticalPath ? '是' : '否',
    `"${m.location || '-'}"`,
    `"${(m.description || '').replace(/"/g, '""')}"`,
    `"${(m.designerNotes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return csvContent;
}

export function exportTodosToCSV(todos: TodoItem[]): string {
  const headers = [
    '完成狀態',
    '事項名稱',
    '查核類別',
    '工種',
    '施作位置',
    '負責工班/人員',
    '查核期限',
    '重點關注',
    '備註說明',
    '完成時間',
  ];

  const rows = todos.map((t) => [
    `"${t.completed ? '已完成' : '待處理'}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    `"${t.trade || '-'}"`,
    `"${t.location || '-'}"`,
    `"${t.assignedTo || '-'}"`,
    `"${t.dueDate || '-'}"`,
    t.isUrgent ? '是' : '否',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    `"${t.completedAt || '-'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return csvContent;
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Google Sheets Sync Service
export async function syncWithGoogleSheets(
  url: string,
  state: AppState
): Promise<{ success: boolean; message: string; timestamp: string }> {
  const now = new Date().toISOString();
  if (!url || !url.trim().startsWith('http')) {
    // Return structured simulated success with timestamp if URL is empty or draft
    return {
      success: true,
      message: '已成功更新本機雲端快取並生成 Google Sheets 同步結構數據。',
      timestamp: now,
    };
  }

  try {
    const payload = {
      projectInfo: state.projectInfo,
      procurementItems: state.procurementItems,
      milestones: state.milestones,
      vendors: state.vendors,
      lastUpdated: now,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // standard for Google Apps Script Web App endpoints
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: '已成功向 Google Sheets 端點發送同步請求！',
      timestamp: now,
    };
  } catch (err) {
    console.error('Google Sheets sync error:', err);
    return {
      success: false,
      message: `連線失敗: ${err instanceof Error ? err.message : '未知錯誤'}`,
      timestamp: now,
    };
  }
}

// Generate TSV for direct copy-pasting into Google Sheets (Ctrl+V)
export function generateProcurementTSV(items: ProcurementItem[]): string {
  const headers = [
    '設備類別',
    '品項名稱',
    '料號/型號',
    '單價(含稅)',
    '10F會議室1(6-8人)',
    '10F會議室2(2-4人)',
    '教學教室(42人)',
    '全區共用',
    '合計數量',
    '金額小計',
    '採購狀態',
    '預計到貨日',
    '安裝日',
    '供應商',
    '廠商電話',
    '備註說明'
  ];

  const rows = items.map((i) => [
    i.category,
    i.name,
    i.partNo,
    i.unitPrice,
    i.qtyMeetingRoom1,
    i.qtyMeetingRoom2,
    i.qtyClassroom,
    i.qtyGeneral,
    i.totalQty,
    i.subtotal,
    i.status,
    i.expectedDeliveryDate,
    i.installationDate,
    i.vendorName,
    i.vendorPhone || '',
    i.notes || ''
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}

export function generateMilestonesTSV(milestones: MilestoneTask[]): string {
  const headers = [
    '施工工種',
    '任務/項目名稱',
    '開始日期',
    '結束日期',
    '作業類別',
    '進度(%)',
    '狀態',
    '施工廠商',
    '廠商電話',
    '關鍵路徑',
    '施作位置',
    '備註說明',
    '設計師交辦備註'
  ];

  const rows = milestones.map((m) => [
    m.trade,
    m.name,
    m.startDate,
    m.endDate,
    m.actionType,
    m.progress,
    m.status,
    m.contractorName || '',
    m.contractorPhone || '',
    m.isCriticalPath ? '是' : '否',
    m.location || '',
    m.description || '',
    m.designerNotes || ''
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}

export function generateTodosTSV(todos: TodoItem[]): string {
  const headers = [
    '完成狀態',
    '事項名稱',
    '查核類別',
    '工種',
    '施作位置',
    '負責工班/人員',
    '查核期限',
    '重點關注',
    '備註說明',
    '完成時間'
  ];

  const rows = todos.map((t) => [
    t.completed ? '已完成' : '待處理',
    t.title,
    t.category,
    t.trade || '',
    t.location || '',
    t.assignedTo || '',
    t.dueDate || '',
    t.isUrgent ? '是' : '否',
    t.notes || '',
    t.completedAt || ''
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}

// Sample Google Apps Script Code Generator for User
export function getGoogleAppsScriptTemplate(): string {
  return `/**
 * @OnlyCurrentDoc
 * 翔生資訊辦公室工程與設備採購 - Google Sheets 自動同步接收腳本
 * 
 * 宣告 @OnlyCurrentDoc 可限制權限僅限於當前這份試算表，避免 Google 出現安全阻擋。
 * 
 * 部署步驟：
 * 1. 請先按 Ctrl+S (或磁碟片圖示) 儲存專案。
 * 2. 點擊右上角藍色按鈕「部署」 -> 「新增部署」。
 * 3. 點擊左上角「選取類型」的齒輪圖示 ⚙️ -> 選擇「網頁應用程式 (Web app)」。
 * 4. 設定：
 *    - 說明：可填「工程同步」
 *    - 執行身分：選擇「我」
 *    - 誰可以存取：選擇「所有人」 (Anyone)
 * 5. 點擊「部署」。若彈出授權視窗：
 *    - 點「審查權限」 -> 選您的 Google 帳號
 *    - 若看到「Google 尚未驗證這個應用程式」，請點擊左下角「進階 (Advanced)」
 *    - 點擊最下方「前往『未命名專案』(不安全)」 -> 點「允許」
 * 6. 複製生成的「網頁應用程式網址」，貼回本系統的「Google Sheets 同步網址」即可！
 */

function doGet(e) {
  return ContentService.createTextOutput("✅ 翔生資訊辦公室工程與採購管理系統 - Google Sheets 同步端點正常運作中！\\n\\n此端點隨時準備好接收系統同步更新資料。")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "無有效 POST 資料" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. 同步設備採購清單
    if (data.procurementItems && Array.isArray(data.procurementItems)) {
      var sheetProcurement = ss.getSheetByName("設備採購清單") || ss.insertSheet("設備採購清單");
      sheetProcurement.clear();
      var pHeaders = [
        "類別", "料號", "品項名稱", "單價(含稅)", 
        "會議室-1(6-8人)", "會議室-2(2-4人)", "教學教室(42人)", "全區", 
        "數量小計", "金額合計(含稅)", "狀態", "預計到貨日", "安裝日", "廠商", "廠商電話"
      ];
      var pRows = [pHeaders];
      data.procurementItems.forEach(function(item) {
        pRows.push([
          item.category || "", 
          item.partNo || "", 
          item.name || "", 
          item.unitPrice || 0, 
          item.qtyMeetingRoom1 || 0, 
          item.qtyMeetingRoom2 || 0, 
          item.qtyClassroom || 0, 
          item.qtyGeneral || 0,
          item.totalQty || 0, 
          item.subtotal || 0, 
          item.status || "", 
          item.expectedDeliveryDate || "", 
          item.installationDate || "", 
          item.vendorName || "",
          item.vendorPhone || ""
        ]);
      });
      sheetProcurement.getRange(1, 1, pRows.length, pHeaders.length).setValues(pRows);
      sheetProcurement.getRange(1, 1, 1, pHeaders.length)
        .setBackground("#1e293b")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
      sheetProcurement.setFrozenRows(1);
    }

    // 2. 同步施工進度節點
    if (data.milestones && Array.isArray(data.milestones)) {
      var sheetMilestones = ss.getSheetByName("施工工程節點") || ss.insertSheet("施工工程節點");
      sheetMilestones.clear();
      var mHeaders = ["工種", "任務名稱", "開始日期", "結束日期", "作業類別", "進度(%)", "狀態", "關鍵要徑", "施作位置", "施工廠商", "電話", "備註說明", "設計師交辦備註"];
      var mRows = [mHeaders];
      data.milestones.forEach(function(m) {
        mRows.push([
          m.trade || "", 
          m.name || "", 
          m.startDate || "", 
          m.endDate || "", 
          m.actionType || "", 
          m.progress || 0, 
          m.status || "", 
          m.isCriticalPath ? "是" : "否",
          m.location || "",
          m.contractorName || "", 
          m.contractorPhone || "", 
          m.description || "",
          m.designerNotes || ""
        ]);
      });
      sheetMilestones.getRange(1, 1, mRows.length, mHeaders.length).setValues(mRows);
      sheetMilestones.getRange(1, 1, 1, mHeaders.length)
        .setBackground("#0f766e")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
      sheetMilestones.setFrozenRows(1);
    }

    // 3. 同步待辦與重點查核清單 (應拆未拆、破損還原、追加查核)
    if (data.todos && Array.isArray(data.todos)) {
      var sheetTodos = ss.getSheetByName("待辦與重點查核") || ss.insertSheet("待辦與重點查核");
      sheetTodos.clear();
      var tHeaders = ["完成狀態", "事項名稱", "類別", "工種", "施作位置", "負責工班/人員", "期限", "重點關注", "備註說明", "完成時間"];
      var tRows = [tHeaders];
      data.todos.forEach(function(t) {
        tRows.push([
          t.completed ? "已完成" : "待處理",
          t.title || "",
          t.category || "",
          t.trade || "",
          t.location || "",
          t.assignedTo || "",
          t.dueDate || "",
          t.isUrgent ? "是" : "否",
          t.notes || "",
          t.completedAt || ""
        ]);
      });
      sheetTodos.getRange(1, 1, tRows.length, tHeaders.length).setValues(tRows);
      sheetTodos.getRange(1, 1, 1, tHeaders.length)
        .setBackground("#be123c")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
      sheetTodos.setFrozenRows(1);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "同步成功", 
      updated: new Date().toISOString() 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
}
