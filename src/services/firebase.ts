import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  deleteDoc,
  collection, 
  onSnapshot, 
  writeBatch,
  getDocFromServer 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppState } from './storage';
import { MilestoneTask, ProcurementItem, TodoItem, VendorContact, ProjectInfo } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 核心時間戳比對檢核機制：只有更晚的時間戳才允許更新
export function isNewerTimestamp(incoming?: string, existing?: string): boolean {
  if (!incoming) return false;
  if (!existing) return true;
  return new Date(incoming).getTime() > new Date(existing).getTime();
}

// Connection test on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check configuration.');
    }
    return false;
  }
}

// Check if Firestore already has project data
export async function checkFirestoreHasData(): Promise<boolean> {
  const path = 'milestones';
  try {
    const snap = await getDocs(collection(db, path));
    return !snap.empty;
  } catch (err) {
    console.warn('Check firestore data status:', err);
    return false;
  }
}

export interface CloudSnapshot {
  id: string;
  timestamp: string;
  note: string;
  deviceLabel?: string;
  milestoneCount: number;
  procurementCount: number;
  todoCount: number;
  state: AppState;
}

// 建立歷史存檔快照（每次全量備份或重要操作時記錄，永不遺失歷史）
export async function createCloudSnapshot(state: AppState, note = '自動雲端版本備份'): Promise<string> {
  const snapshotId = `snapshot_${Date.now()}`;
  const now = new Date().toISOString();
  try {
    await setDoc(doc(db, 'snapshots', snapshotId), {
      id: snapshotId,
      timestamp: now,
      note,
      milestoneCount: state.milestones.length,
      procurementCount: state.procurementItems.length,
      todoCount: state.todos.length,
      stateJson: JSON.stringify(state),
    });
    return snapshotId;
  } catch (e) {
    console.warn('Failed creating cloud snapshot', e);
    return '';
  }
}

