import React, { useState, useMemo } from 'react';
import { TodoItem, TodoCategory, TradeCategory, MilestoneTask } from '../types';
import { getTodayDateString } from '../utils/date';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Search, 
  Filter, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Layers, 
  MapPin, 
  User, 
  Calendar, 
  Sparkles,
  FileCheck,
  RotateCcw,
  CheckCheck,
  Eye,
  EyeOff,
  AlertOctagon,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';

interface TodoListProps {
  todos: TodoItem[];
  milestones: MilestoneTask[];
  onToggleTodo: (id: string) => void;
  onAddTodo: (todo: TodoItem) => void;
  onUpdateTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
  onReorderTodos?: (todos: TodoItem[]) => void;
  onDeleteMultipleTodos?: (ids: string[]) => void;
  onClearCompletedTodos?: () => void;
  onClearAllTodos?: () => void;
  onResetTodosToDefault?: () => void;
  onExportCSV?: () => void;
}

const CATEGORY_STYLES: Record<TodoCategory, { badge: string; border: string; bg: string }> = {
  '應拆未拆處理': {
    badge: 'bg-[#FDF0ED] text-[#E76F51] border-[#F8C8BD]',
    border: 'border-[#F8C8BD]',
    bg: 'bg-white',
  },
  '破壞還原': {
    badge: 'bg-[#FEF5EF] text-[#D47026] border-[#FCD8BE]',
    border: 'border-[#FCD8BE]',
    bg: 'bg-white',
  },
  '額外追加工項': {
    badge: 'bg-[#EBF3F5] text-[#264653] border-[#C5DCE2]',
    border: 'border-[#C5DCE2]',
    bg: 'bg-white',
  },
  '現場核對查核': {
    badge: 'bg-[#EAF6F4] text-[#2A9D8F] border-[#BBE4DE]',
    border: 'border-[#BBE4DE]',
    bg: 'bg-white',
  },
  '缺失改善': {
    badge: 'bg-[#FDF8EC] text-[#9A741A] border-[#F6E3B0]',
    border: 'border-[#F6E3B0]',
    bg: 'bg-white',
  },
  '一般待辦': {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    border: 'border-slate-200',
    bg: 'bg-white',
  },
};

