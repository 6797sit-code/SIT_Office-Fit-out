import React, { useState } from 'react';
import { VendorContact, ProcurementItem, MilestoneTask } from '../types';
import { 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Check, 
  Copy, 
  ExternalLink 
} from 'lucide-react';

interface VendorDirectoryProps {
  vendors: VendorContact[];
  procurementItems: ProcurementItem[];
  milestones: MilestoneTask[];
  onAddVendor: (vendor: VendorContact) => void;
  onUpdateVendor: (vendor: VendorContact) => void;
  onDeleteVendor: (id: string) => void;
}

export const VendorDirectory: React.FC<VendorDirectoryProps> = ({
  vendors,
  procurementItems,
  milestones,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingVendor, setEditingVendor] = useState<VendorContact | null>(null);
  const [isNew, setIsNew] = useState(false);

  const filteredVendors = vendors.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.serviceCategory.toLowerCase().includes(q) ||
      v.contactPerson.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      (v.notes || '').toLowerCase().includes(q)
    );
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;

    if (isNew) {
      onAddVendor(editingVendor);
    } else {
      onUpdateVendor(editingVendor);
    }
    setEditingVendor(null);
  };

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#264653]" />
            工程與設備供應商通訊錄
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            收錄統包工務、網路代理商、視訊音響、商用電腦經銷與家電工程團隊
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋廠商、聯絡人、服務項目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#264653] focus:bg-white"
            />
          </div>

          <button
            onClick={() => {
              setIsNew(true);
              setEditingVendor({
                id: `v-${Date.now()}`,
                name: '',
                serviceCategory: '',
                contactPerson: '',
                phone: '',
                mobile: '',
                email: '',
                lineId: '',
                address: '',
                taxId: '',
                rating: 5,
                notes: '',
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#264653] hover:bg-[#1D353F] text-white shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增廠商資料</span>
          </button>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredVendors.map((vendor) => {
          // Count linked procurement items
          const linkedProcurements = procurementItems.filter(
            (p) => p.vendorId === vendor.id || (p.vendorName && p.vendorName.includes(vendor.name.slice(0, 4)))
          );

          return (
            <div
              key={vendor.id}
              className="bg-white border border-slate-200 rounded-xl p-4 transition hover:border-slate-300 shadow-xs flex flex-col justify-between hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {vendor.name}
                    </h3>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mt-1">
                      {vendor.serviceCategory}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsNew(false);
                        setEditingVendor(vendor);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                      title="編輯廠商"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`確定要刪除「${vendor.name}」嗎？`)) {
                          onDeleteVendor(vendor.id);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                      title="刪除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact Person & Numbers */}
                <div className="text-xs text-slate-700 space-y-1.5 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>聯絡窗口：{vendor.contactPerson}</span>
                    {vendor.taxId && (
                      <span className="text-[10px] text-slate-500 font-mono">統編: {vendor.taxId}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a href={`tel:${vendor.phone}`} className="hover:text-emerald-700 font-mono font-semibold">
                        {vendor.phone}
                      </a>
                      {vendor.mobile && (
                        <span className="text-slate-500 font-mono">/ {vendor.mobile}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(vendor.mobile || vendor.phone, `phone-${vendor.id}`)}
                      className="text-slate-400 hover:text-slate-700 transition"
                      title="複製電話"
                    >
                      {copiedId === `phone-${vendor.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {vendor.lineId && (
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Line: <span className="font-mono text-emerald-700 font-semibold">{vendor.lineId}</span></span>
                      </div>
                      <button
                        onClick={() => handleCopy(vendor.lineId || '', `line-${vendor.id}`)}
                        className="text-slate-400 hover:text-slate-700 transition"
                        title="複製 Line ID"
                      >
                        {copiedId === `line-${vendor.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {vendor.email && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                      <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <a href={`mailto:${vendor.email}`} className="hover:text-sky-800 truncate">
                        {vendor.email}
                      </a>
                    </div>
                  )}

                  {vendor.address && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {vendor.notes && (
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2">
                    📝 {vendor.notes}
                  </p>
                )}
              </div>

              {/* Linked Items Pill */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">關聯採購設備</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-indigo-700 font-bold border border-slate-200">
                  {linkedProcurements.length} 項
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vendor Add / Edit Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {isNew ? '新增廠商資訊' : '編輯廠商資料'}
            </h3>

            <form onSubmit={handleSaveVendor} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">廠商名稱 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 思科 Cisco 代理商..."
                  value={editingVendor.name}
                  onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">服務/承攬類別</label>
                  <input
                    type="text"
                    placeholder="例如: 網路設備、視訊多媒體..."
                    value={editingVendor.serviceCategory}
                    onChange={(e) => setEditingVendor({ ...editingVendor, serviceCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">聯絡窗口負責人</label>
                  <input
                    type="text"
                    placeholder="姓名與職稱"
                    value={editingVendor.contactPerson}
                    onChange={(e) => setEditingVendor({ ...editingVendor, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">市話</label>
                  <input
                    type="text"
                    placeholder="04-XXXXXXX"
                    value={editingVendor.phone}
                    onChange={(e) => setEditingVendor({ ...editingVendor, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">手機 (行動電話)</label>
                  <input
                    type="text"
                    placeholder="09XX-XXX-XXX"
                    value={editingVendor.mobile}
                    onChange={(e) => setEditingVendor({ ...editingVendor, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Line ID</label>
                  <input
                    type="text"
                    placeholder="Line ID"
                    value={editingVendor.lineId || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, lineId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">統一編號</label>
                  <input
                    type="text"
                    placeholder="8碼統編"
                    value={editingVendor.taxId || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, taxId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={editingVendor.email}
                  onChange={(e) => setEditingVendor({ ...editingVendor, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">備註說明</label>
                <textarea
                  rows={2}
                  placeholder="交期協議、配合注意事項..."
                  value={editingVendor.notes || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#264653] hover:bg-[#1D353F] text-white font-bold"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