// 取得雲端歷史備份列表
export async function getCloudSnapshots(): Promise<CloudSnapshot[]> {
  try {
    const snap = await getDocs(collection(db, 'snapshots'));
    const list: CloudSnapshot[] = [];
    snap.forEach((d) => {
      const data = d.data();
      try {
        const parsedState = JSON.parse(data.stateJson) as AppState;
        list.push({
          id: data.id,
          timestamp: data.timestamp,
          note: data.note || '雲端快照',
          milestoneCount: data.milestoneCount || 0,
          procurementCount: data.procurementCount || 0,
          todoCount: data.todoCount || 0,
          state: parsedState,
        });
      } catch (_) {}
    });
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (err) {
    console.warn('Failed reading cloud snapshots', err);
    return [];
  }
}

// 嚴格檢核的雲端全量同步：逐項比對時間戳，舊資料絕對不可覆蓋雲端新資料！
export async function syncStateToFirestore(state: AppState, force = false): Promise<{ updatedCount: number; skippedCount: number }> {
  try {
    const now = new Date().toISOString();
    let updatedCount = 0;
    let skippedCount = 0;

    // 先留存當前欲上傳的狀態作為歷史快照
    await createCloudSnapshot(state, force ? '手動強制覆蓋還原' : '定時/手動安全同步');

    // 1. Project Info (檢核時間戳)
    const projectRef = doc(db, 'projects', 'current');
    const existingProject = await getDoc(projectRef);
    if (!existingProject.exists() || force || isNewerTimestamp(state.projectInfo.updatedAt, existingProject.data()?.updatedAt)) {
      await setDoc(projectRef, {
        ...state.projectInfo,
        updatedAt: state.projectInfo.updatedAt || now,
      });
      updatedCount++;
    } else {
      skippedCount++;
    }

    // 2. 獲取現有雲端 Milestones 進行逐一時間戳比對
    const remoteMSnap = await getDocs(collection(db, 'milestones'));
    const remoteMMap = new Map<string, MilestoneTask>();
    remoteMSnap.forEach((d) => remoteMMap.set(d.id, d.data() as MilestoneTask));

    const mBatch = writeBatch(db);
    let mBatchHasOps = false;

    state.milestones.forEach((m) => {
      const remote = remoteMMap.get(m.id);
      // 只有當新資料時間戳更晚，或是強制模式，才允許更新！
      if (!remote || force || isNewerTimestamp(m.updatedAt, remote.updatedAt)) {
        const ref = doc(db, 'milestones', m.id);
        mBatch.set(ref, {
          ...m,
          updatedAt: m.updatedAt || now,
        });
        mBatchHasOps = true;
        updatedCount++;
      } else {
        skippedCount++;
      }
    });
    if (mBatchHasOps) await mBatch.commit();

    // 3. Procurements 檢核時間戳
    const remotePSnap = await getDocs(collection(db, 'procurements'));
    const remotePMap = new Map<string, ProcurementItem>();
    remotePSnap.forEach((d) => remotePMap.set(d.id, d.data() as ProcurementItem));

    const pBatch = writeBatch(db);
    let pBatchHasOps = false;

    state.procurementItems.forEach((p) => {
      const remote = remotePMap.get(p.id);
      if (!remote || force || isNewerTimestamp(p.updatedAt, remote.updatedAt)) {
        const ref = doc(db, 'procurements', p.id);
        pBatch.set(ref, {
          ...p,
          updatedAt: p.updatedAt || now,
        });
        pBatchHasOps = true;
        updatedCount++;
      } else {
        skippedCount++;
      }
    });
    if (pBatchHasOps) await pBatch.commit();

    // 4. Todos 檢核時間戳
    const remoteTSnap = await getDocs(collection(db, 'todos'));
    const remoteTMap = new Map<string, TodoItem>();
    remoteTSnap.forEach((d) => remoteTMap.set(d.id, d.data() as TodoItem));

    const tBatch = writeBatch(db);
    let tBatchHasOps = false;

    state.todos.forEach((t) => {
      const remote = remoteTMap.get(t.id);
      if (!remote || force || isNewerTimestamp(t.updatedAt, remote.updatedAt)) {
        const ref = doc(db, 'todos', t.id);
        tBatch.set(ref, {
          ...t,
          updatedAt: t.updatedAt || now,
        });
        tBatchHasOps = true;
        updatedCount++;
      } else {
        skippedCount++;
      }
    });
    if (tBatchHasOps) await tBatch.commit();

    // 5. Vendors 寫入
    const vBatch = writeBatch(db);
    state.vendors.forEach((v) => {
      const ref = doc(db, 'vendors', v.id);
      vBatch.set(ref, {
        ...v,
        updatedAt: v.updatedAt || now,
      });
    });
    await vBatch.commit();

    return { updatedCount, skippedCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'projects/current');
    return { updatedCount: 0, skippedCount: 0 };
  }
}

// Fetch all data from Firestore
export async function loadStateFromFirestore(): Promise<Partial<AppState> | null> {
  try {
    // 1. Check Project
    const projSnap = await getDoc(doc(db, 'projects', 'current'));
    const projectInfo = projSnap.exists() ? (projSnap.data() as ProjectInfo) : undefined;

    // 2. Milestones
    const mSnap = await getDocs(collection(db, 'milestones'));
    if (mSnap.empty) return null;

    const milestones: MilestoneTask[] = [];
    mSnap.forEach((d) => milestones.push(d.data() as MilestoneTask));

    // 3. Procurements
    const pSnap = await getDocs(collection(db, 'procurements'));
    const procurementItems: ProcurementItem[] = [];
    pSnap.forEach((d) => procurementItems.push(d.data() as ProcurementItem));

    // 4. Todos
    const tSnap = await getDocs(collection(db, 'todos'));
    const todos: TodoItem[] = [];
    tSnap.forEach((d) => todos.push(d.data() as TodoItem));

    // 5. Vendors
    const vSnap = await getDocs(collection(db, 'vendors'));
    const vendors: VendorContact[] = [];
    vSnap.forEach((d) => vendors.push(d.data() as VendorContact));

    return {
      ...(projectInfo ? { projectInfo } : {}),
      milestones: milestones.sort((a, b) => a.startDate.localeCompare(b.startDate)),
      procurementItems: procurementItems.sort((a, b) => a.category.localeCompare(b.category)),
      todos: todos.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || '')),
      vendors: vendors.sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    console.warn('Failed loading from Firestore:', error);
    return null;
  }
}

