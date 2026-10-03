import React, { useState, useMemo } from 'react';
import { 
  ProcurementItem, 
  ProcurementCategory, 
  ProcurementStatus 
} from '../types';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Wrench, 
  Edit3, 
  Plus, 
  Trash2, 
  Download,
  AlertCircle
} from 'lucide-react';

interface ProcurementTableProps {
  items: ProcurementItem[];
  onUpdateItem: (item: ProcurementItem) => void;
  onDeleteItem: (id: string) => void;
  onAddNewItem: () => void;
  onEditItem: (item: ProcurementItem) => void;
  onExportCSV: () => void;
}

export const ProcurementTable: React.FC<ProcurementTableProps> = ({
  items,
  onUpdateItem,
  onDeleteItem,
  onAddNewItem,
  onEditItem,
  onExportCSV,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories: { key: string; label: string; count: number; subtotal: number }[] = useMemo(() => {
    const allTotal = items.reduce((acc, it) => acc + it.subtotal, 0);
    const catList: ProcurementCategory[] = ['網路設備', '視訊設備', '電腦設備', '茶水設備'];
    
    return [
      { key: 'all', label: '全部設備', count: items.length, subtotal: allTotal },
      ...catList.map((c) => {
        const matching = items.filter((it) => it.category === c);
        return {
          key: c,
          label: c,
          count: matching.length,
          subtotal: matching.reduce((sum, it) => sum + it.subtotal, 0),
        };
      }),
    ];
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesPartNo = item.partNo.toLowerCase().includes(query);
        const matchesVendor = item.vendorName.toLowerCase().includes(query);
        const matchesNotes = (item.notes || '').toLowerCase().includes(query);
        if (!matchesName && !matchesPartNo && !matchesVendor && !matchesNotes) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedStatus, searchQuery]);

  const totalFilteredAmount = filteredItems.reduce((acc, it) => acc + it.subtotal, 0);

  const getStatusBadge = (status: ProcurementStatus) => {
    switch (status) {
      case '詢價比價':
        return 'bg-[#FDF8EC] text-[#9A741A] border-[#F6E3B0]';
      case '已下單':
        return 'bg-[#EBF3F5] text-[#264653] border-[#C5DCE2]';
      case '備料出貨中':
        return 'bg-[#FEF5EF] text-[#D47026] border-[#FCD8BE]';
      case '已到貨驗收':
        return 'bg-[#EAF6F4] text-[#2A9D8F] border-[#BBE4DE]';
      case '現場安裝中':
        return 'bg-[#FDF8EC] text-[#9A741A] border-[#F6E3B0]';
      case '已完工上線':
        return 'bg-[#EAF6F4] text-[#2A9D8F] border-[#BBE4DE]';
      default:
        return 'bg-[#F1F2F4] text-[#44546F] border-slate-200';
    }
  };

  const handleStatusChange = (item: ProcurementItem, newStatus: ProcurementStatus) => {
    onUpdateItem({
      ...item,
      status: newStatus,
      actualDeliveryDate: newStatus === '已到貨驗收' && !item.actualDeliveryDate ? '2026-10-01' : item.actualDeliveryDate,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDateChange = (item: ProcurementItem, field: 'expectedDeliveryDate' | 'installationDate', val: string) => {
    onUpdateItem({
      ...item,
      [field]: val,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs & Budget Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              selectedCategory === cat.key
                ? 'bg-slate-50 border-[#264653] text-slate-900 shadow-xs ring-1 ring-[#264653]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">{cat.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono border border-slate-200">
                {cat.count}項
              </span>
            </div>
            <div className="mt-2 text-sm font-black text-[#264653] font-mono">
              NT$ {cat.subtotal.toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋品項名稱、料號、供應商 (例如: Cisco, 圓剛, Lenovo, 冰箱)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#566B64] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#566B64]"
            >
              <option value="all">所有採購狀態</option>
              <option value="詢價比價">詢價比價</option>
              <option value="已下單">已下單</option>
              <option value="備料出貨中">備料出貨中</option>
              <option value="已到貨驗收">已到貨驗收</option>
              <option value="現場安裝中">現場安裝中</option>
              <option value="已完工上線">已完工上線</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-[#5F8268]" />
            <span>匯出採購清單 CSV</span>
          </button>

          <button
            onClick={onAddNewItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#264653] hover:bg-[#1D353F] text-white shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增採購品項</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-3">類別 / 料號</th>
                <th className="py-3 px-3 min-w-[220px]">品項名稱與規格</th>
                <th className="py-3 px-2 text-right">單價(NT$)</th>
                <th className="py-3 px-2 text-center" title="會議室-1 (6-8人)">會議1 (6-8人)</th>
                <th className="py-3 px-2 text-center" title="會議室-2 (2-4人)">會議2 (2-4人)</th>
                <th className="py-3 px-2 text-center" title="教學教室 (42人)">教室 (42人)</th>
                <th className="py-3 px-2 text-center">全區</th>
                <th className="py-3 px-2 text-center font-black text-slate-900">總數</th>
                <th className="py-3 px-3 text-right font-black text-indigo-700">金額合計(含稅)</th>
                <th className="py-3 px-3">採購進度狀態</th>
                <th className="py-3 px-3">預計到貨/安裝</th>
                <th className="py-3 px-3">供應商</th>
                <th className="py-3 px-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr 
                  key={item.id}
                  className="hover:bg-slate-50/80 transition group"
                >
                  {/* Category & PartNo */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-sky-800 border border-slate-200">
                      {item.category}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5 font-medium">
                      {item.partNo || '-'}
                    </div>
                  </td>

                  {/* Name, Spec & Notes */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{item.name}</span>
                      {item.specUrl && (
                        <a
                          href={item.specUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 transition"
                          title="查看 PChome / 原廠商品規格頁面"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 group-hover:line-clamp-none transition">
                        📝 {item.notes}
                      </div>
                    )}
                  </td>

                  {/* Unit Price */}
                  <td className="py-2.5 px-2 text-right font-mono text-slate-800 font-semibold">
                    ${item.unitPrice.toLocaleString()}
                  </td>

                  {/* Quantities per Location */}
                  <td className="py-2.5 px-2 text-center text-slate-700">
                    {item.qtyMeetingRoom1 > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-bold border border-slate-200">
                        {item.qtyMeetingRoom1}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700">
                    {item.qtyMeetingRoom2 > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-bold border border-slate-200">
                        {item.qtyMeetingRoom2}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700">
                    {item.qtyClassroom > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-bold border border-slate-200">
                        {item.qtyClassroom}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700">
                    {item.qtyGeneral > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-bold border border-slate-200">
                        {item.qtyGeneral}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  {/* Total Qty */}
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded bg-[#EBF3F5] text-[#264653] border border-[#C5DCE2] font-black">
                      {item.totalQty}
                    </span>
                  </td>

                  {/* Subtotal */}
                  <td className="py-2.5 px-3 text-right font-black font-mono text-[#2A9D8F]">
                    ${item.subtotal.toLocaleString()}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value as ProcurementStatus)}
                      className={`text-[11px] font-bold rounded-md px-2 py-1 border transition focus:outline-hidden cursor-pointer shadow-2xs ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      <option value="詢價比價">詢價比價</option>
                      <option value="已下單">已下單</option>
                      <option value="備料出貨中">備料出貨中</option>
                      <option value="已到貨驗收">已到貨驗收</option>
                      <option value="現場安裝中">現場安裝中</option>
                      <option value="已完工上線">已完工上線</option>
                    </select>
                  </td>

                  {/* Dates */}
                  <td className="py-2 px-3 text-[11px] whitespace-nowrap space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px] w-7">到貨:</span>
                      <input
                        type="date"
                        value={item.expectedDeliveryDate || ''}
                        onChange={(e) => handleDateChange(item, 'expectedDeliveryDate', e.target.value)}
                        className="bg-white hover:bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-[#2A9D8F] cursor-pointer"
                        title="點擊直接修改預計到貨日"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px] w-7">安裝:</span>
                      <input
                        type="date"
                        value={item.installationDate || ''}
                        onChange={(e) => handleDateChange(item, 'installationDate', e.target.value)}
                        className="bg-white hover:bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-[#2A9D8F] cursor-pointer"
                        title="點擊直接修改現場安裝日"
                      />
                    </div>
                  </td>

                  {/* Vendor */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="text-slate-900 font-bold truncate max-w-[120px]" title={item.vendorName}>
                      {item.vendorName || '-'}
                    </div>
                    {item.vendorPhone && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.vendorPhone.split('/')[0]}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                        title="編輯採購資訊"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {deletingId === item.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 rounded px-1.5 py-0.5">
                          <span className="text-[10px] text-rose-700 font-bold">刪除？</span>
                          <button
                            onClick={() => {
                              onDeleteItem(item.id);
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
                          onClick={() => setDeletingId(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500">
                    沒有找到符合篩選條件的採購項目
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300 text-slate-800">
              <tr>
                <td colSpan={8} className="py-3 px-3 text-right text-xs uppercase tracking-wider text-slate-600">
                  篩選項目總計 (含稅)：
                </td>
                <td className="py-3 px-3 text-right text-sm font-mono text-emerald-700 font-black">
                  NT$ {totalFilteredAmount.toLocaleString()}
                </td>
                <td colSpan={4} className="py-3 px-3 text-xs text-slate-600">
                  共 {filteredItems.length} 項設備
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
