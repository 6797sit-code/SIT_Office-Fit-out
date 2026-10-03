import React, { useState, useEffect } from 'react';
import { 
  ProcurementItem, 
  MilestoneTask, 
  VendorContact, 
  ProcurementCategory, 
  TradeCategory, 
  ProcurementStatus,
  MilestoneStatus
} from '../types';
import { X, Save, Plus, FileSpreadsheet, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'procurement' | 'milestone';
  editingProcurement: ProcurementItem | null;
  editingMilestone: MilestoneTask | null;
  vendors: VendorContact[];
  onSaveProcurement: (item: ProcurementItem) => void;
  onSaveMilestone: (task: MilestoneTask) => void;
  onDeleteMilestone?: (id: string) => void;
  onDeleteProcurement?: (id: string) => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  editingProcurement,
  editingMilestone,
  vendors,
  onSaveProcurement,
  onSaveMilestone,
  onDeleteMilestone,
  onDeleteProcurement,
}) => {
  const [activeMode, setActiveMode] = useState<'procurement' | 'milestone'>(initialMode);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Procurement item form state
  const [pCategory, setPCategory] = useState<ProcurementCategory>('網路設備');
  const [pPartNo, setPPartNo] = useState('');
  const [pName, setPName] = useState('');
  const [pSpecUrl, setPSpecUrl] = useState('');
  const [pUnitPrice, setPUnitPrice] = useState<number>(0);
  const [pQtyRoom1, setPQtyRoom1] = useState<number>(0);
  const [pQtyRoom2, setPQtyRoom2] = useState<number>(0);
  const [pQtyClass, setPQtyClass] = useState<number>(0);
  const [pQtyGen, setPQtyGen] = useState<number>(0);
  const [pStatus, setPStatus] = useState<ProcurementStatus>('已下單');
  const [pOrderDate, setPOrderDate] = useState('2026-09-20');
  const [pDeliveryDate, setPDeliveryDate] = useState('2026-10-05');
  const [pInstallDate, setPInstallDate] = useState('2026-10-09');
  const [pVendorName, setPVendorName] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [pLinkedTrade, setPLinkedTrade] = useState<TradeCategory>('水電工程');

  // Milestone task form state
  const [mTrade, setMTrade] = useState<TradeCategory>('水電工程');
  const [mName, setMName] = useState('');
  const [mStartDate, setMStartDate] = useState('2026-10-05');
  const [mEndDate, setMEndDate] = useState('2026-10-08');
  const [mActionType, setMActionType] = useState<any>('施工');
  const [mProgress, setMProgress] = useState<number>(0);
  const [mStatus, setMStatus] = useState<MilestoneStatus>('尚未開始');
  const [mContractorName, setMContractorName] = useState('');
  const [mContractorPhone, setMContractorPhone] = useState('');
  const [mIsCritical, setMIsCritical] = useState<boolean>(false);
  const [mDesc, setMDesc] = useState('');

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [isOpen, editingMilestone, editingProcurement]);

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (editingProcurement) {
      setActiveMode('procurement');
      setPCategory(editingProcurement.category);
      setPPartNo(editingProcurement.partNo);
      setPName(editingProcurement.name);
      setPSpecUrl(editingProcurement.specUrl || '');
      setPUnitPrice(editingProcurement.unitPrice);
      setPQtyRoom1(editingProcurement.qtyMeetingRoom1);
      setPQtyRoom2(editingProcurement.qtyMeetingRoom2);
      setPQtyClass(editingProcurement.qtyClassroom);
      setPQtyGen(editingProcurement.qtyGeneral);
      setPStatus(editingProcurement.status);
      setPOrderDate(editingProcurement.orderDate || '2026-09-20');
      setPDeliveryDate(editingProcurement.expectedDeliveryDate || '2026-10-05');
      setPInstallDate(editingProcurement.installationDate || '2026-10-09');
      setPVendorName(editingProcurement.vendorName || '');
      setPNotes(editingProcurement.notes || '');
      if (editingProcurement.linkedTrade) setPLinkedTrade(editingProcurement.linkedTrade);
    }
  }, [editingProcurement]);

  useEffect(() => {
    if (editingMilestone) {
      setActiveMode('milestone');
      setMTrade(editingMilestone.trade);
      setMName(editingMilestone.name);
      setMStartDate(editingMilestone.startDate);
      setMEndDate(editingMilestone.endDate);
      setMActionType(editingMilestone.actionType);
      setMProgress(editingMilestone.progress);
      setMStatus(editingMilestone.status);
      setMContractorName(editingMilestone.contractorName || '');
      setMContractorPhone(editingMilestone.contractorPhone || '');
      setMIsCritical(Boolean(editingMilestone.isCriticalPath));
      setMDesc(editingMilestone.description || '');
    }
  }, [editingMilestone]);

  if (!isOpen) return null;

  const handleProcurementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalQty = pQtyRoom1 + pQtyRoom2 + pQtyClass + pQtyGen;
    const subtotal = totalQty * pUnitPrice;

    const item: ProcurementItem = {
      id: editingProcurement ? editingProcurement.id : `p-${Date.now()}`,
      category: pCategory,
      partNo: pPartNo.trim() || '-',
      name: pName.trim(),
      specUrl: pSpecUrl.trim() || undefined,
      unitPrice: pUnitPrice,
      qtyMeetingRoom1: pQtyRoom1,
      qtyMeetingRoom2: pQtyRoom2,
      qtyClassroom: pQtyClass,
      qtyGeneral: pQtyGen,
      totalQty,
      subtotal,
      status: pStatus,
      orderDate: pOrderDate,
      expectedDeliveryDate: pDeliveryDate,
      installationDate: pInstallDate,
      vendorName: pVendorName.trim() || '配合廠商',
      notes: pNotes.trim() || undefined,
      linkedTrade: pLinkedTrade,
    };

    onSaveProcurement(item);
    onClose();
  };

  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const task: MilestoneTask = {
      id: editingMilestone ? editingMilestone.id : `m-${Date.now()}`,
      trade: mTrade,
      name: mName.trim(),
      startDate: mStartDate,
      endDate: mEndDate,
      actionType: mActionType,
      progress: mProgress,
      status: mStatus,
      contractorName: mContractorName.trim() || undefined,
      contractorPhone: mContractorPhone.trim() || undefined,
      isCriticalPath: mIsCritical,
      description: mDesc.trim() || undefined,
    };

    onSaveMilestone(task);
    onClose();
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            {!editingProcurement && !editingMilestone ? (
              <div className="bg-slate-200 p-0.5 rounded-lg flex items-center border border-slate-300">
                <button
                  type="button"
                  onClick={() => setActiveMode('procurement')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    activeMode === 'procurement' ? 'bg-[#264653] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  新增採購設備
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('milestone')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    activeMode === 'milestone' ? 'bg-[#264653] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  新增施工節點
                </button>
              </div>
            ) : (
              <h3 className="text-base font-bold text-slate-900">
                {activeMode === 'procurement' ? '編輯設備採購項目' : '編輯施工工程節點'}
              </h3>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeMode === 'procurement' ? (
            <form onSubmit={handleProcurementSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">設備類別 *</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value as ProcurementCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="網路設備">網路設備</option>
                    <option value="視訊設備">視訊設備</option>
                    <option value="電腦設備">電腦設備</option>
                    <option value="茶水設備">茶水設備</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">料號 / 型號</label>
                  <input
                    type="text"
                    placeholder="例如: D1001021 或 新品"
                    value={pPartNo}
                    onChange={(e) => setPPartNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">品項名稱與規格 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: Cisco Systems C9115AXI-T 無線AP..."
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">單價 (NT$ 含稅) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pUnitPrice}
                    onChange={(e) => setPUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500 focus:bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">商品規格或賣場網址 (選填)</label>
                  <input
                    type="url"
                    placeholder="https://24h.pchome.com.tw/..."
                    value={pSpecUrl}
                    onChange={(e) => setPSpecUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Space allocation */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">各區域分配數量</label>
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-600 font-semibold block mb-1">會議室1 (6-8人)</span>
                    <input
                      type="number"
                      min="0"
                      value={pQtyRoom1}
                      onChange={(e) => setPQtyRoom1(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-center text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-semibold block mb-1">會議室2 (2-4人)</span>
                    <input
                      type="number"
                      min="0"
                      value={pQtyRoom2}
                      onChange={(e) => setPQtyRoom2(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-center text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-semibold block mb-1">教學教室 (42人)</span>
                    <input
                      type="number"
                      min="0"
                      value={pQtyClass}
                      onChange={(e) => setPQtyClass(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-center text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-semibold block mb-1">全區配置</span>
                    <input
                      type="number"
                      min="0"
                      value={pQtyGen}
                      onChange={(e) => setPQtyGen(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-center text-slate-900 font-bold"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-right text-indigo-700 mt-1 font-mono font-bold">
                  數量小計：{pQtyRoom1 + pQtyRoom2 + pQtyClass + pQtyGen} | 金額合計：NT$ {((pQtyRoom1 + pQtyRoom2 + pQtyClass + pQtyGen) * pUnitPrice).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">採購狀態</label>
                  <select
                    value={pStatus}
                    onChange={(e) => setPStatus(e.target.value as ProcurementStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="詢價比價">詢價比價</option>
                    <option value="已下單">已下單</option>
                    <option value="備料出貨中">備料出貨中</option>
                    <option value="已到貨驗收">已到貨驗收</option>
                    <option value="現場安裝中">現場安裝中</option>
                    <option value="已完工上線">已完工上線</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">供應廠商名稱</label>
                  <input
                    type="text"
                    placeholder="廠商名稱"
                    value={pVendorName}
                    onChange={(e) => setPVendorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">下單日期</label>
                  <input
                    type="date"
                    value={pOrderDate}
                    onChange={(e) => setPOrderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">預計到貨日</label>
                  <input
                    type="date"
                    value={pDeliveryDate}
                    onChange={(e) => setPDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">現場安裝日</label>
                  <input
                    type="date"
                    value={pInstallDate}
                    onChange={(e) => setPInstallDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">備註說明</label>
                <textarea
                  rows={2}
                  placeholder="安裝位置、走線需求、專迴插座..."
                  value={pNotes}
                  onChange={(e) => setPNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {editingProcurement && onDeleteProcurement && (
                    isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 rounded-lg px-2.5 py-1.5 animate-in fade-in">
                        <span className="text-xs font-bold text-rose-700">確定刪除此設備？</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProcurement(editingProcurement.id);
                            setIsConfirmingDelete(false);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
                        >
                          確定刪除
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 font-bold text-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>刪除此採購品項</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#264653] hover:bg-[#1D353F] text-white font-bold"
                  >
                    儲存設備資料
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMilestoneSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">工程工種 *</label>
                  <select
                    value={mTrade}
                    onChange={(e) => setMTrade(e.target.value as TradeCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  >
                    {tradeList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">作業類別</label>
                  <select
                    value={mActionType}
                    onChange={(e) => setMActionType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="施工">施工</option>
                    <option value="簽圖">簽圖</option>
                    <option value="丈量">丈量</option>
                    <option value="出圖">出圖</option>
                    <option value="下單">下單</option>
                    <option value="配管">配管</option>
                    <option value="配線">配線</option>
                    <option value="裝燈">裝燈</option>
                    <option value="叫貨">叫貨</option>
                    <option value="到貨">到貨</option>
                    <option value="粗清">粗清</option>
                    <option value="細清">細清</option>
                    <option value="安裝">安裝</option>
                    <option value="裝機">裝機</option>
                    <option value="拆包膜">拆包膜</option>
                    <option value="插座配置">插座配置</option>
                    <option value="驗收">驗收</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">任務 / 節點名稱 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 會議室強化玻璃丈量簽圖、第一階段細清..."
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">開始日期 *</label>
                  <input
                    type="date"
                    required
                    value={mStartDate}
                    onChange={(e) => setMStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">結束日期 *</label>
                  <input
                    type="date"
                    required
                    value={mEndDate}
                    onChange={(e) => setMEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">施工進度百分比 ({mProgress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={mProgress}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setMProgress(val);
                      if (val === 100) setMStatus('已完成');
                      else if (val > 0) setMStatus('進行中');
                      else setMStatus('尚未開始');
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">進度狀態</label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as MilestoneStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="尚未開始">尚未開始</option>
                    <option value="進行中">進行中</option>
                    <option value="已完成">已完成</option>
                    <option value="延遲預警">延遲預警</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">施工工班 / 廠商</label>
                  <input
                    type="text"
                    placeholder="廠商名稱"
                    value={mContractorName}
                    onChange={(e) => setMContractorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">工班聯絡電話</label>
                  <input
                    type="text"
                    placeholder="電話 / 手機"
                    value={mContractorPhone}
                    onChange={(e) => setMContractorPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="isCritical"
                  checked={mIsCritical}
                  onChange={(e) => setMIsCritical(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                />
                <label htmlFor="isCritical" className="text-slate-800 font-bold cursor-pointer">
                  標記為關鍵要徑 (Critical Path - 影響後續工序或驗收)
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">施工規範與現場備註</label>
                <textarea
                  rows={2}
                  placeholder="施作注意事項、進場前置配合條件..."
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {editingMilestone && onDeleteMilestone && (
                    isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 rounded-lg px-2.5 py-1.5 animate-in fade-in">
                        <span className="text-xs font-bold text-rose-700">確定刪除此施工節點？</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteMilestone(editingMilestone.id);
                            setIsConfirmingDelete(false);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
                        >
                          確定刪除
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 font-bold text-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>刪除此施工節點</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#264653] hover:bg-[#1D353F] text-white font-bold"
                  >
                    儲存施工節點
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
