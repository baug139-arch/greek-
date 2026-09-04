import { 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot,
  updateDoc,
  deleteDoc
} from '../firebase';
import { HomeworkAssignment, Student, TeacherCustomList, UserProfile } from '../types';

// Circuit breaker for Firestore quota exhaustion
let quotaExhaustedUntil = 0;
let hasLoggedQuotaWarning = false;

function isQuotaExhausted(): boolean {
  return Date.now() < quotaExhaustedUntil;
}

function handleFirestoreError(error: any, actionName: string) {
  const errMsg = error?.message || String(error || '');
  const errCode = error?.code || '';

  if (errCode === 'resource-exhausted' || errMsg.includes('Quota limit exceeded') || errMsg.includes('resource-exhausted')) {
    quotaExhaustedUntil = Date.now() + 15 * 60 * 1000; // Cooldown 15 minutes
    if (!hasLoggedQuotaWarning) {
      console.warn('Firestore: Дневная квота записи исчерпана. Приложение переключено в надёжный локальный режим (все данные сохраняются в localStorage).');
      hasLoggedQuotaWarning = true;
    }
  } else {
    console.warn(`Firestore [${actionName}] error:`, error);
  }
}

export function isCloudQuotaLimitReached(): boolean {
  return isQuotaExhausted();
}