const TRADE_LIST: TradeCategory[] = [
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

const QUICK_PRESETS = [
  {
    title: '會議室天花板原骨架破損還原 (加強吊筋結構)',
    category: '破壞還原' as TodoCategory,
    trade: '木工工程' as TradeCategory,
    location: '會議室-1 (天花板)',
    assignedTo: '木工組',
    notes: '拆除時原吊筋微受損，追加膨脹螺絲與水平吊點加固。',
  },
  {
    title: '會議室天花板上方應拆未拆舊管路與舊角料清運',
    category: '應拆未拆處理' as TodoCategory,
    trade: '拆除工程' as TradeCategory,
    location: '會議室-1 (天花板頂端)',
    assignedTo: '拆除工班',
    notes: '舊鐵件與廢棄管線清除，避免阻擋新出風口與線槽。',
  },
  {
    title: '天花板封板前消防撒水頭高度與防漏水查核拍照',
    category: '現場核對查核' as TodoCategory,
    trade: '水電工程' as TradeCategory,
    location: '會議室-1 全區',
    assignedTo: '水電工班',
    notes: '封板前務必拍照存證，確認撒水頭平整度與管線無滲漏。',
  },
  {
    title: '天花板舊冷氣風管障礙點切除拆平與排水檢查',
    category: '應拆未拆處理' as TodoCategory,
    trade: '冷氣設備工程' as TradeCategory,
    location: '會議室-1 / 廊道交界上方',
    assignedTo: '冷氣工班',
    notes: '切除舊保溫材與阻礙之管線，確認新冷媒管路走向順暢。',
  },
];

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  milestones,
  onToggleTodo,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onReorderTodos,
  onDeleteMultipleTodos,
  onClearCompletedTodos,
  onClearAllTodos,
  onResetTodosToDefault,
  onExportCSV,
}) => {
  const todayStr = getTodayDateString();

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);

  // Drag and drop reordering state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);

  // Batch Management
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inline delete confirm ID (safe in-DOM confirmation, no window.confirm)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // In-app modal for dangerous batch actions (clear all, clear completed, reset)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TodoCategory>('應拆未拆處理');
  const [formTrade, setFormTrade] = useState<TradeCategory>('木工工程');
  const [formMilestoneName, setFormMilestoneName] = useState('會議室天花板拆除破壞還原、應拆未拆處理等');
  const [formLocation, setFormLocation] = useState('會議室-1');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formDueDate, setFormDueDate] = useState(todayStr);
  const [formIsUrgent, setFormIsUrgent] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  // Copy Feedback
  const [copiedLine, setCopiedLine] = useState(false);

  // Stats calculation
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const urgentPendingCount = todos.filter((t) => !t.completed && t.isUrgent).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered List
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      // Hide completed toggle
      if (hideCompleted && t.completed) return false;

      // Status filter
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;
      if (statusFilter === 'urgent' && (!t.isUrgent || t.completed)) return false;

      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // Trade filter
      if (tradeFilter !== 'all' && t.trade !== tradeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchLocation = (t.location || '').toLowerCase().includes(q);
        const matchAssignee = (t.assignedTo || '').toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        const matchMilestone = (t.relatedMilestoneName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLocation && !matchAssignee && !matchNotes && !matchMilestone) {
          return false;
        }
      }

      return true;
    });
  }, [todos, hideCompleted, statusFilter, categoryFilter, tradeFilter, searchQuery]);

  // Drag and Drop Handlers for Reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== targetId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const pos = e.clientY < midY ? 'above' : 'below';
      setDragOverId(targetId);
      setDragOverPosition(pos);
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetId: string) => {
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      if (dragOverId === targetId) {
        setDragOverId(null);
        setDragOverPosition(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      setDragOverPosition(null);
      return;
    }

    const fromIndex = todos.findIndex((t) => t.id === draggedId);
    const toIndex = todos.findIndex((t) => t.id === targetId);

    if (fromIndex >= 0 && toIndex >= 0) {
      const newTodos = [...todos];
      const [movedItem] = newTodos.splice(fromIndex, 1);
      
      let insertIndex = toIndex;
      if (dragOverPosition === 'below') {
        insertIndex = fromIndex < toIndex ? toIndex : toIndex + 1;
      } else {
        insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
      }
      insertIndex = Math.max(0, Math.min(newTodos.length, insertIndex));

      newTodos.splice(insertIndex, 0, movedItem);

      if (onReorderTodos) {
        onReorderTodos(newTodos);
      }
    }

    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
  };

  const handleMoveStep = (id: string, dir: 'up' | 'down') => {
    const fromIndex = todos.findIndex((t) => t.id === id);
    if (fromIndex < 0) return;
    const toIndex = dir === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= todos.length) return;

    const newTodos = [...todos];
    const [item] = newTodos.splice(fromIndex, 1);
    newTodos.splice(toIndex, 0, item);

    if (onReorderTodos) {
      onReorderTodos(newTodos);
    }
  };

  // Open modal for editing
  const handleOpenEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setFormTitle(todo.title);
    setFormCategory(todo.category);
    if (todo.trade) setFormTrade(todo.trade);
    setFormMilestoneName(todo.relatedMilestoneName || '會議室天花板拆除破壞還原、應拆未拆處理等');
    setFormLocation(todo.location || '');
    setFormAssignedTo(todo.assignedTo || '');
    setFormDueDate(todo.dueDate || todayStr);
    setFormIsUrgent(todo.isUrgent || false);
    setFormNotes(todo.notes || '');
    setIsAddModalOpen(true);
  };

  // Open modal for new
  const handleOpenAdd = () => {
    setEditingTodo(null);
    setFormTitle('');
    setFormCategory('應拆未拆處理');
    setFormTrade('木工工程');
    setFormMilestoneName('會議室天花板拆除破壞還原、應拆未拆處理等');
    setFormLocation('會議室-1');
    setFormAssignedTo('');
    setFormDueDate(todayStr);
    setFormIsUrgent(true);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // Save new or updated todo
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingTodo) {
      const updated: TodoItem = {
        ...editingTodo,
        title: formTitle.trim(),
        category: formCategory,
        trade: formTrade,
        relatedMilestoneName: formMilestoneName.trim() || undefined,
        location: formLocation.trim() || undefined,
        assignedTo: formAssignedTo.trim() || undefined,
        dueDate: formDueDate || undefined,
        isUrgent: formIsUrgent,
        notes: formNotes.trim() || undefined,
      };
      onUpdateTodo(updated);
    } else {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        trade: formTrade,
        relatedMilestoneName: formMilestoneName.trim() || undefined,
        location: formLocation.trim() || undefined,
        assignedTo: formAssignedTo.trim() || undefined,
        dueDate: formDueDate || undefined,
        isUrgent: formIsUrgent,
        completed: false,
        notes: formNotes.trim() || undefined,
        createdAt: todayStr,
      };
      onAddTodo(newTodo);
    }

    setIsAddModalOpen(false);
    setEditingTodo(null);
  };

  // Apply quick preset to form
  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormTrade(preset.trade);
    setFormLocation(preset.location);
    setFormAssignedTo(preset.assignedTo);
    setFormNotes(preset.notes);
    setFormIsUrgent(true);
  };

  // Batch selection handlers
  const handleToggleSelectId = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredTodos.map((t) => t.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSelectCompletedOnly = () => {
    const completedIds = todos.filter((t) => t.completed).map((t) => t.id);
    setSelectedIds(completedIds);
    setIsBatchMode(true);
  };

  const handleExecuteBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: '確定批量刪除所選工項？',
      description: `即將永久移除已勾選的 ${selectedIds.length} 個待辦項目，自清單徹底清除後將無法復原。`,
      actionLabel: `確認刪除 (${selectedIds.length} 項)`,
      onConfirm: () => {
        if (onDeleteMultipleTodos) {
          onDeleteMultipleTodos(selectedIds);
        } else {
          selectedIds.forEach((id) => onDeleteTodo(id));
        }
        setSelectedIds([]);
        setIsBatchMode(false);
        setConfirmModal(null);
      }
    });
  };

  const handlePromptClearCompleted = () => {
    if (completedCount === 0) return;
    setConfirmModal({
      isOpen: true,
      title: '確定整理移除所有已劃線完成項目？',
      description: `目前有 ${completedCount} 個項目已打勾劃線。點選確認後將自清單中永久清除這些已完成項目，讓清單保持簡潔乾淨。`,
      actionLabel: `確認清除 ${completedCount} 項`,
      onConfirm: () => {
        if (onClearCompletedTodos) {
          onClearCompletedTodos();
        } else {
          const completedIds = todos.filter((t) => t.completed).map((t) => t.id);
          completedIds.forEach((id) => onDeleteTodo(id));
        }
        setConfirmModal(null);
      }
    });
  };

  const handlePromptClearAll = () => {
    if (totalCount === 0) return;
    setConfirmModal({
      isOpen: true,
      title: '確定清空所有待辦事項？',
      description: '將自待辦頁簽中永久清除全部工項，還您一個完全乾淨的空白清單，方便重新自行登記。',
      actionLabel: '清空所有待辦',
      onConfirm: () => {
        if (onClearAllTodos) {
          onClearAllTodos();
        } else {
          todos.forEach((t) => onDeleteTodo(t.id));
        }
        setSelectedIds([]);
        setConfirmModal(null);
      }
    });
  };

  const handlePromptResetDefault = () => {
    setConfirmModal({
      isOpen: true,
      title: '重設為「會議室天花板精簡查核項目」？',
      description: '將清空現有待辦並載入最核心的 4 項「會議室天花板拆除破壞還原、應拆未拆處理」重點工項。',
      actionLabel: '重設為精簡項目',
      onConfirm: () => {
        if (onResetTodosToDefault) {
          onResetTodosToDefault();
        }
        setSelectedIds([]);
        setConfirmModal(null);
      }
    });
  };

  // Copy formatted checklist to clipboard (LINE friendly)
  const handleCopyLineReport = () => {
    const lines = [
      `📋【翔生資訊 辦公室裝潢 - 待辦事項與重點查核清單】`,
      `📅 查核基準日：${todayStr}`,
      `📊 完成進度：${completedCount} / ${totalCount} 項 (${completionRate}%)`,
      `🚨 重點關注未完成：${urgentPendingCount} 項`,
      `---------------------------------`
    ];

    todos.forEach((t, idx) => {
      const mark = t.completed ? '✅ [已完成]' : t.isUrgent ? '🚨 [待處理-重點]' : '⏳ [待處理]';
      lines.push(`${idx + 1}. ${mark} 【${t.category}】${t.title}`);
      if (t.location) lines.push(`   地點：${t.location}`);
      if (t.trade) lines.push(`   工種：${t.trade}`);
      if (t.assignedTo) lines.push(`   負責：${t.assignedTo}`);
      if (t.dueDate) lines.push(`   期限：${t.dueDate}`);
      if (t.notes) lines.push(`   備註：${t.notes}`);
      lines.push('');
    });

    lines.push(`---------------------------------`);
    lines.push(`翔生資訊 裝潢施工排程管理系統即時更新`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedLine(true);
    setTimeout(() => setCopiedLine(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  待辦事項與重點查核清單 (額外 / 應拆未拆 / 還原)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  重點關注
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                勾選方塊為「現場打勾劃線確認」；若是不需要的項目，可隨時點選右側「移除」徹底清除
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Clear completed items directly */}
            {completedCount > 0 && (
              <button
                type="button"
                onClick={handlePromptClearCompleted}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 shadow-2xs transition"
                title="一鍵清除所有已劃線完成的項目"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>整理移除已完成 ({completedCount})</span>
              </button>
            )}

            {/* Toggle Batch Mode */}
            <button
              type="button"
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                if (isBatchMode) setSelectedIds([]);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition shadow-2xs ${
                isBatchMode
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isBatchMode ? '結束批次' : '批次選取刪除'}</span>
            </button>

            {/* Clear all or reset buttons */}
            {totalCount > 0 && (
              <button
                type="button"
                onClick={handlePromptClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                title="清空所有項目，重新乾淨登記"
              >
                <span>清空全部</span>
              </button>
            )}

            {onResetTodosToDefault && (
              <button
                type="button"
                onClick={handlePromptResetDefault}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition"
                title="重置回天花板核心 4 項"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重設精簡</span>
              </button>
            )}

            {/* Copy LINE Report */}
            <button
              type="button"
              onClick={handleCopyLineReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-2xs transition"
              title="複製包含勾選狀態的文字報表，直接貼入 LINE 群組"
            >
              {copiedLine ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">已複製 LINE！</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>發 LINE 清單</span>
                </>
              )}
            </button>

            {/* Add New Todo */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>新增待辦項目</span>
            </button>
          </div>
        </div>

        {/* Action Guidance Notice */}
        <div className="mt-3 py-2 px-3 bg-amber-50/80 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-800 shrink-0">💡 操作提示：</span>
            <span>
              按住卡片左側 <strong>⠿ 握把可自由拖曳調整前後順序</strong>（亦可用上下箭頭）；點方格為「<strong>打勾劃線 (已完成查核)</strong>」；點右側紅色按鈕可<strong>徹底自清單刪除</strong>。
            </span>
          </div>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handlePromptClearCompleted}
              className="shrink-0 px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300/80 text-amber-900 font-bold text-[11px] transition"
            >
              一鍵清除 {completedCount} 個劃線項目 ✕
            </button>
          )}
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500">待辦查核總計</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalCount} 項</div>
          </div>

          <div className="bg-rose-50/70 rounded-lg p-3 border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-700 flex items-center justify-between">
              <span>待處理 (未完成)</span>
              {urgentPendingCount > 0 && (
                <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                  {urgentPendingCount} 重點
                </span>
              )}
            </div>
            <div className="text-xl font-black text-rose-700 font-mono mt-0.5">{pendingCount} 項</div>
          </div>

          <div className="bg-emerald-50/70 rounded-lg p-3 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-700">已確認完成</div>
            <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">{completedCount} 項</div>
          </div>

          <div className="bg-indigo-50/70 rounded-lg p-3 border border-indigo-200">
            <div className="text-[11px] font-semibold text-indigo-700">總體查核完成率</div>
            <div className="text-xl font-black text-indigo-700 font-mono mt-0.5">{completionRate}%</div>
            <div className="w-full bg-indigo-200/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar (when batch mode active) */}
      {isBatchMode && (
        <div className="bg-indigo-900 text-white rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-800 font-mono font-bold text-indigo-200">
              已選取 {selectedIds.length} / {totalCount} 項
            </span>
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="px-2.5 py-1 rounded bg-indigo-800/80 hover:bg-indigo-700 text-white font-medium transition"
            >
              {filteredTodos.every((t) => selectedIds.includes(t.id)) && filteredTodos.length > 0
                ? '取消全選'
                : '選取目前所有顯示項'}
            </button>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleSelectCompletedOnly}
                className="px-2.5 py-1 rounded bg-indigo-800/80 hover:bg-indigo-700 text-white font-medium transition"
              >
                選取所有已劃線項 ({completedCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleExecuteBatchDelete}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition shadow-xs ${
                selectedIds.length > 0
                  ? 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer'
                  : 'bg-rose-900/50 text-rose-300 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>永久移除所選 ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsBatchMode(false);
                setSelectedIds([]);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-indigo-200 font-medium"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Status Quick Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                statusFilter === 'pending'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              待處理 ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('urgent')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                statusFilter === 'urgent'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>重點關注 ({urgentPendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                statusFilter === 'completed'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              已完成 ({completedCount})
            </button>
          </div>

          {/* Hide Completed toggle */}
          <button
            type="button"
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition font-medium ${
              hideCompleted
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="開啟後將隱藏已打勾劃線的項目"
          >
            {hideCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>隱藏劃線項</span>
          </button>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">所有性質類別</option>
            <option value="應拆未拆處理">應拆未拆處理</option>
            <option value="破壞還原">破壞還原</option>
            <option value="額外追加工項">額外追加工項</option>
            <option value="現場核對查核">現場核對查核</option>
            <option value="缺失改善">缺失改善</option>
            <option value="一般待辦">一般待辦</option>
          </select>

          {/* Trade Dropdown */}
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">所有改善工種</option>
            {TRADE_LIST.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋項目、位置、工班或說明..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Todo Items Cards List */}
      <div className="space-y-2.5">
        {filteredTodos.map((todo, index) => {
          const style = CATEGORY_STYLES[todo.category] || CATEGORY_STYLES['一般待辦'];
          const isSelected = selectedIds.includes(todo.id);
          const isConfirmingDelete = deletingId === todo.id;
          const isDragging = draggedId === todo.id;
          const isDragOver = dragOverId === todo.id && draggedId !== todo.id;

          return (
            <div
              key={todo.id}
              draggable={!isBatchMode}
              onDragStart={(e) => handleDragStart(e, todo.id)}
              onDragOver={(e) => handleDragOver(e, todo.id)}
              onDragLeave={(e) => handleDragLeave(e, todo.id)}
              onDrop={(e) => handleDrop(e, todo.id)}
              onDragEnd={handleDragEnd}
              className={`group bg-white border rounded-xl p-3.5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 relative ${
                isDragging
                  ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/20 scale-[0.99]'
                  : isDragOver
                  ? 'border-indigo-500 ring-2 ring-indigo-400/60 bg-indigo-50/30'
                  : todo.completed
                  ? 'border-slate-200/80 bg-slate-50/50'
                  : todo.isUrgent
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Drop target visual indicator line */}
              {isDragOver && dragOverPosition === 'above' && (
                <div className="absolute -top-1.5 left-3 right-3 h-1 bg-indigo-600 rounded-full shadow-xs animate-pulse pointer-events-none z-10" />
              )}
              {isDragOver && dragOverPosition === 'below' && (
                <div className="absolute -bottom-1.5 left-3 right-3 h-1 bg-indigo-600 rounded-full shadow-xs animate-pulse pointer-events-none z-10" />
              )}

              <div className="flex items-start gap-2 sm:gap-2.5 flex-1 min-w-0">
                {/* Drag Handle & Quick Move Controls */}
                <div 
                  className="flex flex-col items-center justify-center -ml-1 mr-0.5 select-none shrink-0 pt-0.5"
                  title="按住 ⠿ 可拖曳排序，或按上下箭頭移動"
                >
                  <div 
                    className="p-1 text-slate-300 hover:text-indigo-600 group-hover:text-slate-400 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing transition"
                    title="按住拖曳排序"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveStep(todo.id, 'up');
                      }}
                      disabled={index === 0}
                      className="p-0.5 text-slate-300 hover:text-slate-700 disabled:opacity-10 hover:bg-slate-100 rounded transition"
                      title="往上移動一位"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveStep(todo.id, 'down');
                      }}
                      disabled={index === filteredTodos.length - 1}
                      className="p-0.5 text-slate-300 hover:text-slate-700 disabled:opacity-10 hover:bg-slate-100 rounded transition"
                      title="往下移動一位"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Batch selection checkbox */}
                {isBatchMode && (
                  <button
                    type="button"
                    onClick={() => handleToggleSelectId(todo.id)}
                    className="mt-0.5 p-1 rounded hover:bg-slate-100 text-indigo-600 transition shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                )}

                {/* Status Toggle Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTodo(todo.id)}
                  className={`mt-0.5 p-2 rounded-lg transition shrink-0 ${
                    todo.completed
                      ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200'
                  }`}
                  title={todo.completed ? '點擊取消劃線完成' : '點擊標記為現場已查核 (打勾劃線)'}
                >
                  {todo.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                {/* Content */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Badges strip */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.badge}`}>
                      {todo.category}
                    </span>

                    {todo.trade && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {todo.trade}
                      </span>
                    )}

                    {/* Priority tag matching 5-color palette */}
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      todo.isUrgent 
                        ? 'bg-[#FDF0ED] text-[#E76F51] border border-[#F8C8BD]' 
                        : 'bg-[#FDF8EC] text-[#9A741A] border border-[#F6E3B0]'
                    }`}>
                      {todo.isUrgent ? '高' : '中'}
                    </span>

                    {/* Status pill with bullet dot matching 5-color palette */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      todo.completed
                        ? 'bg-[#EAF6F4] text-[#2A9D8F] border border-[#BBE4DE]'
                        : 'bg-[#EBF3F5] text-[#264653] border border-[#C5DCE2]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        todo.completed ? 'bg-[#2A9D8F]' : 'bg-[#264653]'
                      }`} />
                      {todo.completed ? '已完成' : '進行中'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`text-sm font-bold leading-snug ${
                    todo.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}>
                    {todo.title}
                  </h3>

                  {/* Notes / Details */}
                  {todo.notes && (
                    <p className={`text-xs p-2 rounded-lg border leading-relaxed font-medium ${
                      todo.completed 
                        ? 'text-slate-400 bg-slate-100/60 border-slate-200' 
                        : 'text-slate-600 bg-white/80 border-slate-200/80'
                    }`}>
                      💡 {todo.notes}
                    </p>
                  )}

                  {/* Meta tags */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                    {todo.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {todo.location}
                      </span>
                    )}

                    {todo.assignedTo && (
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3 h-3 text-emerald-600" />
                        負責：{todo.assignedTo}
                      </span>
                    )}

                    {todo.dueDate && (
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        期限：{todo.dueDate}
                      </span>
                    )}

                    {todo.relatedMilestoneName && (
                      <span className="text-slate-400 truncate max-w-xs">
                        關聯：{todo.relatedMilestoneName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(todo)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                  title="編輯項目"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Safe In-DOM Delete Confirmation (No window.confirm!) */}
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 rounded-lg px-2 py-1 shadow-xs animate-in fade-in duration-100">
                    <span className="text-[11px] font-bold text-rose-800 whitespace-nowrap">確定移除？</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteTodo(todo.id);
                        setDeletingId(null);
                      }}
                      className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition shadow-2xs"
                    >
                      確認
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] transition"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingId(todo.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 hover:border-rose-600 border border-rose-200 transition text-[11px] font-bold shadow-2xs"
                    title="自待辦清單中徹底刪除此工項"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>移除</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredTodos.length === 0 && (
          <div className="py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
            <p className="font-bold text-slate-700">目前無待辦查核項目</p>
            <p className="text-xs text-slate-400">
              {hideCompleted 
                ? '已隱藏劃線完成項目。若要檢視，可關閉「隱藏劃線項」切換'
                : '您可以點選右上角「新增待辦項目」登記工項，或點選「重設精簡」載入核心天花板工項'}
            </p>
          </div>
        )}
      </div>

      {/* In-App Confirmation Modal for Dangerous Actions */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-rose-600">
                <span className="p-2.5 rounded-xl bg-rose-100 border border-rose-200">
                  <AlertOctagon className="w-6 h-6" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModal.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmModal.description}
              </p>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs"
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Todo Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/10 text-white">
                  <CheckSquare className="w-5 h-5 text-indigo-200" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingTodo ? '編輯待辦查核項目' : '新增重點待辦與查核項目'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    登記天花板破壞還原、應拆未拆處理與追加查核事項
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 text-base"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets Picker (only when adding new) */}
            {!editingTodo && (
              <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
                <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>天花板拆除與破壞還原常用範本 (點擊快速帶入)：</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {QUICK_PRESETS.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-slate-700 font-medium shrink-0 transition text-[11px]"
                    >
                      {p.category}：{p.title.slice(0, 16)}...
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  待辦事項名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例：會議室天花板拆除破壞還原、舊角料清運..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    查核性質類別 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TodoCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 font-medium"
                  >
                    <option value="應拆未拆處理">應拆未拆處理</option>
                    <option value="破壞還原">破壞還原</option>
                    <option value="額外追加工項">額外追加工項</option>
                    <option value="現場核對查核">現場核對查核</option>
                    <option value="缺失改善">缺失改善</option>
                    <option value="一般待辦">一般待辦</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    施作 / 改善工種
                  </label>
                  <select
                    value={formTrade}
                    onChange={(e) => setFormTrade(e.target.value as TradeCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600"
                  >
                    {TRADE_LIST.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    施工位置 / 區域
                  </label>
                  <input
                    type="text"
                    placeholder="例：會議室-1 (天花板)"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    指定負責工班 / 師傅
                  </label>
                  <input
                    type="text"
                    placeholder="例：木工師傅、拆除工班、水電組"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    預定查核完成日
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    關聯工程工項名稱
                  </label>
                  <input
                    type="text"
                    placeholder="例：會議室天花板拆除破壞還原、應拆未拆處理等"
                    value={formMilestoneName}
                    onChange={(e) => setFormMilestoneName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  現場查核細節與施工注意事項
                </label>
                <textarea
                  rows={3}
                  placeholder="請詳述應處理未處理的具體位置、破壞還原工法、封板前是否需拍照確認等..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={formIsUrgent}
                    onChange={(e) => setFormIsUrgent(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-600"
                  />
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>列為「重點關注」項目 (優先催辦與紅字標示)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  {editingTodo ? '儲存變更' : '新增並儲存待辦'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
