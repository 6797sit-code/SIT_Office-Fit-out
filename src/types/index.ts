export type TradeCategory = 
  | '保護工程'
  | '拆除工程'
  | '木工工程'
  | '油漆工程'
  | '水電工程'
  | '燈具工程'
  | '系統工程'
  | '玻璃隔間工程'
  | '辦公設備工程'
  | '清潔工程'
  | '窗簾工程'
  | '投影機設備工程'
  | '音響設備工程'
  | '冷氣設備工程'
  | '完工驗收';

export type NavigationTab = 'gantt' | 'calendar' | 'procurement' | 'milestones' | 'todos' | 'alerts' | 'vendors';

export type TodoCategory = 
  | '應拆未拆處理' 
  | '破壞還原' 
  | '額外追加工項' 
  | '現場核對查核' 
  | '缺失改善' 
  | '一般待辦';

export interface TodoItem {
  id: string;
  title: string;
  category: TodoCategory;
  trade?: TradeCategory;
  relatedMilestoneId?: string;
  relatedMilestoneName?: string;
  location?: string;
  assignedTo?: string;
  dueDate?: string; // YYYY-MM-DD
  isUrgent?: boolean; // 重點關注
  completed: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ProcurementCategory = '網路設備' | '視訊設備' | '電腦設備' | '茶水設備';

export type ProcurementStatus = 
  | '詢價比價'
  | '已下單'
  | '備料出貨中'
  | '已到貨驗收'
  | '現場安裝中'
  | '已完工上線';

export type MilestoneStatus = '尚未開始' | '進行中' | '已完成' | '延遲預警';

export interface MilestoneTask {
  id: string;
  trade: TradeCategory;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  actionType: '施工' | '簽圖' | '丈量' | '出圖' | '下單' | '備料' | '配管' | '裝燈' | '叫貨' | '到貨' | '粗清' | '細清' | '配線' | '安裝' | '裝機' | '拆包膜' | '插座配置' | '驗收';
  description?: string;
  location?: string;
  progress: number; // 0 - 100
  status: MilestoneStatus;
  contractorId?: string;
  contractorName?: string;
  contractorPhone?: string;
  relatedProcurementIds?: string[];
  isCriticalPath?: boolean;
  designerNotes?: string;
  changeLogs?: DesignerChangeLog[];
  updatedAt?: string;
}

export interface DesignerChangeLog {
  id: string;
  taskId: string;
  taskName: string;
  trade: TradeCategory;
  timestamp: string; // YYYY-MM-DD HH:mm
  author?: string;
  note: string;
  category?: '現場尺寸變更' | '追加工項' | '時程順延' | '材料選定' | '管委會協調' | '驗收交代';
  daysAdjusted?: number;
  newStartDate?: string;
  newEndDate?: string;
  newProgress?: number;
}

export interface ProcurementItem {
  id: string;
  category: ProcurementCategory;
  partNo: string; // 料號 or '新品' or '無料號' or '-'
  name: string;
  specUrl?: string;
  unitPrice: number;
  qtyMeetingRoom1: number; // 會議室-1 (6-8人)
  qtyMeetingRoom2: number; // 會議室-2 (2-4人)
  qtyClassroom: number; // 教學教室 (42人)
  qtyGeneral: number; // 全區
  totalQty: number;
  subtotal: number;
  status: ProcurementStatus;
  orderDate?: string; // YYYY-MM-DD
  expectedDeliveryDate?: string; // YYYY-MM-DD
  actualDeliveryDate?: string; // YYYY-MM-DD
  installationDate?: string; // YYYY-MM-DD
  vendorId?: string;
  vendorName: string;
  vendorPhone?: string;
  invoiceNo?: string;
  notes?: string;
  linkedTrade?: TradeCategory;
  updatedAt?: string;
}

export interface VendorContact {
  id: string;
  name: string;
  serviceCategory: string; // e.g. "網路弱電與伺服器設備", "辦公家具與隔間", "音響與視訊多媒體"
  contactPerson: string;
  phone: string;
  mobile: string;
  email: string;
  lineId?: string;
  address?: string;
  taxId?: string; // 統一編號
  rating?: number;
  notes?: string;
  updatedAt?: string;
}

export interface ProjectInfo {
  name: string;
  address: string;
  parkingInfo: string;
  securityInfo: string;
  designer: string;
  designerContact: string;
  designerPhone: string;
  startDate: string;
  targetEndDate: string;
  budgetTotal: number;
  updatedAt?: string;
}

export interface AlertWarning {
  id: string;
  level: 'critical' | 'warning' | 'info';
  type: 'schedule_conflict' | 'delivery_bottleneck' | 'budget_overrun' | 'milestone_due';
  title: string;
  message: string;
  relatedDate?: string;
  relatedTrade?: TradeCategory;
  relatedItemId?: string;
  actionRequired?: string;
}

export interface SyncConfig {
  autoSync: boolean;
  lastSyncTime?: string;
  googleSheetsUrl?: string;
  firebaseEnabled?: boolean;
  firebaseProjectId?: string;
}