/**
 * Recursively removes all `undefined` values and converts them to Firestore-safe types.
 * This prevents Firestore from throwing "Function setDoc() called with invalid data: Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

// Save or update user profile in Firestore
export async function saveUserProfileToCloud(profile: UserProfile): Promise<void> {
  if (!profile || !profile.uid) return;
  // Always cache locally
  try {
    localStorage.setItem('koine_user_profile', JSON.stringify(profile));
  } catch {}

  if (!db || isQuotaExhausted()) return;

  try {
    const clean = sanitizeForFirestore(profile);
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'saveUserProfileToCloud');
  }
}

// Get user profile from Firestore
export async function getUserProfileFromCloud(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  
  // Try local cache first
  try {
    const cached = localStorage.getItem('koine_user_profile');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.uid === uid) {
        if (!db || isQuotaExhausted()) return parsed;
      }
    }
  } catch {}

  if (!db || isQuotaExhausted()) return null;

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'getUserProfileFromCloud');
    return null;
  }
}

// Get single student data from Cloud by UID
export async function getStudentFromCloud(studentId: string): Promise<Student | null> {
  if (!studentId) return null;

  // Try local storage cache
  try {
    const cached = localStorage.getItem(`koine_student_cache_${studentId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.id === studentId && (!db || isQuotaExhausted())) {
        return parsed;
      }
    }
  } catch {}

  if (!db || isQuotaExhausted()) return null;

  try {
    const studentRef = doc(db, 'students', studentId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      return snap.data() as Student;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'getStudentFromCloud');
    return null;
  }
}

// Search student in Cloud by email
export async function getStudentByEmailFromCloud(email: string): Promise<Student | null> {
  if (!email || !db || isQuotaExhausted()) return null;

  try {
    const lower = email.toLowerCase().trim();
    const studentsCol = collection(db, 'students');
    const snapshot = await getDocs(studentsCol);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Student;
      if (data && data.email && data.email.toLowerCase().trim() === lower) {
        return data;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'getStudentByEmailFromCloud');
    return null;
  }
}

// Save single student data to Cloud
export async function saveStudentToCloud(student: Student): Promise<void> {
  if (!student || !student.id) return;
  const cleanStudent = sanitizeForFirestore(student);

  // Cache locally as backup immediately
  try {
    localStorage.setItem(`koine_student_cache_${student.id}`, JSON.stringify(cleanStudent));
  } catch {}

  if (!db || isQuotaExhausted()) return;

  try {
    const studentRef = doc(db, 'students', student.id);
    await setDoc(studentRef, cleanStudent, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'saveStudentToCloud');
  }
}

// Delete student data from Cloud
export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  if (!studentId) return;

  try {
    localStorage.removeItem(`koine_student_cache_${studentId}`);
  } catch {}

  if (!db || isQuotaExhausted()) return;

  try {
    const studentRef = doc(db, 'students', studentId);
    await deleteDoc(studentRef);
  } catch (error) {
    handleFirestoreError(error, 'deleteStudentFromCloud');
  }
}

// Save all students list to cloud (debounced, avoids loops)
export async function saveAllStudentsToCloud(students: Student[]): Promise<void> {
  if (!students || students.length === 0 || !db || isQuotaExhausted()) return;

  try {
    for (const student of students) {
      if (student && student.id) {
        await saveStudentToCloud(student);
      }
    }
  } catch (error) {
    handleFirestoreError(error, 'saveAllStudentsToCloud');
  }
}

// Deduplicate assignments helper
export function deduplicateAssignments(assignments: HomeworkAssignment[]): HomeworkAssignment[] {
  if (!assignments || assignments.length === 0) return [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const result: HomeworkAssignment[] = [];

  for (const hw of assignments) {
    if (!hw || !hw.id) continue;
    // Key by (title + mode + targetId + assignedDate) to catch logical duplicates created concurrently
    const key = `${hw.title}_${hw.mode}_${hw.targetId}_${hw.assignedDate}_${hw.assignmentType}`;
    if (seenIds.has(hw.id) || seenKeys.has(key)) {
      continue;
    }
    seenIds.add(hw.id);
    seenKeys.add(key);
    result.push(hw);
  }
  return result;
}

// Delete assignment for a student in Firestore
export async function deleteStudentAssignmentFromCloud(studentId: string, assignmentId: string): Promise<void> {
  try {
    const student = await getStudentFromCloud(studentId);
    if (student) {
      const updatedHomework = (student.assignedHomework || []).filter((hw) => hw.id !== assignmentId);
      const updatedStudent: Student = {
        ...student,
        assignedHomework: updatedHomework,
      };
      await saveStudentToCloud(updatedStudent);
    }
  } catch (error) {
    handleFirestoreError(error, 'deleteStudentAssignmentFromCloud');
  }
}

// Subscribe to real-time updates for all students (for Teacher Dashboard & Student roster)
export function subscribeToStudentsFromCloud(onUpdate: (students: Student[]) => void): () => void {
  if (!db || isQuotaExhausted()) {
    return () => {};
  }

  try {
    const studentsCol = collection(db, 'students');
    const unsubscribe = onSnapshot(studentsCol, (snapshot) => {
      const cloudStudents: Student[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Student;
        if (data && data.id) {
          cloudStudents.push(data);
        }
      });
      onUpdate(cloudStudents);
    }, (error) => {
      handleFirestoreError(error, 'subscribeToStudentsFromCloud');
    });
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, 'subscribeToStudentsFromCloud');
    return () => {};
  }
}

// Save custom lists to cloud
export async function saveCustomListsToCloud(lists: TeacherCustomList[]): Promise<void> {
  if (!db || isQuotaExhausted()) return;

  try {
    for (const list of lists) {
      const cleanList = sanitizeForFirestore(list);
      const listRef = doc(db, 'custom_lists', list.id);
      await setDoc(listRef, cleanList, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, 'saveCustomListsToCloud');
  }
}

// Subscribe to custom lists from cloud
export function subscribeToCustomListsFromCloud(onUpdate: (lists: TeacherCustomList[]) => void): () => void {
  if (!db || isQuotaExhausted()) {
    return () => {};
  }

  try {
    const listsCol = collection(db, 'custom_lists');
    const unsubscribe = onSnapshot(listsCol, (snapshot) => {
      if (!snapshot.empty) {
        const cloudLists: TeacherCustomList[] = [];
        snapshot.forEach((docSnap) => {
          cloudLists.push(docSnap.data() as TeacherCustomList);
        });
        onUpdate(cloudLists);
      }
    }, (error) => {
      handleFirestoreError(error, 'subscribeToCustomListsFromCloud');
    });
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, 'subscribeToCustomListsFromCloud');
    return () => {};
  }
}

// Network online status tracking
export function isNetworkOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true;
}

// Track pending offline changes
export function markPendingCloudSync(): void {
  try {
    localStorage.setItem('koine_pending_cloud_sync', 'true');
  } catch {}
}

export function clearPendingCloudSync(): void {
  try {
    localStorage.removeItem('koine_pending_cloud_sync');
  } catch {}
}

export function hasPendingCloudSync(): boolean {
  try {
    return localStorage.getItem('koine_pending_cloud_sync') === 'true';
  } catch {
    return false;
  }
}

// Sync any offline cached student and profile data when back online
export async function syncOfflineCacheToCloud(currentStudentId?: string): Promise<boolean> {
  if (!isNetworkOnline() || !db || isQuotaExhausted()) {
    return false;
  }

  try {
    // 1. Sync cached user profile if exists
    const profileJson = localStorage.getItem('koine_user_profile');
    if (profileJson) {
      const profile = JSON.parse(profileJson);
      if (profile && profile.uid) {
        const clean = sanitizeForFirestore(profile);
        const userRef = doc(db, 'users', profile.uid);
        await setDoc(userRef, clean, { merge: true });
      }
    }

    // 2. Sync current student if id is provided
    if (currentStudentId) {
      const studentCache = localStorage.getItem(`koine_student_cache_${currentStudentId}`);
      if (studentCache) {
        const student = JSON.parse(studentCache);
        if (student && student.id) {
          const cleanStudent = sanitizeForFirestore(student);
          const studentRef = doc(db, 'students', student.id);
          await setDoc(studentRef, cleanStudent, { merge: true });
        }
      }
    }

    clearPendingCloudSync();
    return true;
  } catch (err) {
    console.warn('Could not complete offline cache sync to cloud:', err);
    return false;
  }
}