// Real-time listener across collections with timestamp protection
export function subscribeToFirestore(
  onData: (data: {
    milestones?: MilestoneTask[];
    procurements?: ProcurementItem[];
    todos?: TodoItem[];
  }) => void
) {
  const unsubs: (() => void)[] = [];

  // Listen to milestones
  const unSubMilestones = onSnapshot(
    collection(db, 'milestones'),
    (snap) => {
      const items: MilestoneTask[] = [];
      snap.forEach((d) => items.push(d.data() as MilestoneTask));
      if (items.length > 0) {
        onData({ milestones: items.sort((a, b) => a.startDate.localeCompare(b.startDate)) });
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'milestones')
  );
  unsubs.push(unSubMilestones);

  // Listen to procurements
  const unSubProcurements = onSnapshot(
    collection(db, 'procurements'),
    (snap) => {
      const items: ProcurementItem[] = [];
      snap.forEach((d) => items.push(d.data() as ProcurementItem));
      if (items.length > 0) {
        onData({ procurements: items.sort((a, b) => a.category.localeCompare(b.category)) });
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'procurements')
  );
  unsubs.push(unSubProcurements);

  // Listen to todos
  const unSubTodos = onSnapshot(
    collection(db, 'todos'),
    (snap) => {
      const items: TodoItem[] = [];
      snap.forEach((d) => items.push(d.data() as TodoItem));
      if (items.length > 0) {
        onData({ todos: items });
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'todos')
  );
  unsubs.push(unSubTodos);

  return () => {
    unsubs.forEach((fn) => fn());
  };
}

// 嚴格檢核的單項 Milestone 儲存：比對雲端現存紀錄，舊資料不可覆蓋！
export async function saveMilestoneToFirestore(task: MilestoneTask, force = false): Promise<boolean> {
  const path = `milestones/${task.id}`;
  const now = new Date().toISOString();
  const taskWithTime = {
    ...task,
    updatedAt: task.updatedAt || now,
  };

  try {
    const ref = doc(db, 'milestones', task.id);
    if (!force) {
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as MilestoneTask;
        if (existingData.updatedAt && !isNewerTimestamp(taskWithTime.updatedAt, existingData.updatedAt)) {
          console.warn(`[防覆蓋檢核攔截] 工項 ${task.name} 雲端現有版本較新 (${existingData.updatedAt} >= ${taskWithTime.updatedAt})，取消舊資料覆蓋！`);
          return false;
        }
      }
    }

    await setDoc(ref, taskWithTime);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

// Delete milestone from Firestore
export async function deleteMilestoneFromFirestore(id: string): Promise<void> {
  const path = `milestones/${id}`;
  try {
    await deleteDoc(doc(db, 'milestones', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 嚴格檢核的單項 Procurement 儲存
export async function saveProcurementToFirestore(item: ProcurementItem, force = false): Promise<boolean> {
  const path = `procurements/${item.id}`;
  const now = new Date().toISOString();
  const itemWithTime = {
    ...item,
    updatedAt: item.updatedAt || now,
  };

  try {
    const ref = doc(db, 'procurements', item.id);
    if (!force) {
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as ProcurementItem;
        if (existingData.updatedAt && !isNewerTimestamp(itemWithTime.updatedAt, existingData.updatedAt)) {
          console.warn(`[防覆蓋檢核攔截] 設備 ${item.name} 雲端版本較新，取消舊資料覆蓋！`);
          return false;
        }
      }
    }

    await setDoc(ref, itemWithTime);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

// Delete procurement from Firestore
export async function deleteProcurementFromFirestore(id: string): Promise<void> {
  const path = `procurements/${id}`;
  try {
    await deleteDoc(doc(db, 'procurements', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 嚴格檢核的單項 Todo 儲存
export async function saveTodoToFirestore(todo: TodoItem, force = false): Promise<boolean> {
  const path = `todos/${todo.id}`;
  const now = new Date().toISOString();
  const todoWithTime = {
    ...todo,
    updatedAt: todo.updatedAt || now,
  };

  try {
    const ref = doc(db, 'todos', todo.id);
    if (!force) {
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as TodoItem;
        if (existingData.updatedAt && !isNewerTimestamp(todoWithTime.updatedAt, existingData.updatedAt)) {
          console.warn(`[防覆蓋檢核攔截] 待辦 ${todo.title} 雲端版本較新，取消舊資料覆蓋！`);
          return false;
        }
      }
    }

    await setDoc(ref, todoWithTime);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}
