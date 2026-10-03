import React, { useState, useEffect, useCallback } from 'react';
import { 
  ProjectInfo, 
  ProcurementItem, 
  MilestoneTask, 
  VendorContact, 
  AlertWarning, 
  SyncConfig,
  NavigationTab,
  TodoItem
} from './types';
import { INITIAL_TODOS } from './data/initialData';
import { 
  loadAppState, 
  saveAppState, 
  resetAppState, 
  exportProcurementToCSV, 
  exportMilestonesToCSV, 
  downloadFile,
  syncWithGoogleSheets,
  AppState
} from './services/storage';
import { Header } from './components/Header';
import { GanttChart } from './components/GanttChart';
import { CalendarView } from './components/CalendarView';
import { ProcurementTable } from './components/ProcurementTable';
import { MilestonesList } from './components/MilestonesList';
import { TodoList } from './components/TodoList';
import { AlertCenter } from './components/AlertCenter';
import { VendorDirectory } from './components/VendorDirectory';
import { SyncAndExportModal } from './components/SyncAndExportModal';
import { ItemEditModal } from './components/ItemEditModal';
import { ReportPrintView } from './components/ReportPrintView';
import { CalendarSyncModal } from './components/CalendarSyncModal';
import { DesignerCoordinationModal } from './components/DesignerCoordinationModal';
import { ShareModal } from './components/ShareModal';
import { saveLocalBackup } from './services/storage';
import { 
  testConnection, 
  checkFirestoreHasData, 
  syncStateToFirestore, 
  loadStateFromFirestore, 
  subscribeToFirestore,
  saveMilestoneToFirestore,
  deleteMilestoneFromFirestore,
  saveProcurementToFirestore,
  deleteProcurementFromFirestore,
  saveTodoToFirestore,
  isNewerTimestamp
} from './services/firebase';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<NavigationTab>('calendar');

  // Cloud Firebase state
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'connected' | 'error' | 'syncing'>('connecting');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [isDesignerCoordOpen, setIsDesignerCoordOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; visible: boolean } | null>(null);
  const [itemModalMode, setItemModalMode] = useState<'procurement' | 'milestone'>('procurement');
  const [editingProcurement, setEditingProcurement] = useState<ProcurementItem | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneTask | null>(null);

  const showSyncToast = (msg: string) => {
    setSyncToast({ message: msg, visible: true });
    setTimeout(() => {
      setSyncToast((prev) => (prev ? { ...prev, visible: false } : null));
    }, 2500);
  };

  // Auto-save whenever state changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Consistency check: ensure all milestones have contractorName: '劉仲傑 / 設計師'
  // and paint milestone has 10/2-10/4
  useEffect(() => {
    setAppState((prev) => {
      let changed = false;
      const patchedMilestones = prev.milestones.map((m) => {
        let mUpdated = false;
        let newContractor = m.contractorName;
        let newStart = m.startDate;
        let newEnd = m.endDate;

        if (m.contractorName !== '劉仲傑 / 設計師') {
          newContractor = '劉仲傑 / 設計師';
          mUpdated = true;
        }

        if (m.trade === '油漆工程' && (m.name.includes('乳膠漆') || m.actionType === '施工') && (m.startDate !== '2026-10-02' || m.endDate !== '2026-10-04')) {
          newStart = '2026-10-02';
          newEnd = '2026-10-04';
          mUpdated = true;
        }

        if (mUpdated) {
          changed = true;
          const updated = {
            ...m,
            contractorName: newContractor,
            startDate: newStart,
            endDate: newEnd,
            updatedAt: new Date().toISOString(),
          };
          saveMilestoneToFirestore(updated, true).catch(console.warn);
          return updated;
        }
        return m;
      });

      if (changed) {
        const next = {
          ...prev,
          milestones: patchedMilestones,
          projectInfo: {
            ...prev.projectInfo,
            designer: '劉仲傑 / 設計師',
            designerContact: '劉仲傑 / 設計師',
          },
        };
        saveAppState(next);
        return next;
      }
      return prev;
    });
  }, []);

  // Initial cloud synchronization: connect and load from Firestore (NEVER overwrite cloud on boot!)
  useEffect(() => {
    let isMounted = true;
    async function initFirebase() {
      try {
        setFirebaseStatus('connecting');
        await testConnection();
        
        // 核心原則：啟動時絕不自動推播本地資料覆蓋雲端！永遠以雲端現存最新資料為準
        const cloudData = await loadStateFromFirestore();
        if (cloudData && cloudData.milestones && cloudData.milestones.length > 0) {
          if (isMounted) {
            setAppState((prev) => {
              const merged: AppState = {
                ...prev,
                ...cloudData,
              };
              saveAppState(merged);
              saveLocalBackup(merged, '雲端資料載入快照');
              return merged;
            });
            setFirebaseStatus('connected');
            setLastSyncedTime(new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }
        } else {
          if (isMounted) {
            setFirebaseStatus('connected');
          }
        }

        // 實時訂閱監聽：帶有時間戳防覆蓋檢核
        const unsubscribe = subscribeToFirestore((data) => {
          if (!isMounted) return;
          setAppState((prev) => {
            let nextMilestones = prev.milestones;
            if (data.milestones) {
              const remoteMap = new Map(data.milestones.map((m) => [m.id, m]));
              nextMilestones = prev.milestones.map((localM) => {
                const remoteM = remoteMap.get(localM.id);
                if (!remoteM) return localM;
                // 只有當雲端資料的時間戳更晚或相等，才更新本地；若本地正在編輯中且時間戳較新，則保留本地
                if (!localM.updatedAt || isNewerTimestamp(remoteM.updatedAt, localM.updatedAt)) {
                  return remoteM;
                }
                return localM;
              });
            }

            const updated: AppState = {
              ...prev,
              milestones: nextMilestones,
              ...(data.procurements ? { procurementItems: data.procurements } : {}),
              ...(data.todos ? { todos: data.todos } : {}),
            };
            saveAppState(updated);
            return updated;
          });
          setLastSyncedTime(new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        });

        return () => {
          unsubscribe();
        };
      } catch (err) {
        console.warn('Firebase sync error:', err);
        if (isMounted) setFirebaseStatus('connected');
      }
    }

    initFirebase();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualSyncFirebase = async () => {
    setFirebaseStatus('syncing');
    try {
      await syncStateToFirestore(appState);
      setFirebaseStatus('connected');
      setLastSyncedTime(new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      setFirebaseStatus('error');
      throw e;
    }
  };

  // Background auto sync when state changes and autoSync is enabled
  const triggerBackgroundSync = useCallback(async (state: AppState) => {
    if (state.syncConfig.autoSync && state.syncConfig.googleSheetsUrl) {
      try {
        await syncWithGoogleSheets(state.syncConfig.googleSheetsUrl, state);
      } catch (e) {
        console.warn('Background sync error', e);
      }
    }
  }, []);

  // Update handlers
  const handleUpdateProcurementItem = (updated: ProcurementItem) => {
    const now = new Date().toISOString();
    const itemWithTime = {
      ...updated,
      updatedAt: now,
    };
    saveProcurementToFirestore(itemWithTime, true).catch(console.warn);
    setAppState((prev) => {
      const next = {
        ...prev,
        procurementItems: prev.procurementItems.map((it) => (it.id === updated.id ? itemWithTime : it)),
      };
      saveAppState(next);
      saveLocalBackup(next, `更新設備: ${updated.name}`);
      triggerBackgroundSync(next);
      return next;
    });
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncedTime(timeStr);
    showSyncToast(`✅ 設備「${updated.name}」已直接自動寫入雲端 (${timeStr})`);
  };

  const handleDeleteProcurementItem = (id: string) => {
    deleteProcurementFromFirestore(id).catch(console.warn);
    setAppState((prev) => {
      const next = {
        ...prev,
        procurementItems: prev.procurementItems.filter((it) => it.id !== id),
      };
      saveAppState(next);
      triggerBackgroundSync(next);
      return next;
    });
    showSyncToast('🗑️ 設備已從雲端移除');
  };

  const handleSaveProcurement = (item: ProcurementItem) => {
    const now = new Date().toISOString();
    const itemWithTime = {
      ...item,
      updatedAt: now,
    };
    saveProcurementToFirestore(itemWithTime, true).catch(console.warn);
    setAppState((prev) => {
      const exists = prev.procurementItems.some((it) => it.id === item.id);
      const nextItems = exists
        ? prev.procurementItems.map((it) => (it.id === item.id ? itemWithTime : it))
        : [itemWithTime, ...prev.procurementItems];
      const next = { ...prev, procurementItems: nextItems };
      saveAppState(next);
      saveLocalBackup(next, `儲存設備: ${item.name}`);
      triggerBackgroundSync(next);
      return next;
    });
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncedTime(timeStr);
    showSyncToast(`✅ 設備採購資料已直接自動寫入雲端 (${timeStr})`);
  };

  const handleUpdateMilestone = (updated: MilestoneTask) => {
    const now = new Date().toISOString();
    const taskWithTime = {
      ...updated,
      updatedAt: now,
    };
    saveMilestoneToFirestore(taskWithTime, true).catch(console.warn);
    setAppState((prev) => {
      const next = {
        ...prev,
        milestones: prev.milestones.map((m) => (m.id === updated.id ? taskWithTime : m)),
      };
      saveAppState(next);
      saveLocalBackup(next, `更新工種進度: ${updated.name}`);
      triggerBackgroundSync(next);
      return next;
    });
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncedTime(timeStr);
    showSyncToast(`✅ 工種「${updated.trade}」進度已直接自動寫入雲端 (${timeStr})`);
  };

  const handleDeleteMilestone = (id: string) => {
    deleteMilestoneFromFirestore(id).catch(console.warn);
    setAppState((prev) => {
      const next = {
        ...prev,
        milestones: prev.milestones.filter((m) => m.id !== id),
      };
      saveAppState(next);
      triggerBackgroundSync(next);
      return next;
    });
    showSyncToast('🗑️ 工項已從雲端移除');
  };

  const handleSaveMilestone = (task: MilestoneTask) => {
    const now = new Date().toISOString();
    const taskWithTime = {
      ...task,
      updatedAt: now,
    };
    saveMilestoneToFirestore(taskWithTime, true).catch(console.warn);
    setAppState((prev) => {
      const exists = prev.milestones.some((m) => m.id === task.id);
      const nextMilestones = exists
        ? prev.milestones.map((m) => (m.id === task.id ? taskWithTime : m))
        : [taskWithTime, ...prev.milestones];
      const next = { ...prev, milestones: nextMilestones };
      saveAppState(next);
      saveLocalBackup(next, `儲存工種進度: ${task.name}`);
      triggerBackgroundSync(next);
      return next;
    });
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncedTime(timeStr);
    showSyncToast(`✅ 工項進度已直接自動寫入雲端 (${timeStr})`);
  };

  const handleAddAlert = (newAlert: AlertWarning) => {
    setAppState((prev) => ({
      ...prev,
      alerts: [newAlert, ...prev.alerts],
    }));
  };

  const handleDismissAlert = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => a.id !== id),
    }));
  };

  // Todo items handlers
  const handleToggleTodo = (id: string) => {
    setAppState((prev) => {
      const now = new Date();
      const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const isoNow = now.toISOString();
      const nextTodos = (prev.todos || []).map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          const updated = {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? timeStr : undefined,
            updatedAt: isoNow,
          };
          saveTodoToFirestore(updated, true).catch(console.warn);
          return updated;
        }
        return t;
      });
      const next = { ...prev, todos: nextTodos };
      saveAppState(next);
      triggerBackgroundSync(next);
      return next;
    });
    showSyncToast('✅ 待辦狀態已即時同步');
  };

  const handleAddTodo = (newTodo: TodoItem) => {
    const withTime = { ...newTodo, updatedAt: new Date().toISOString() };
    saveTodoToFirestore(withTime, true).catch(console.warn);
    setAppState((prev) => {
      const next = { ...prev, todos: [withTime, ...(prev.todos || [])] };
      saveAppState(next);
      triggerBackgroundSync(next);
      return next;
    });
    showSyncToast('✅ 新增待辦已即時儲存至雲端');
  };

  const handleUpdateTodo = (updated: TodoItem) => {
    const withTime = { ...updated, updatedAt: new Date().toISOString() };
    saveTodoToFirestore(withTime, true).catch(console.warn);
    setAppState((prev) => {
      const next = {
        ...prev,
        todos: (prev.todos || []).map((t) => (t.id === updated.id ? withTime : t)),
      };
      saveAppState(next);
      triggerBackgroundSync(next);
      return next;
    });
    showSyncToast('✅ 待辦項目已即時更新');
  };

  const handleDeleteTodo = (id: string) => {
    setAppState((prev) => {
      const next = {
        ...prev,
        todos: (prev.todos || []).filter((t) => t.id !== id),
      };
      triggerBackgroundSync(next);
      return next;
    });
  };

  const handleDeleteMultipleTodos = (ids: string[]) => {
    setAppState((prev) => {
      const idSet = new Set(ids);
      const next = {
        ...prev,
        todos: (prev.todos || []).filter((t) => !idSet.has(t.id)),
      };
      triggerBackgroundSync(next);
      return next;
    });
  };

  const handleClearCompletedTodos = () => {
    setAppState((prev) => {
      const next = {
        ...prev,
        todos: (prev.todos || []).filter((t) => !t.completed),
      };
      triggerBackgroundSync(next);
      return next;
    });
  };

  const handleClearAllTodos = () => {
    setAppState((prev) => {
      const next = {
        ...prev,
        todos: [],
      };
      triggerBackgroundSync(next);
      return next;
    });
  };

  const handleResetTodos = () => {
    setAppState((prev) => {
      const next = {
        ...prev,
        todos: INITIAL_TODOS,
      };
      triggerBackgroundSync(next);
      return next;
    });
  };

  const handleReorderTodos = (newTodos: TodoItem[]) => {
    setAppState((prev) => {
      const next = {
        ...prev,
        todos: newTodos,
      };
      triggerBackgroundSync(next);
      return next;
    });
  };

  const handleAddVendor = (vendor: VendorContact) => {
    setAppState((prev) => ({
      ...prev,
      vendors: [vendor, ...prev.vendors],
    }));
  };

  const handleUpdateVendor = (vendor: VendorContact) => {
    setAppState((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) => (v.id === vendor.id ? vendor : v)),
    }));
  };

  const handleDeleteVendor = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== id),
    }));
  };

  const handleUpdateSyncConfig = (config: SyncConfig) => {
    setAppState((prev) => ({
      ...prev,
      syncConfig: config,
    }));
  };

  const handleResetData = () => {
    const fresh = resetAppState();
    setAppState(fresh);
  };

  const handleImportJSON = (imported: AppState) => {
    setAppState(imported);
    saveAppState(imported);
  };

  // CSV Exports
  const handleExportProcurementCSV = () => {
    const csv = exportProcurementToCSV(appState.procurementItems);
    downloadFile(csv, `翔生資訊_誠豐金10F設備採購清單_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportMilestonesCSV = () => {
    const csv = exportMilestonesToCSV(appState.milestones);
    downloadFile(csv, `翔生資訊_辦公室裝潢工程施工進度表_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#264653] selection:text-white">
      {/* Top Header */}
      <Header
        projectInfo={appState.projectInfo}
        procurementItems={appState.procurementItems}
        milestones={appState.milestones}
        alerts={appState.alerts}
        syncConfig={appState.syncConfig}
        todos={appState.todos}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        firebaseStatus={firebaseStatus}
        lastSyncedTime={lastSyncedTime}
        onManualSyncFirebase={handleManualSyncFirebase}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenCalendarSyncModal={() => setIsCalendarSyncOpen(true)}
        onOpenDesignerCoordModal={() => setIsDesignerCoordOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenNewItemModal={() => {
          setEditingProcurement(null);
          setEditingMilestone(null);
          setItemModalMode(activeTab === 'milestones' ? 'milestone' : 'procurement');
          setIsItemModalOpen(true);
        }}
        onPrintReport={() => setIsPrintReportOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1720px] 2xl:max-w-[1880px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {activeTab === 'gantt' && (
          <GanttChart
            milestones={appState.milestones}
            procurementItems={appState.procurementItems}
            onSelectMilestone={(m) => {
              setEditingMilestone(m);
              setEditingProcurement(null);
              setItemModalMode('milestone');
              setIsItemModalOpen(true);
            }}
            onSelectProcurement={(p) => {
              setEditingProcurement(p);
              setEditingMilestone(null);
              setItemModalMode('procurement');
              setIsItemModalOpen(true);
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            milestones={appState.milestones}
            procurementItems={appState.procurementItems}
            onOpenCalendarSyncModal={() => setIsCalendarSyncOpen(true)}
            onSelectMilestone={(m) => {
              setEditingMilestone(m);
              setEditingProcurement(null);
              setItemModalMode('milestone');
              setIsItemModalOpen(true);
            }}
            onSelectProcurement={(p) => {
              setEditingProcurement(p);
              setEditingMilestone(null);
              setItemModalMode('procurement');
              setIsItemModalOpen(true);
            }}
            onDeleteMilestone={handleDeleteMilestone}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementTable
            items={appState.procurementItems}
            onUpdateItem={handleUpdateProcurementItem}
            onDeleteItem={handleDeleteProcurementItem}
            onAddNewItem={() => {
              setEditingProcurement(null);
              setEditingMilestone(null);
              setItemModalMode('procurement');
              setIsItemModalOpen(true);
            }}
            onEditItem={(item) => {
              setEditingProcurement(item);
              setEditingMilestone(null);
              setItemModalMode('procurement');
              setIsItemModalOpen(true);
            }}
            onExportCSV={handleExportProcurementCSV}
          />
        )}

        {activeTab === 'milestones' && (
          <MilestonesList
            milestones={appState.milestones}
            todos={appState.todos}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onOpenDesignerCoordModal={() => setIsDesignerCoordOpen(true)}
            onNavigateToTodos={() => setActiveTab('todos')}
            onAddNewMilestone={() => {
              setEditingMilestone(null);
              setEditingProcurement(null);
              setItemModalMode('milestone');
              setIsItemModalOpen(true);
            }}
            onEditMilestone={(m) => {
              setEditingMilestone(m);
              setEditingProcurement(null);
              setItemModalMode('milestone');
              setIsItemModalOpen(true);
            }}
            onExportCSV={handleExportMilestonesCSV}
          />
        )}

        {activeTab === 'todos' && (
          <TodoList
            todos={appState.todos || []}
            milestones={appState.milestones}
            onToggleTodo={handleToggleTodo}
            onAddTodo={handleAddTodo}
            onUpdateTodo={handleUpdateTodo}
            onDeleteTodo={handleDeleteTodo}
            onReorderTodos={handleReorderTodos}
            onDeleteMultipleTodos={handleDeleteMultipleTodos}
            onClearCompletedTodos={handleClearCompletedTodos}
            onClearAllTodos={handleClearAllTodos}
            onResetTodosToDefault={handleResetTodos}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertCenter
            alerts={appState.alerts}
            milestones={appState.milestones}
            procurementItems={appState.procurementItems}
            onAddAlert={handleAddAlert}
            onDismissAlert={handleDismissAlert}
            onOpenCalendarSyncModal={() => setIsCalendarSyncOpen(true)}
            onOpenDesignerCoordModal={() => setIsDesignerCoordOpen(true)}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorDirectory
            vendors={appState.vendors}
            procurementItems={appState.procurementItems}
            milestones={appState.milestones}
            onAddVendor={handleAddVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
          />
        )}
      </main>

      {/* Sync & Export Hub Modal */}
      <SyncAndExportModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncConfig={appState.syncConfig}
        onUpdateSyncConfig={handleUpdateSyncConfig}
        appState={appState}
        onExportProcurementCSV={handleExportProcurementCSV}
        onExportMilestonesCSV={handleExportMilestonesCSV}
        onPrintReport={() => {
          setIsSyncModalOpen(false);
          setIsPrintReportOpen(true);
        }}
        onResetData={handleResetData}
        onImportJSON={handleImportJSON}
        onManualSyncFirebase={handleManualSyncFirebase}
        firebaseStatus={firebaseStatus}
        lastSyncedTime={lastSyncedTime}
      />

      {/* Item / Milestone Add or Edit Modal */}
      <ItemEditModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingProcurement(null);
          setEditingMilestone(null);
        }}
        mode={itemModalMode}
        editingProcurement={editingProcurement}
        editingMilestone={editingMilestone}
        vendors={appState.vendors}
        onSaveProcurement={handleSaveProcurement}
        onSaveMilestone={handleSaveMilestone}
        onDeleteProcurement={handleDeleteProcurementItem}
        onDeleteMilestone={handleDeleteMilestone}
      />

      {/* Executive Report Print View */}
      <ReportPrintView
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        projectInfo={appState.projectInfo}
        procurementItems={appState.procurementItems}
        milestones={appState.milestones}
        alerts={appState.alerts}
        vendors={appState.vendors}
        todos={appState.todos}
      />

      {/* Calendar Sync & Overdue Alerts Modal */}
      <CalendarSyncModal
        isOpen={isCalendarSyncOpen}
        onClose={() => setIsCalendarSyncOpen(false)}
        milestones={appState.milestones}
        projectInfo={appState.projectInfo}
      />

      {/* Designer Coordination & Task In-place Adjust Modal */}
      <DesignerCoordinationModal
        isOpen={isDesignerCoordOpen}
        onClose={() => setIsDesignerCoordOpen(false)}
        milestones={appState.milestones}
        onUpdateMilestone={handleUpdateMilestone}
        onAddMilestone={handleSaveMilestone}
        designerName={appState.projectInfo.designer || '何設計師'}
      />

      {/* Share Webpage Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Floating Real-time Auto-Sync Toast */}
      {syncToast && syncToast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div className="bg-[#264653]/95 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs font-bold flex items-center gap-2.5 backdrop-blur-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F] animate-ping"></span>
            <span>{syncToast.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-slate-600 font-medium">
            翔生資訊辦公室裝潢工程與設備採購整合管理系統 • 彰化市中山路二段2號10樓
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>儲存狀態：本機 IndexedDB + 雲端同步</span>
            <span>總工期：9/7 ~ 11/25 (驗收)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
