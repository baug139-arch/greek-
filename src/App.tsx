import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  Volume2, 
  GraduationCap, 
  Flame, 
  Award, 
  ChevronRight, 
  RotateCcw,
  Sparkles, 
  Menu, 
  X, 
  Plus, 
  User, 
  Settings,
  LogIn,
  LogOut,
  Cloud,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  Mail,
  Maximize,
  Minimize,
  Trash2,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Student, GreekWord, HomeworkAssignment, TeacherCustomList, LearningSessionAttempt, StudentSettings, TrainingMode, TrainingDirection, ExamAnswer, UserProfile, MorphologyMistakeItem, StudentManualMorphologyAnswer } from './types';
import { formatMorphologyGrammar } from './utils/morphologyFormat';
import { INITIAL_STUDENTS, GREEK_VOCABULARY, BIBLICAL_PHRASES } from './data/greekVocabulary';
import { DuolingoEngine } from './components/DuolingoEngine';
import { ExamRunner } from './components/ExamRunner';
import { GreekCompositionRunner } from './components/GreekCompositionRunner';
import { ManualMorphologyRunner } from './components/ManualMorphologyRunner';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentHub } from './components/StudentHub';
import { MorphologyRunner } from './components/MorphologyRunner';
import { MORPHOLOGY_DATABASE } from './data/morphologyDatabase';
import { ErasmianGuideModal } from './components/ErasmianGuideModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { AddStudentModal } from './components/AddStudentModal';
import { AuthModal } from './components/AuthModal';
import { InstallAppModal } from './components/InstallAppModal';
import { WelcomeOnboardingModal } from './components/WelcomeOnboardingModal';
import { updateWordSRS } from './utils/srsEngine';
import { getWordsForCourse, getWordsForAssignment } from './utils/courseUtils';
import { auth, onAuthStateChanged, signInWithGoogle, logOut, checkRedirectResult } from './firebase';
import { 
  saveStudentToCloud, 
  saveAllStudentsToCloud, 
  subscribeToStudentsFromCloud, 
  saveCustomListsToCloud, 
  subscribeToCustomListsFromCloud, 
  saveUserProfileToCloud, 
  getUserProfileFromCloud,
  getStudentFromCloud,
  getStudentByEmailFromCloud,
  deleteStudentFromCloud,
  deleteStudentAssignmentFromCloud,
  deduplicateAssignments,
  isCloudQuotaLimitReached,
  isNetworkOnline,
  syncOfflineCacheToCloud
} from './utils/cloudSync';

export default function App() {
  // Authentication & Cloud Profile State
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('koine_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  
  // First-time user welcome / name entry modal state
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    const onboarded = localStorage.getItem('koine_user_onboarded');
    if (onboarded === 'true') return false;
    const savedProfile = localStorage.getItem('koine_user_profile');
    if (savedProfile) return false;
    const savedActiveId = localStorage.getItem('koine_active_student_id');
    if (savedActiveId && savedActiveId !== 'guest_user') return false;
    return true;
  });

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => isNetworkOnline());
  const isInitialLoad = useRef(true);

  // Check mobile redirect auth result on mount
  useEffect(() => {
    checkRedirectResult().catch((err) => {
      console.warn('Redirect auth check warning:', err);
    });
  }, []);

  // Listen to network online/offline events for auto-sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsCloudSyncing(true);
      try {
        const savedActiveId = localStorage.getItem('koine_active_student_id') || undefined;
        await syncOfflineCacheToCloud(savedActiveId);
      } finally {
        setIsCloudSyncing(false);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fullscreen Mode State
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const isCurrentlyFull = isFullscreen || !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    
    if (!isCurrentlyFull) {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen toggle failed:', err);
      }
      setIsFullscreen(true);
    } else {
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        }
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
      }
      setIsFullscreen(false);
    }
  };

  // Application Data State - strictly real Google-authenticated students
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('koine_greek_students');
    if (!saved) return [];
    try {
      const rawList: Student[] = JSON.parse(saved);
      // Filter out teacher account, mock/demo student accounts, and deduplicate
      const cleaned = rawList.filter((s) => {
        if (!s || !s.id) return false;
        if (s.id.startsWith('student_') && s.id.length < 15) return false; // remove demo student_1..10
        if (s.email && s.email.includes('@seminary.org')) return false; // remove demo emails
        if (s.email && s.email.toLowerCase() === 'baug139@gmail.com') return false;
        return true;
      });
      const map = new Map<string, Student>();
      cleaned.forEach((s) => {
        const key = (s.email?.toLowerCase() || s.id);
        if (!map.has(key)) {
          map.set(key, {
            ...s,
            assignedHomework: deduplicateAssignments(s.assignedHomework || []),
          });
        }
      });
      return Array.from(map.values());
    } catch (e) {
      return [];
    }
  });

  const [customLists, setCustomLists] = useState<TeacherCustomList[]>(() => {
    const saved = localStorage.getItem('koine_teacher_custom_lists');
    return saved ? JSON.parse(saved) : [];
  });

  // Current Active Student (selected in teacher view or logged in student)
  const [currentStudentId, setCurrentStudentId] = useState<string>(() => {
    const saved = localStorage.getItem('koine_active_student_id');
    return (saved && (!saved.startsWith('student_') || saved.length >= 15)) ? saved : '';
  });

  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher'>(() => {
    const savedProfile = localStorage.getItem('koine_user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.role === 'teacher' || parsed.email?.toLowerCase() === 'baug139@gmail.com') {
          return 'teacher';
        }
      } catch (e) {}
    }
    const savedRole = localStorage.getItem('koine_active_role');
    return (savedRole as 'student' | 'teacher') || 'student';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('koine_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('koine_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Active Practice Session State (Duolingo Mode)
  const [activeSession, setActiveSession] = useState<{
    isOpen: boolean;
    title: string;
    words: GreekWord[];
    phrases?: typeof BIBLICAL_PHRASES;
    trainingMode?: TrainingMode;
    direction?: TrainingDirection;
    sectionId?: string;
    initialChunkIndex?: number;
    unmasteredWords?: GreekWord[];
    initialStageIndex?: number;
  } | null>(null);

  // Active Exam Session State (Exam Mode)
  const [activeExamSession, setActiveExamSession] = useState<{
    assignment: HomeworkAssignment;
    words: GreekWord[];
  } | null>(null);

  // Active Greek Composition Session State
  const [activeCompositionSession, setActiveCompositionSession] = useState<HomeworkAssignment | null>(null);

  // Active Morphology Session State
  const [activeMorphologySession, setActiveMorphologySession] = useState<HomeworkAssignment | null>(null);
  const [activeManualMorphologySession, setActiveManualMorphologySession] = useState<HomeworkAssignment | null>(null);
  const [activeFreeMorphology, setActiveFreeMorphology] = useState<'all' | 'noun' | 'verb' | 'adjective' | 'mistakes' | null>(null);

  // Modals
  const [isErasmianModalOpen, setIsErasmianModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // 1. Firebase Auth listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isMasterAdmin = firebaseUser.email?.toLowerCase() === 'baug139@gmail.com';

        // Fetch or create user profile
        let profile = await getUserProfileFromCloud(firebaseUser.uid);
        if (!profile && firebaseUser.email) {
          const studentDoc = await getStudentByEmailFromCloud(firebaseUser.email);
          if (studentDoc && studentDoc.name && studentDoc.name !== 'Студент' && studentDoc.name !== 'Гость') {
            profile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: studentDoc.name,
              photoURL: firebaseUser.photoURL || studentDoc.photoURL,
              role: isMasterAdmin ? 'teacher' : 'student',
              greekAlias: studentDoc.greekAlias || 'Ἰωάννης',
              avatar: studentDoc.avatar || '👨‍🎓',
              createdAt: new Date().toISOString(),
            };
            await saveUserProfileToCloud(profile);
          }
        }

        if (!profile) {
          const localStudent = students.find(s => s.id === currentStudentId) || students[0];
          const localName = (localStudent && localStudent.name && localStudent.name !== 'Студент' && localStudent.name !== 'Гость')
            ? localStudent.name.trim()
            : '';
          const candidateName = localName || (firebaseUser.displayName?.trim()) || (isMasterAdmin ? 'Сурен Ханикян' : 'Студент');

          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: candidateName,
            photoURL: firebaseUser.photoURL || undefined,
            role: isMasterAdmin ? 'teacher' : 'student',
            greekAlias: localStudent?.greekAlias || (isMasterAdmin ? 'Ἐρασμιανός' : 'Ἰωάννης'),
            avatar: localStudent?.avatar || (isMasterAdmin ? '👨‍🏫' : '👨‍🎓'),
            createdAt: new Date().toISOString(),
          };
          await saveUserProfileToCloud(profile);
        } else if (isMasterAdmin && profile.role !== 'teacher') {
          profile = {
            ...profile,
            role: 'teacher',
            avatar: profile.avatar || '👨‍🏫',
          };
          await saveUserProfileToCloud(profile);
        }

        setCurrentUserProfile(profile);
        localStorage.setItem('koine_user_profile', JSON.stringify(profile));
        localStorage.setItem('koine_user_onboarded', 'true');
        setIsWelcomeModalOpen(false);
        setIsAuthModalOpen(false);

        // If user is teacher, default to teacher dashboard
        if (profile.role === 'teacher' || isMasterAdmin) {
          setCurrentRole('teacher');
          // Purge teacher from students list to ensure they don't appear in roster
          setStudents((prev) => prev.filter(
            s => s.id !== firebaseUser.uid && s.email?.toLowerCase() !== 'baug139@gmail.com'
          ));
        } else {
          // If student, ensure there is a student record for this user without destroying homework
          setCurrentRole('student');
          setCurrentStudentId(firebaseUser.uid);

          // 1. Fetch from Firestore first to preserve any homework assigned by teacher
          let cloudDoc = await getStudentFromCloud(firebaseUser.uid);
          if (!cloudDoc && firebaseUser.email) {
            cloudDoc = await getStudentByEmailFromCloud(firebaseUser.email);
          }

          if (cloudDoc) {
            const mergedStudent: Student = {
              ...cloudDoc,
              id: firebaseUser.uid,
              name: profile.displayName || firebaseUser.displayName || cloudDoc.name || 'Студент',
              greekAlias: profile.greekAlias || cloudDoc.greekAlias || 'Ἰωάννης',
              avatar: profile.avatar || cloudDoc.avatar || '👨‍🎓',
              email: firebaseUser.email || profile.email || cloudDoc.email || '',
              photoURL: firebaseUser.photoURL || profile.photoURL || cloudDoc.photoURL,
              lastActive: new Date().toISOString().split('T')[0],
              assignedHomework: deduplicateAssignments(cloudDoc.assignedHomework || []),
            };
            await saveStudentToCloud(mergedStudent);
            setStudents((prev) => {
              const others = prev.filter(s => s.id !== firebaseUser.uid && s.email?.toLowerCase() !== firebaseUser.email?.toLowerCase());
              return [mergedStudent, ...others];
            });
          } else {
            // Check if local student exists or create brand new
            setStudents((prev) => {
              const exists = prev.find((s) => s.id === firebaseUser.uid || (s.email && s.email.toLowerCase() === firebaseUser.email?.toLowerCase()));
              const newStudentDoc: Student = {
                id: firebaseUser.uid,
                name: profile.displayName || firebaseUser.displayName || exists?.name || 'Студент',
                greekAlias: profile.greekAlias || exists?.greekAlias || 'Ἰωάννης',
                avatar: profile.avatar || exists?.avatar || '👨‍🎓',
                email: firebaseUser.email || profile.email || exists?.email || '',
                photoURL: firebaseUser.photoURL || profile.photoURL || exists?.photoURL,
                xp: exists?.xp || 0,
                streakDays: exists?.streakDays || 1,
                lastActive: new Date().toISOString().split('T')[0],
                accuracyRate: exists?.accuracyRate || 0,
                masteredWordsCount: exists?.masteredWordsCount || 0,
                completedLessons: exists?.completedLessons || [],
                assignedHomework: deduplicateAssignments(exists?.assignedHomework || []),
                wordMastery: exists?.wordMastery || {},
                recentMistakes: exists?.recentMistakes || [],
                sessionAttempts: exists?.sessionAttempts || [],
                settings: exists?.settings || {
                  preferredLearningMode: 'frequency',
                  audioSpeed: 0.82,
                  voiceEngine: 'latin_phonetic',
                  dailyWordGoal: 10,
                  batchSize: 8,
                  showTransliteration: true,
                  showPhoneticIpa: true,
                  greekFontSize: 'normal',
                  soundEffectsEnabled: true,
                  autoPlayAudio: true,
                },
              };
              saveStudentToCloud(newStudentDoc);
              return [newStudentDoc, ...prev.filter(s => s.id !== firebaseUser.uid && s.email?.toLowerCase() !== firebaseUser.email?.toLowerCase())];
            });
          }
        }
      } else {
        // User logged out or unauthenticated Guest
        setCurrentUserProfile(null);
        localStorage.removeItem('koine_user_profile');
        setCurrentRole('student');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore sync subscriptions
  useEffect(() => {
    const unsubStudents = subscribeToStudentsFromCloud((cloudStudents) => {
      if (cloudStudents) {
        setStudents((prev) => {
          // Filter out teacher account and mock demo students from student roster
          const currentUid = auth.currentUser?.uid;
          const teacherEmail = 'baug139@gmail.com';
          const validCloud = cloudStudents.filter((cs) => {
            if (!cs || !cs.id) return false;
            if (cs.id.startsWith('student_')) return false; // remove demo student_1..10
            if (cs.email && cs.email.includes('@seminary.org')) return false; // remove demo emails
            if (cs.email && cs.email.toLowerCase() === teacherEmail) return false;
            if (currentUid && cs.id === currentUid && (auth.currentUser?.email?.toLowerCase() === teacherEmail)) return false;
            return true;
          });

          // Merge by id, retaining assignedHomework and highest progress
          const map = new Map<string, Student>();
          
          // If current logged-in user is a student, retain their local state as anchor
          if (currentUid && auth.currentUser?.email?.toLowerCase() !== teacherEmail) {
            const currentLocal = prev.find((st) => st.id === currentUid);
            if (currentLocal) {
              map.set(currentUid, currentLocal);
            }
          }

          validCloud.forEach((cs) => {
            const existing = map.get(cs.id);
            if (!existing) {
              map.set(cs.id, {
                ...cs,
                assignedHomework: deduplicateAssignments(cs.assignedHomework || []),
              });
            } else {
              // When receiving cloud updates, cloud is authoritative for assignedHomework
              // but we clean any duplicates that might have existed
              const mergedHomework = deduplicateAssignments(cs.assignedHomework || []);

              map.set(cs.id, {
                ...existing,
                ...cs,
                xp: Math.max(existing.xp || 0, cs.xp || 0),
                assignedHomework: mergedHomework,
                completedLessons: Array.from(new Set([...(existing.completedLessons || []), ...(cs.completedLessons || [])])),
              });
            }
          });

          return Array.from(map.values());
        });
      }
    });

    const unsubLists = subscribeToCustomListsFromCloud((cloudLists) => {
      if (cloudLists && cloudLists.length > 0) {
        setCustomLists(cloudLists);
      }
    });

    return () => {
      unsubStudents();
      unsubLists();
    };
  }, []);

  // Sync role & active student ID to local storage
  useEffect(() => {
    localStorage.setItem('koine_active_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('koine_active_student_id', currentStudentId);
  }, [currentStudentId]);

  // Local & Cloud Save Effects
  useEffect(() => {
    localStorage.setItem('koine_greek_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('koine_teacher_custom_lists', JSON.stringify(customLists));
  }, [customLists]);

  useEffect(() => {
    isInitialLoad.current = false;
  }, []);

  // Student CRUD handlers
  const handleAddStudent = (data: { name: string; greekAlias?: string; avatar?: string }) => {
    const newStudent: Student = {
      id: `student_${Date.now()}`,
      name: data.name,
      greekAlias: data.greekAlias || 'Νέος Μαθητής',
      avatar: data.avatar || '👨‍🎓',
      xp: 0,
      streakDays: 0,
      lastActive: new Date().toISOString().split('T')[0],
      accuracyRate: 0,
      masteredWordsCount: 0,
      completedLessons: [],
      assignedHomework: [],
      wordMastery: {},
      recentMistakes: [],
      sessionAttempts: [],
      settings: {
        preferredLearningMode: 'frequency',
        audioSpeed: 0.82,
        voiceEngine: 'latin_phonetic',
        dailyWordGoal: 10,
        batchSize: 8,
        showTransliteration: true,
        showPhoneticIpa: true,
        greekFontSize: 'normal',
        soundEffectsEnabled: true,
        autoPlayAudio: true,
      },
    };

    saveStudentToCloud(newStudent);
    setStudents((prev) => [...prev, newStudent]);
    setCurrentStudentId(newStudent.id);
    setCurrentRole('student');
    setActiveSession(null);
    setIsSidebarOpen(false);
  };

  const handleDeleteStudent = async (studentIdToDelete: string) => {
    // 1. Delete student record from Firestore Cloud database
    await deleteStudentFromCloud(studentIdToDelete);

    // 2. Update local state
    setStudents((prev) => {
      const remaining = prev.filter((s) => s.id !== studentIdToDelete);
      if (remaining.length === 0) {
        const defaultStudent: Student = {
          id: `student_${Date.now()}`,
          name: 'Новый ученик',
          greekAlias: 'Νέος Μαθητής',
          avatar: '👨‍🎓',
          xp: 0,
          streakDays: 0,
          lastActive: new Date().toISOString().split('T')[0],
          accuracyRate: 0,
          masteredWordsCount: 0,
          completedLessons: [],
          assignedHomework: [],
          wordMastery: {},
          recentMistakes: [],
          sessionAttempts: [],
          settings: {
            preferredLearningMode: 'frequency',
            audioSpeed: 0.82,
            voiceEngine: 'latin_phonetic',
            dailyWordGoal: 10,
            batchSize: 8,
            showTransliteration: true,
            showPhoneticIpa: true,
            greekFontSize: 'normal',
            soundEffectsEnabled: true,
            autoPlayAudio: true,
          },
        };
        setCurrentStudentId(defaultStudent.id);
        return [defaultStudent];
      }

      if (currentStudentId === studentIdToDelete) {
        setCurrentStudentId(remaining[0].id);
      }
      return remaining;
    });
    setIsProfileModalOpen(false);
  };

  const handleResetStudentProgress = (studentIdToReset: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentIdToReset
          ? {
              ...s,
              xp: 0,
              streakDays: 0,
              accuracyRate: 0,
              masteredWordsCount: 0,
              completedLessons: [],
              completedChunks: {},
              wordsForReview: [],
              assignedHomework: (s.assignedHomework || []).map((hw) => ({
                ...hw,
                completed: false,
                scorePercent: 0,
              })),
              wordMastery: {},
              recentMistakes: [],
              sessionAttempts: [],
            }
          : s
      )
    );
    setIsProfileModalOpen(false);
  };

  // Save to local persistence
  useEffect(() => {
    localStorage.setItem('koine_greek_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('koine_teacher_custom_lists', JSON.stringify(customLists));
  }, [customLists]);

  const isTeacher = Boolean(
    currentUserProfile && (
      currentUserProfile.role === 'teacher' || 
      currentUserProfile.email?.toLowerCase() === 'baug139@gmail.com'
    )
  );
  const isGuest = !currentUserProfile && (!currentStudentId || currentStudentId === 'guest_user' || !students.some((s) => s.id === currentStudentId));
  const isStudent = Boolean(
    (currentUserProfile && 
     currentUserProfile.role === 'student' && 
     currentUserProfile.email?.toLowerCase() !== 'baug139@gmail.com') ||
    (!isTeacher && !isGuest)
  );

  // Guest student default object for clean isolated guest session
  const guestStudentPlaceholder: Student = {
    id: 'guest_user',
    name: 'Гость',
    greekAlias: 'Φιλομαθής',
    avatar: '📖',
    email: '',
    xp: 0,
    streakDays: 1,
    lastActive: 'Сейчас',
    accuracyRate: 0,
    masteredWordsCount: 0,
    completedLessons: [],
    assignedHomework: [],
    wordMastery: {},
    recentMistakes: [],
    sessionAttempts: [],
    settings: {
      preferredLearningMode: 'frequency',
      audioSpeed: 0.82,
      voiceEngine: 'latin_phonetic',
      dailyWordGoal: 10,
      batchSize: 8,
      showTransliteration: true,
      showPhoneticIpa: true,
      greekFontSize: 'normal',
      soundEffectsEnabled: true,
      autoPlayAudio: true,
    },
  };

  // Force student role if user is not teacher
  useEffect(() => {
    if (currentUserProfile && !isTeacher && currentRole === 'teacher') {
      setCurrentRole('student');
    }
  }, [isTeacher, currentRole, currentUserProfile]);

  // Keep student pinned to their own student record when logged in as student
  useEffect(() => {
    if (isStudent && currentUserProfile) {
      const studentUser = students.find((s) => s.id === currentUserProfile.uid);
      if (studentUser && currentStudentId !== currentUserProfile.uid) {
        setCurrentStudentId(currentUserProfile.uid);
      }
    }
  }, [isStudent, currentUserProfile, students, currentStudentId]);

  const currentStudent: Student = isTeacher 
    ? (students.find((s) => s.id === currentStudentId) || students[0] || guestStudentPlaceholder)
    : (isStudent 
        ? (students.find((s) => s.id === currentUserProfile?.uid || (s.email && s.email.toLowerCase() === currentUserProfile?.email?.toLowerCase())) || {
            ...guestStudentPlaceholder,
            id: currentUserProfile?.uid || 'student_user',
            name: currentUserProfile?.displayName || 'Студент',
            greekAlias: currentUserProfile?.greekAlias || 'Ἰωάννης',
            avatar: currentUserProfile?.avatar || '👨‍🎓',
            email: currentUserProfile?.email || '',
          })
        : (students.find((s) => s.id === currentStudentId) || guestStudentPlaceholder));

  // Handler for first-time user registration
  const handleRegisterNewUser = (name: string, greekAlias: string, avatar: string) => {
    const newStudentId = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newStudentDoc: Student = {
      id: newStudentId,
      name: name.trim(),
      greekAlias: greekAlias?.trim() || 'Μαθητής',
      avatar: avatar || '👨‍🎓',
      email: '',
      xp: 0,
      streakDays: 1,
      lastActive: new Date().toISOString().split('T')[0],
      accuracyRate: 0,
      masteredWordsCount: 0,
      completedLessons: [],
      assignedHomework: [],
      wordMastery: {},
      recentMistakes: [],
      sessionAttempts: [],
      settings: {
        preferredLearningMode: 'frequency',
        audioSpeed: 0.82,
        voiceEngine: 'latin_phonetic',
        dailyWordGoal: 10,
        batchSize: 8,
        showTransliteration: true,
        showPhoneticIpa: true,
        greekFontSize: 'normal',
        soundEffectsEnabled: true,
        autoPlayAudio: true,
      },
    };

    localStorage.setItem('koine_user_onboarded', 'true');
    localStorage.setItem('koine_active_student_id', newStudentId);

    setStudents((prev) => [newStudentDoc, ...prev.filter((s) => s.id !== newStudentId)]);
    setCurrentStudentId(newStudentId);
    setCurrentRole('student');
    saveStudentToCloud(newStudentDoc);
    setIsWelcomeModalOpen(false);
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem('koine_user_onboarded', 'true');
    setIsWelcomeModalOpen(false);
  };

  // Start a new Duolingo practice session
  const handleStartPractice = (
    title: string,
    words: GreekWord[],
    phrases?: typeof BIBLICAL_PHRASES,
    trainingMode?: TrainingMode,
    direction?: TrainingDirection,
    sectionId?: string,
    initialChunkIndex?: number,
    unmasteredWords?: GreekWord[],
    initialStageIndex?: number
  ) => {
    setActiveSession({
      isOpen: true,
      title,
      words,
      phrases,
      trainingMode,
      direction,
      sectionId,
      initialChunkIndex,
      unmasteredWords,
      initialStageIndex,
    });
  };

  // Complete Duolingo practice session & update student stats & log session attempt for teacher grading
  const handleCompletePractice = (
    scorePercent: number,
    xpGained: number,
    mistakes: { word: GreekWord; given: string }[],
    completedChunkInfo?: { sectionId: string; chunkIndex: number },
    testedWords?: GreekWord[],
    roundCompleted?: number
  ) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const wordsActuallyTested = testedWords && testedWords.length > 0 ? testedWords : (activeSession?.words || []);

    const newAttempt: LearningSessionAttempt = {
      id: `attempt_${Date.now()}`,
      title: activeSession?.title || 'Практика лексики',
      mode: 'contextual_reader',
      scorePercent,
      xpGained,
      date: formattedDate,
      totalWordsCount: wordsActuallyTested.length,
      mistakes: mistakes.map((m) => ({
        wordId: m.word.id,
        wordGreek: m.word.greek,
        translationRu: m.word.translationRu,
        givenAnswer: m.given,
      })),
    };

    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== currentStudentId) return st;

        // Determine target aspect skill (Reading, Writing, Listening)
        let aspect: 'reading' | 'writing' | 'listening' = 'reading';
        if (
          activeSession?.trainingMode === 'builder' ||
          activeSession?.trainingMode === 'typing' ||
          activeSession?.direction === 'ru_to_greek'
        ) {
          aspect = 'writing';
        } else if (activeSession?.trainingMode === 'audio') {
          aspect = 'listening';
        }

        const newMastered = { ...st.wordMastery };
        wordsActuallyTested.forEach((w) => {
          const prevW = newMastered[w.id];
          const hasError = mistakes.some((m) => m.word.id === w.id);
          newMastered[w.id] = updateWordSRS(prevW, !hasError, hasError ? 1 : 4, aspect);
        });

        const mistakeWordIds = mistakes.map((m) => m.word.id);
        const resolvedWordIds = wordsActuallyTested
          .filter((w) => !mistakeWordIds.includes(w.id))
          .map((w) => w.id);

        // Remove successfully answered words from recentMistakes
        const remainingPriorMistakes = (st.recentMistakes || []).filter(
          (rm) => !resolvedWordIds.includes(rm.wordId)
        );

        const newMistakes = [
          ...mistakes.map((m) => ({
            wordId: m.word.id,
            wordGreek: m.word.greek,
            translationRu: m.word.translationRu,
            givenAnswer: m.given,
            date: 'Сегодня',
          })),
          ...remainingPriorMistakes,
        ].slice(0, 30);

        // Remove resolved words from wordsForReview
        const updatedWordsForReview = (st.wordsForReview || [])
          .filter((wId) => !resolvedWordIds.includes(wId))
          .concat(mistakeWordIds.filter((wId) => !(st.wordsForReview || []).includes(wId)));

        // Update assigned homework status if applicable
        const updatedHomework = (st.assignedHomework || []).map((hw) => {
          const isTargetHomework =
            (completedChunkInfo && (completedChunkInfo.sectionId === `hw_${hw.id}` || completedChunkInfo.sectionId === `hw_${hw.targetId}`)) ||
            (activeSession?.sectionId === `hw_${hw.id}` || activeSession?.sectionId === `hw_${hw.targetId}`) ||
            (activeSession?.title && activeSession.title.includes(hw.title));

          if (!isTargetHomework || hw.completed) {
            return hw;
          }

          const courseWords = getWordsForAssignment(hw, customLists);
          const batchSize = st.settings?.batchSize || 8;
          const totalChunks = Math.max(1, Math.ceil(courseWords.length / batchSize));

          const chunkIndex = completedChunkInfo ? completedChunkInfo.chunkIndex : 0;
          const currentRoundChunks = Array.from(
            new Set([...(hw.completedChunkIndicesForCurrentRound || []), chunkIndex])
          );

          const requiredRounds = hw.requiredRounds || 1;
          const prevCompletedRounds = hw.completedRounds || 0;

          if (currentRoundChunks.length >= totalChunks) {
            // Completed all portions of the current round!
            const newCompletedRounds = prevCompletedRounds + 1;
            if (newCompletedRounds >= requiredRounds) {
              // Entire homework assignment is finished!
              return {
                ...hw,
                completed: true,
                scorePercent,
                completedRounds: newCompletedRounds,
                currentRound: requiredRounds,
                completedChunkIndicesForCurrentRound: currentRoundChunks,
                lastRoundCompletedTime: Date.now(),
              };
            } else {
              // Round complete, unlock next round after cooldown
              return {
                ...hw,
                completed: false,
                scorePercent,
                completedRounds: newCompletedRounds,
                currentRound: newCompletedRounds + 1,
                completedChunkIndicesForCurrentRound: [],
                lastRoundCompletedTime: Date.now(),
              };
            }
          } else {
            // Next portion completed in the active round
            return {
              ...hw,
              scorePercent,
              completedChunkIndicesForCurrentRound: currentRoundChunks,
            };
          }
        });

        // Update completedChunks, completedChunkTimes & completedChunkRounds
        const currentChunks = { ...(st.completedChunks || {}) };
        const currentChunkTimes = { ...(st.completedChunkTimes || {}) };
        const currentChunkRounds = { ...(st.completedChunkRounds || {}) };
        if (completedChunkInfo) {
          const { sectionId, chunkIndex } = completedChunkInfo;
          const list = currentChunks[sectionId] ? [...currentChunks[sectionId]] : [];
          if (!list.includes(chunkIndex)) {
            list.push(chunkIndex);
          }
          currentChunks[sectionId] = list;
          
          const chunkKey = `${sectionId}_${chunkIndex}`;
          const prevRound = currentChunkRounds[chunkKey] !== undefined 
            ? currentChunkRounds[chunkKey] 
            : (st.completedChunks?.[sectionId]?.includes(chunkIndex) ? 1 : 0);
          
          let newRound = prevRound;
          const practicedStage = roundCompleted !== undefined ? roundCompleted : prevRound;

          if (practicedStage === 0) {
            // 1-й этап: Полное заучивание -> переход на 2-й этап (45 мин)
            if (scorePercent >= 60) {
              newRound = Math.max(prevRound, 1);
            }
          } else if (practicedStage === 1) {
            // 2-й этап: Закрепление 45 мин -> переход на 3-й этап (24 ч)
            if (scorePercent >= 70) {
              newRound = Math.max(prevRound, 2);
            }
          } else if (practicedStage >= 2) {
            // 3-й этап: Экспресс-контроль -> статус "Выучено" (3-й этап закрыт)
            if (scorePercent >= 70) {
              newRound = Math.max(prevRound, 3);
            }
          }

          currentChunkRounds[chunkKey] = newRound;
          currentChunkTimes[chunkKey] = Date.now();
        }

        const updatedStudent: Student = {
          ...st,
          xp: st.xp + xpGained,
          streakDays: st.streakDays + 1,
          accuracyRate: Math.round((st.accuracyRate * 0.7) + (scorePercent * 0.3)),
          masteredWordsCount: Object.keys(newMastered).length,
          assignedHomework: updatedHomework,
          wordMastery: newMastered,
          completedChunks: currentChunks,
          completedChunkTimes: currentChunkTimes,
          completedChunkRounds: currentChunkRounds,
          recentMistakes: newMistakes,
          sessionAttempts: [newAttempt, ...(st.sessionAttempts || [])],
          lastActive: 'Только что',
        };

        // Sync student progress to cloud
        saveStudentToCloud(updatedStudent);

        return updatedStudent;
      })
    );
  };

  // Complete Exam handler (student submits manual translation answers)
  const handleCompleteExam = (assignmentId: string, answers: ExamAnswer[]) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== currentStudentId) return st;

        const targetAssignment = (st.assignedHomework || []).find((hw) => hw.id === assignmentId);
        const xpGained = targetAssignment?.xpReward || 100;

        const updatedHomework = (st.assignedHomework || []).map((hw) => {
          if (hw.id === assignmentId) {
            return {
              ...hw,
              completed: true,
              examAnswers: answers,
              teacherGradeStatus: 'pending' as const,
            };
          }
          return hw;
        });

        const updatedStudent: Student = {
          ...st,
          xp: st.xp + xpGained,
          assignedHomework: updatedHomework,
          lastActive: 'Только что',
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
  };

  // Complete Greek Composition handler (student submits Greek text written on Greek keyboard)
  const handleCompleteComposition = (assignmentId: string, greekAnswerText: string) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== currentStudentId) return st;

        const targetAssignment = (st.assignedHomework || []).find((hw) => hw.id === assignmentId);
        const xpGained = targetAssignment?.xpReward || 75;

        const updatedHomework = (st.assignedHomework || []).map((hw) => {
          if (hw.id === assignmentId) {
            return {
              ...hw,
              completed: true,
              studentCompositionAnswer: greekAnswerText,
              teacherGradeStatus: 'pending' as const,
            };
          }
          return hw;
        });

        const updatedStudent: Student = {
          ...st,
          xp: st.xp + xpGained,
          assignedHomework: updatedHomework,
          lastActive: 'Только что',
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
  };

  // Complete Manual Morphology assignment (student submits structured analysis of words with comments)
  const handleCompleteManualMorphology = (assignmentId: string, answers: StudentManualMorphologyAnswer[]) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== currentStudentId) return st;

        const targetAssignment = (st.assignedHomework || []).find((hw) => hw.id === assignmentId);
        const xpGained = targetAssignment?.xpReward || 90;

        const updatedHomework = (st.assignedHomework || []).map((hw) => {
          if (hw.id === assignmentId) {
            return {
              ...hw,
              completed: true,
              manualMorphologyAnswers: answers,
              teacherGradeStatus: 'pending' as const,
            };
          }
          return hw;
        });

        const updatedStudent: Student = {
          ...st,
          xp: st.xp + xpGained,
          assignedHomework: updatedHomework,
          lastActive: 'Только что',
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
    setActiveManualMorphologySession(null);
  };

  const handleCompleteMorphology = (scorePercent: number, xpGained: number, missedWordIds: string[] = [], masteredWordIds: string[] = []) => {
    if (!activeMorphologySession) return;
    
    // Build detailed mistake items for report
    const missedDetails: MorphologyMistakeItem[] = missedWordIds.map(id => {
      const w = MORPHOLOGY_DATABASE.find(item => item.id === id);
      if (!w) return null;
      return {
        wordId: w.id,
        form: w.form,
        lemma: w.lemma,
        translation: w.translation,
        pos: w.pos === 'noun' ? 'Существительное' : w.pos === 'verb' ? 'Глагол' : w.pos === 'adjective' ? 'Прилагательное' : w.pos === 'participle' ? 'Причастие' : 'Местоимение',
        grammarRu: formatMorphologyGrammar(w)
      };
    }).filter(Boolean) as MorphologyMistakeItem[];

    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== currentStudentId) return st;

        const assignmentId = activeMorphologySession.id;
        const totalWords = activeMorphologySession.morphologyConfig?.wordCount || (missedWordIds.length + masteredWordIds.length) || 10;
        const correctCount = Math.max(0, totalWords - missedWordIds.length);
        
        const updatedHomework = (st.assignedHomework || []).map((hw) => {
          if (hw.id === assignmentId) {
            return {
              ...hw,
              completed: true,
              scorePercent: scorePercent,
              morphologyMistakesDetails: missedDetails,
              morphologyTotalWords: totalWords,
              morphologyCorrectCount: correctCount,
            };
          }
          return hw;
        });

        const newMorphologyMistakes = new Set(st.morphologyMistakes || []);
        missedWordIds.forEach(id => newMorphologyMistakes.add(id));
        masteredWordIds.forEach(id => newMorphologyMistakes.delete(id));

        const updatedStudent: Student = {
          ...st,
          assignedHomework: updatedHomework,
          lastActive: 'Только что',
          morphologyMistakes: Array.from(newMorphologyMistakes),
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
    
    setActiveMorphologySession(null);
  };

  const handleCompleteFreeMorphology = (scorePercent: number, xpGained: number, missedWordIds: string[] = [], masteredWordIds: string[] = []) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== currentStudentId) return st;
        
        const newMorphologyMistakes = new Set(st.morphologyMistakes || []);
        missedWordIds.forEach(id => newMorphologyMistakes.add(id));
        masteredWordIds.forEach(id => newMorphologyMistakes.delete(id));
        
        const updatedStudent = {
          ...st,
          xp: st.xp + xpGained,
          lastActive: 'Только что',
          morphologyMistakes: Array.from(newMorphologyMistakes),
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
    setActiveFreeMorphology(null);
  };

  // Grade an exam from Teacher Dashboard (+ / +- / -)
  const handleGradeExam = (
    studentId: string,
    assignmentId: string,
    updatedAnswers: ExamAnswer[],
    scorePercent: number,
    status: 'passed' | 'revision' | 'excellent',
    feedback: string,
    updatedMorphologyAnswers?: StudentManualMorphologyAnswer[]
  ) => {
    const nowStr = new Date().toISOString().split('T')[0];
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;

        const updatedHomework = (st.assignedHomework || []).map((hw) => {
          if (hw.id === assignmentId) {
            return {
              ...hw,
              examAnswers: updatedAnswers,
              manualMorphologyAnswers: updatedMorphologyAnswers || hw.manualMorphologyAnswers,
              teacherGrade: scorePercent,
              teacherGradeStatus: status,
              teacherFeedback: feedback,
              gradedDate: nowStr,
            };
          }
          return hw;
        });

        const updatedStudent: Student = {
          ...st,
          assignedHomework: updatedHomework,
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
  };

  // Grade an attempt from Teacher Dashboard
  const handleGradeAttempt = (
    studentId: string,
    attemptId: string,
    grade: number,
    status: 'passed' | 'revision' | 'excellent',
    feedback: string,
    tags: string[]
  ) => {
    const nowStr = new Date().toISOString().split('T')[0];
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;

        const updatedAttempts = (st.sessionAttempts || []).map((att) => {
          if (att.id === attemptId) {
            return {
              ...att,
              teacherGrade: grade,
              teacherGradeStatus: status,
              teacherFeedback: feedback,
              teacherTags: tags,
              gradedAt: nowStr,
              needsTeacherReview: false,
            };
          }
          return att;
        });

        return {
          ...st,
          sessionAttempts: updatedAttempts,
        };
      })
    );
  };

  // Assign homework from Teacher Dashboard
  const handleAssignHomework = async (
    assignment: Omit<HomeworkAssignment, 'id' | 'completed'>,
    targetStudentIds: string[] | string | 'all'
  ) => {
    const timestamp = Date.now();
    let studentsToSave: Student[] = [];
    
    setStudents((prev) => {
      const updated = prev.map((st) => {
        const isTarget =
          targetStudentIds === 'all' ||
          (Array.isArray(targetStudentIds) && targetStudentIds.includes(st.id)) ||
          targetStudentIds === st.id;

        if (isTarget) {
          const newAssignment: HomeworkAssignment = {
            ...assignment,
            id: `hw_${timestamp}_${st.id}_${Math.random().toString(36).substring(2, 6)}`,
            completed: false,
          };

          const rawHomework = [newAssignment, ...(st.assignedHomework || [])];
          const cleanHomework = deduplicateAssignments(rawHomework);

          const updatedStudent: Student = {
            ...st,
            assignedHomework: cleanHomework,
          };
          studentsToSave.push(updatedStudent);
          return updatedStudent;
        }
        return st;
      });

      return updated;
    });

    if (studentsToSave.length > 0) {
      saveAllStudentsToCloud(studentsToSave).catch(e => console.error(e));
    }
  };

  // Delete assignment from a student
  const handleDeleteAssignment = async (studentId: string, assignmentId: string) => {
    // 1. Direct cloud deletion
    await deleteStudentAssignmentFromCloud(studentId, assignmentId);

    // 2. Update local state immediately
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id === studentId) {
          const updatedStudent: Student = {
            ...st,
            assignedHomework: (st.assignedHomework || []).filter((hw) => hw.id !== assignmentId),
          };
          return updatedStudent;
        }
        return st;
      })
    );
  };

  // Create custom list
  const handleCreateCustomList = (list: Omit<TeacherCustomList, 'id' | 'createdAt'>) => {
    const newList: TeacherCustomList = {
      ...list,
      id: `list_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    saveCustomListsToCloud([newList]);
    setCustomLists((prev) => [newList, ...prev]);
  };

  // Update teacher note on student
  const handleUpdateStudentNote = (studentId: string, note: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updated = { ...s, notesFromTeacher: note };
          saveStudentToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  // Update Student Settings
  const handleUpdateStudentSettings = (newSettings: StudentSettings) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === currentStudentId) {
          const updated = { ...s, settings: newSettings };
          saveStudentToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  // Update Student Profile Details
  const handleUpdateStudentProfile = (updatedProfile: { name: string; greekAlias: string; avatar: string }) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === currentStudentId) {
          const updated = {
            ...s,
            name: updatedProfile.name,
            greekAlias: updatedProfile.greekAlias,
            avatar: updatedProfile.avatar,
          };
          saveStudentToCloud(updated);
          return updated;
        }
        return s;
      })
    );
    // Also persist name/alias/avatar in the UserProfile (users collection) so it survives re-login
    if (currentUserProfile) {
      const updatedUserProfile = {
        ...currentUserProfile,
        displayName: updatedProfile.name,
        greekAlias: updatedProfile.greekAlias,
        avatar: updatedProfile.avatar,
      };
      setCurrentUserProfile(updatedUserProfile);
      localStorage.setItem('koine_user_profile', JSON.stringify(updatedUserProfile));
      saveUserProfileToCloud(updatedUserProfile);
    }
  };

  // Update Custom Mnemonic
  const handleUpdateStudentMnemonic = (wordId: string, mnemonic: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === currentStudentId) {
          const updated = {
            ...s,
            customMnemonics: {
              ...(s.customMnemonics || {}),
              [wordId]: mnemonic,
            },
          };
          saveStudentToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  // Acknowledge reviewed homework/exam (removes from active main screen, moves to archive)
  const handleAcknowledgeHomework = (assignmentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === currentStudentId) {
          const updated: Student = {
            ...s,
            assignedHomework: (s.assignedHomework || []).map((hw) => {
              if (hw.id === assignmentId) {
                return {
                  ...hw,
                  studentReviewed: true,
                  studentReviewedDate: new Date().toISOString(),
                };
              }
              return hw;
            }),
          };
          saveStudentToCloud(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const activeMorphologyWords = useMemo(() => {
    if (!activeMorphologySession && !activeFreeMorphology) return [];
    
    let pool = MORPHOLOGY_DATABASE;
    const config = activeMorphologySession ? activeMorphologySession.morphologyConfig : { targetPos: activeFreeMorphology, wordCount: 10 };
    
    if (config) {
      if (config.targetPos === 'mistakes') {
        const activeStudent = students.find(s => s.id === currentStudentId);
        const mistakes = activeStudent?.morphologyMistakes || [];
        pool = pool.filter(w => mistakes.includes(w.id));
      } else if (config.targetPos === 'noun') {
        pool = pool.filter(w => w.pos === 'noun');
      } else if (config.targetPos === 'verb') {
        // Includes finite verbs, participles, and infinitives
        pool = pool.filter(w => w.pos === 'verb' || w.pos === 'participle' || w.pos === 'infinitive');
      } else if (config.targetPos === 'adjective') {
        pool = pool.filter(w => w.pos === 'adjective');
      }
    }
    
    let count = config?.wordCount || 10;
    if (config?.targetPos === 'mistakes') {
      count = Math.min(pool.length, 15);
    }

    // Balanced selection for verb system (finite verbs, participles, infinitives)
    if (config?.targetPos === 'verb') {
      const finitePool = pool.filter(w => w.pos === 'verb' && w.mood !== 'inf').sort(() => 0.5 - Math.random());
      const partPool = pool.filter(w => w.pos === 'participle').sort(() => 0.5 - Math.random());
      const infPool = pool.filter(w => w.pos === 'infinitive' || (w.pos === 'verb' && w.mood === 'inf')).sort(() => 0.5 - Math.random());
      
      const selected = [];
      const groups = [finitePool, partPool, infPool];
      while (selected.length < count) {
        let added = false;
        for (const g of groups) {
          if (selected.length >= count) break;
          if (g.length > 0) {
            selected.push(g.pop()!);
            added = true;
          }
        }
        if (!added) break;
      }
      
      // Shuffle selected words
      for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
      }
      return selected;
    }
    
    // Better mix balancing logic for "all" / "mix" mode
    if (!config || config.targetPos === 'all') {
      const grouped = {
        noun: pool.filter(w => w.pos === 'noun').sort(() => 0.5 - Math.random()),
        verb: pool.filter(w => w.pos === 'verb' && w.mood !== 'inf').sort(() => 0.5 - Math.random()),
        inf: pool.filter(w => w.pos === 'verb' && w.mood === 'inf').sort(() => 0.5 - Math.random()),
        participle: pool.filter(w => w.pos === 'participle').sort(() => 0.5 - Math.random()),
        adjective: pool.filter(w => w.pos === 'adjective').sort(() => 0.5 - Math.random()),
        pronoun: pool.filter(w => w.pos === 'pronoun').sort(() => 0.5 - Math.random()),
      };
      
      const selected = [];
      const cats = ['noun', 'verb', 'participle', 'adjective', 'inf', 'pronoun'];
      
      while (selected.length < count) {
        let addedInRound = false;
        for (const cat of cats) {
          if (selected.length >= count) break;
          if (grouped[cat].length > 0) {
            selected.push(grouped[cat].pop());
            addedInRound = true;
          }
        }
        // If we ran out of all categories but still need more words, just break to avoid infinite loop
        if (!addedInRound) break;
      }
      
      // Shuffle the selected array so it's not strictly predictable
      for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
      }
      return selected;
    }

    // Default fully random for other modes
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }, [activeMorphologySession, activeFreeMorphology, currentStudentId, students]);

  return (
    <div className={`flex w-full bg-[#FDFCFB] text-[#1A1A1A] font-serif overflow-hidden transition-all duration-200 ${
      isFullscreen
        ? 'fixed inset-0 z-[9999] h-[100dvh] w-screen bg-[#FDFCFB]'
        : 'h-[100dvh]'
    }`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1A1A1A]/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* ASIDE SIDEBAR (TEACHER MAGISTER ROSTER VS STUDENT PERSONAL STUDY BAR) */}
      {/* ========================================================================= */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 border-r border-[#E5E1DA] flex flex-col bg-[#F9F7F2] transition-all duration-300 ${
          isSidebarOpen ? 'translate-x-0 w-72 p-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]' : '-translate-x-full md:translate-x-0'
        } ${
          isSidebarCollapsed
            ? 'md:w-0 md:p-0 md:border-r-0 md:opacity-0 md:overflow-hidden md:pointer-events-none'
            : 'md:w-72 md:p-6 md:opacity-100'
        }`}
      >
        {isTeacher ? (
          /* ========================================================= */
          /* TEACHER VIEW: Magister Dashboard & Student Roster */
          /* ========================================================= */
          <>
            {/* Magister Header */}
            <div className="mb-6 flex justify-between items-start whitespace-nowrap overflow-hidden">
              <div className="min-w-0">
                <h1 className="text-xs uppercase tracking-widest font-sans font-bold text-[#8C7D6B] mb-1">
                  Magister Dashboard
                </h1>
                <p className="text-2xl italic text-[#2C3E50]">Prof. Erasmianus</p>
              </div>
              <div className="flex items-center gap-1">
                {/* Collapse on desktop */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden md:flex items-center justify-center p-1.5 hover:bg-white border border-transparent hover:border-[#E5E1DA] rounded text-[#8C7D6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  title="Свернуть боковую панель"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Close on mobile */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden p-1 text-[#6B655C] hover:text-[#1A1A1A] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Role Switcher Pill for Teacher */}
            <div className="mb-6 bg-white p-1 border border-[#E5E1DA] flex">
              <button
                type="button"
                onClick={() => {
                  setCurrentRole('student');
                  setActiveSession(null);
                }}
                className={`flex-1 py-1.5 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer ${
                  currentRole === 'student'
                    ? 'bg-[#1A1A1A] text-white font-semibold'
                    : 'text-[#6B655C] hover:text-[#1A1A1A]'
                }`}
              >
                Студент
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentRole('teacher');
                  setActiveSession(null);
                }}
                className={`flex-1 py-1.5 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer ${
                  currentRole === 'teacher'
                    ? 'bg-[#1A1A1A] text-white font-semibold'
                    : 'text-[#6B655C] hover:text-[#1A1A1A]'
                }`}
              >
                Преподаватель
              </button>
            </div>

            {/* Students Roster (Teacher only) */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-sans text-[#A39E93]">
                  Студенты ({students.length}/10)
                </h2>
                <span className="text-[10px] font-sans text-[#8C7D6B]">Точность</span>
              </div>

              <div className="space-y-1.5">
                {students.map((st, idx) => {
                  const isSelected = st.id === currentStudentId && currentRole === 'student';
                  const pendingCount = (st.sessionAttempts || []).filter((a) => a.teacherGrade === undefined).length;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setCurrentStudentId(st.id);
                        if (currentRole === 'teacher') {
                          setCurrentRole('student');
                        }
                        setActiveSession(null);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 text-xs transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-white border-[#1A1A1A] shadow-xs'
                          : 'border-transparent hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-start space-x-2 min-w-0 flex-1 pr-1">
                        <span className="text-[11px] font-sans text-[#8C7D6B] w-3.5 shrink-0 mt-0.5">{idx + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-serif text-[#4A443D] truncate font-medium">{st.name}</span>
                            {pendingCount > 0 && currentRole === 'teacher' && (
                              <span className="w-2 h-2 rounded-full bg-[#D4A373] shrink-0" title="Есть непроверенные работы" />
                            )}
                          </div>
                          {st.email ? (
                            <div className="text-[10px] font-mono text-[#8C7D6B] truncate flex items-center gap-1" title={st.email}>
                              <Mail className="w-2.5 h-2.5 shrink-0 text-[#8C7D6B]" />
                              <span className="truncate">{st.email}</span>
                            </div>
                          ) : (
                            <div className="text-[9px] font-sans text-[#A39E93] italic">
                              демо-профиль
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-sans px-1.5 py-0.5 rounded shrink-0 ${
                          st.accuracyRate >= 85
                            ? 'bg-[#C5D9C8] text-[#2D4A32]'
                            : 'bg-[#E5E1DA] text-[#4A443D]'
                        }`}
                      >
                        {st.accuracyRate}%
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(true)}
                  disabled={students.length >= 10}
                  className="w-full py-2 border border-[#E5E1DA] border-dashed text-[#8C7D6B] hover:text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-white text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
                >
                  + Добавить ученика
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E5E1DA]">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRole('teacher');
                    setActiveSession(null);
                    setIsSidebarOpen(false);
                  }}
                  className="text-xs font-sans underline underline-offset-4 hover:text-[#8C7D6B] text-[#4A443D] cursor-pointer"
                >
                  Перейти к журналу проверок →
                </button>
              </div>
            </div>

            {/* Current Student Profile Shortcut at bottom of Sidebar */}
            <div className="mt-auto pt-4 border-t border-[#E5E1DA]">
              <div className="bg-white p-3 border border-[#E5E1DA] shadow-xs flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">{currentStudent.avatar}</span>
                  <div>
                    <p className="text-xs font-serif font-bold text-[#1A1A1A] leading-tight">
                      {currentStudent.name}
                    </p>
                    <p className="text-[10px] font-sans text-[#8C7D6B] italic">
                      {currentStudent.greekAlias}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="p-1.5 hover:bg-[#F9F7F2] border border-[#E5E1DA] rounded text-[#4A443D] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  title="Открыть профиль и настройки"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : isStudent ? (
          /* ========================================================= */
          /* AUTHENTICATED STUDENT VIEW: Personal Study Bar */
          /* ========================================================= */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-5 flex justify-between items-start whitespace-nowrap overflow-hidden">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-sans font-bold text-[#8C7D6B] mb-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#2C3E50]" />
                  <span>Личный кабинет</span>
                </div>
                <h2 className="text-lg font-serif font-bold text-[#1A1A1A] truncate">
                  Библейский греческий
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {/* Collapse on desktop */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden md:flex items-center justify-center p-1.5 hover:bg-white border border-transparent hover:border-[#E5E1DA] rounded text-[#8C7D6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  title="Свернуть боковую панель"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Close on mobile */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden p-1 text-[#6B655C] hover:text-[#1A1A1A] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Student Identity Card */}
            <div className="p-3.5 bg-white border border-[#E5E1DA] rounded-lg shadow-2xs mb-4 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E5E1DA] flex items-center justify-center text-xl shrink-0">
                  {currentStudent.avatar || '👨‍🎓'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-serif font-bold text-[#1A1A1A] truncate">
                    {currentStudent.name}
                  </div>
                  <div className="text-xs font-serif italic text-[#8C7D6B] truncate">
                    {currentStudent.greekAlias}
                  </div>
                </div>
              </div>
            </div>

            {/* If student is not logged into Google Cloud, show a clear Sign-in button */}
            {!currentUserProfile && (
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full mb-3 py-2 px-3 bg-white hover:bg-[#FAF8F5] border border-[#1A1A1A] rounded text-xs font-sans font-bold text-[#1A1A1A] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Войти в аккаунт</span>
              </button>
            )}

            {/* Student Stats 3-Item Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4 font-sans">
              <div className="p-2.5 bg-white border border-[#E5E1DA] rounded text-center">
                <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">Стрик</span>
                <span className="text-sm font-serif font-bold text-[#1A1A1A] flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-[#E76F51]" />
                  {currentStudent.streakDays || 1} дн.
                </span>
              </div>
              <div className="p-2.5 bg-white border border-[#E5E1DA] rounded text-center">
                <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">Точность</span>
                <span className="text-sm font-serif font-bold text-[#2D4A32]">
                  {currentStudent.accuracyRate}%
                </span>
              </div>
              <div className="p-2.5 bg-white border border-[#E5E1DA] rounded text-center">
                <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">Выучено</span>
                <span className="text-sm font-serif font-bold text-[#2C3E50]">
                  {currentStudent.masteredWordsCount || 0}
                </span>
              </div>
            </div>

            {/* Assignments notification box if any */}
            {currentStudent.assignedHomework && currentStudent.assignedHomework.length > 0 && (
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-lg mb-4 text-xs font-sans space-y-1">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#8C7D6B]">
                  <span>Задания</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#2C3E50] text-white font-mono text-[9px]">
                    {currentStudent.assignedHomework.filter(h => !h.completed).length} активных
                  </span>
                </div>
                <p className="text-[11px] text-[#6B655C] leading-snug">
                  {currentStudent.assignedHomework.filter(h => !h.completed).length > 0
                    ? 'У вас есть задания от преподавателя на главном экране.'
                    : 'Все задания сданы! Ожидайте проверки.'}
                </p>
              </div>
            )}

            {/* Quick Links for Student */}
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-sans pr-1">
              <button
                type="button"
                onClick={() => {
                  setIsErasmianModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full p-2.5 text-left bg-white hover:bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2 text-[#1A1A1A] font-medium">
                  <Volume2 className="w-4 h-4 text-[#8C7D6B]" />
                  <span>Правила Эразма</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8C7D6B]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsInstallModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full p-2.5 text-left bg-white hover:bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2 text-[#1A1A1A] font-medium">
                  <Smartphone className="w-4 h-4 text-[#8C7D6B]" />
                  <span>На телефон (PWA)</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8C7D6B]" />
              </button>
            </div>

            {/* Settings at bottom */}
            <div className="mt-auto pt-4 border-t border-[#E5E1DA]">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full p-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded flex items-center justify-between text-xs font-sans transition-colors cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2 text-[#1A1A1A] font-bold">
                  <Settings className="w-4 h-4 text-[#8C7D6B]" />
                  <span>Настройки обучения</span>
                </span>
                <span className="text-[10px] text-[#8C7D6B]">Открыть</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* UNAUTHENTICATED GUEST VIEW: Clean Guest Sidebar */
          /* ========================================================= */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-5 flex justify-between items-start whitespace-nowrap overflow-hidden">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-sans font-bold text-[#8C7D6B] mb-0.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#2C3E50]" />
                  <span>Гостевой доступ</span>
                </div>
                <h2 className="text-lg font-serif font-bold text-[#1A1A1A] truncate">
                  Библейский греческий
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {/* Collapse on desktop */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden md:flex items-center justify-center p-1.5 hover:bg-white border border-transparent hover:border-[#E5E1DA] rounded text-[#8C7D6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  title="Свернуть боковую панель"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Close on mobile */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden p-1 text-[#6B655C] hover:text-[#1A1A1A] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Guest Welcome & Sign In CTA Card */}
            <div className="p-4 bg-white border border-[#E5E1DA] rounded-lg shadow-2xs mb-4 space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E5E1DA] flex items-center justify-center text-lg shrink-0">
                  🌿
                </div>
                <div>
                  <div className="text-xs font-serif font-bold text-[#1A1A1A]">
                    Гостевой режим
                  </div>
                  <div className="text-[10px] font-sans text-[#8C7D6B]">
                    Свободная практика
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-sans text-[#6B655C] leading-relaxed">
                Вы можете тренировать любые слова и главы. Чтобы <strong className="text-[#1A1A1A]">сохранять прогресс</strong>, отслеживать стрик и получать задания — войдите в аккаунт.
              </p>

              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full py-2.5 px-3 bg-[#1A1A1A] hover:bg-[#2C3E50] text-white text-xs font-sans font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Войти студентом</span>
              </button>
            </div>

            {/* Quick Links */}
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-sans pr-1">
              <button
                type="button"
                onClick={() => {
                  setIsErasmianModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full p-2.5 text-left bg-white hover:bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2 text-[#1A1A1A] font-medium">
                  <Volume2 className="w-4 h-4 text-[#8C7D6B]" />
                  <span>Правила Эразма</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8C7D6B]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsInstallModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full p-2.5 text-left bg-white hover:bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2 text-[#1A1A1A] font-medium">
                  <Smartphone className="w-4 h-4 text-[#8C7D6B]" />
                  <span>Установить на телефон</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8C7D6B]" />
              </button>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-[#E5E1DA]">
              <div className="text-[11px] font-sans text-center text-[#8C7D6B] space-y-1">
                <p>Для сохранения прогресса</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="text-[#1A1A1A] font-bold underline hover:text-[#2C3E50] cursor-pointer"
                >
                  Авторизуйтесь через Google
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT WORKSPACE */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Editorial Bar */}
        <header className={`px-2.5 sm:px-6 pb-2 sm:pb-3.5 pt-[max(env(safe-area-inset-top),0.75rem)] sm:pt-3.5 border-b border-[#E5E1DA] items-center justify-between bg-[#FDFCFB] gap-1.5 sm:gap-3 shrink-0 ${
          activeSession || activeMorphologySession || activeManualMorphologySession || activeFreeMorphology || activeCompositionSession || activeExamSession
            ? 'hidden sm:flex'
            : 'flex'
        }`}>
          <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(!isSidebarOpen);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className="p-1.5 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-[#FAF8F5] rounded text-[#1A1A1A] transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={isSidebarCollapsed ? "Развернуть боковую панель" : "Свернуть боковую панель"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#1A1A1A]" />
              ) : (
                <PanelLeft className="w-4 h-4 text-[#6B655C]" />
              )}
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-2xl tracking-tighter leading-none flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="font-serif font-bold">Ἑλληνική</span>
                <span className="text-xs sm:text-base font-light italic text-[#8C7D6B] hidden md:inline">
                  Koine Bible Greek
                </span>
              </h2>
            </div>
          </div>

          {/* Center/Right Controls */}
          <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
            {/* Quick Role Switcher (VISIBLE ONLY TO TEACHERS) */}
            {isTeacher && (
              <div className="hidden lg:flex items-center bg-[#FAF8F5] border border-[#E5E1DA] rounded p-0.5 text-xs font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRole('student');
                    setActiveSession(null);
                  }}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentRole === 'student'
                      ? 'bg-[#1A1A1A] text-white shadow-2xs'
                      : 'text-[#6B655C] hover:text-[#1A1A1A]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Студент</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRole('teacher');
                    setActiveSession(null);
                  }}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentRole === 'teacher'
                      ? 'bg-[#1A1A1A] text-white shadow-2xs'
                      : 'text-[#6B655C] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Преподаватель</span>
                </button>
              </div>
            )}

            {/* Cloud Sync Indicator (Visible on Mobile, Tablet & Desktop) */}
            <button
              type="button"
              onClick={async () => {
                if (isOnline && !isCloudSyncing) {
                  setIsCloudSyncing(true);
                  try {
                    await syncOfflineCacheToCloud(currentStudentId);
                  } finally {
                    setTimeout(() => setIsCloudSyncing(false), 500);
                  }
                }
              }}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[11px] font-sans text-[#6B655C] cursor-pointer transition-colors"
              title={
                !isOnline
                  ? 'Офлайн режим — данные сохраняются локально и автоматически отправятся в облако при подключении к сети'
                  : isCloudQuotaLimitReached()
                  ? 'Дневная квота облака исчерпана — данные надёжно сохраняются локально в браузере'
                  : currentUserProfile
                  ? 'Прогресс синхронизирован с облаком Google Firestore. Нажмите для принудительной синхронизации'
                  : 'Гостевой режим без облака. Войдите через Google для синхронизации'
              }
            >
              {isCloudSyncing ? (
                <RefreshCw className="w-3 h-3 text-[#D4A373] animate-spin" />
              ) : !isOnline ? (
                <WifiOff className="w-3 h-3 text-[#E63946]" />
              ) : isCloudQuotaLimitReached() ? (
                <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
              ) : currentUserProfile ? (
                <span className="w-2 h-2 rounded-full bg-[#34A853]" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#A39E93]" />
              )}
              <span className="hidden sm:inline">
                {!isOnline
                  ? 'Офлайн'
                  : isCloudQuotaLimitReached()
                  ? 'Локально (квота)'
                  : currentUserProfile
                  ? 'Облако'
                  : currentStudent && currentStudent.id !== 'guest_user'
                  ? 'Синхронизировано'
                  : 'Гость (Локально)'}
              </span>
            </button>

            {/* Google Auth / Profile Button */}
            {currentUserProfile ? (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2 sm:px-3 py-1.5 bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans text-[#1A1A1A] flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors rounded shadow-2xs"
                title="Настройки профиля"
              >
                {currentUserProfile.photoURL ? (
                  <img
                    src={currentUserProfile.photoURL}
                    alt={currentUserProfile.displayName}
                    className="w-5 h-5 rounded-full object-cover border border-[#E5E1DA]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{currentUserProfile.avatar}</span>
                )}
                <span className="font-serif font-bold truncate max-w-[80px] sm:max-w-[120px]">
                  {currentUserProfile.displayName}
                </span>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-sans hidden sm:inline-block ${
                  isTeacher ? 'bg-[#2D4A32] text-white' : 'bg-[#E5E1DA] text-[#4A443D]'
                }`}>
                  {isTeacher ? 'Преподаватель' : 'Студент'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {currentStudent && currentStudent.id !== 'guest_user' && (
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="hidden sm:flex px-2 py-1.5 bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans text-[#1A1A1A] items-center gap-1.5 cursor-pointer transition-colors rounded shadow-2xs"
                    title="Настройки профиля студента"
                  >
                    <span>{currentStudent.avatar}</span>
                    <span className="font-serif font-bold truncate max-w-[90px]">
                      {currentStudent.name}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 bg-white border border-[#1A1A1A] hover:bg-[#FAF8F5] text-xs font-sans uppercase font-bold tracking-wider text-[#1A1A1A] flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all rounded shadow-2xs"
                  title="Войти в аккаунт Google"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="hidden sm:inline">Войти в аккаунт</span>
                  <span className="inline sm:hidden">Войти</span>
                </button>
              </div>
            )}

            {/* Fullscreen Mode Toggle Button (Desktop & Tablet only) */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:flex p-2 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-[#FAF8F5] text-[#1A1A1A] transition-colors rounded cursor-pointer"
              title={isFullscreen ? "Выйти из полноэкранного режима" : "Режим во весь экран"}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 text-[#2C3E50]" />
              ) : (
                <Maximize className="w-4 h-4 text-[#8C7D6B]" />
              )}
            </button>

            {/* Erasmian Pronunciation Guide Modal Button */}
            <button
              type="button"
              onClick={() => setIsErasmianModalOpen(true)}
              className="p-1.5 sm:p-2 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] transition-colors rounded cursor-pointer"
              title="Справочник Эразмова чтения"
            >
              <Volume2 className="w-4 h-4 text-[#8C7D6B]" />
            </button>

            {/* Install on Mobile (PWA) Button */}
            <button
              type="button"
              onClick={() => setIsInstallModalOpen(true)}
              className="p-1.5 sm:p-2 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-[#FAF8F5] text-[#1A1A1A] transition-colors rounded cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Установить как приложение на телефон (PWA)"
            >
              <Smartphone className="w-4 h-4 text-[#8C7D6B]" />
              <span className="text-xs font-sans font-medium hidden md:inline text-[#4A443D]">Приложение</span>
            </button>
          </div>
        </header>

        {/* Dynamic Body: Duolingo Practice vs Exam vs Greek Composition vs Dashboard vs Student Hub */}
        <div className={`flex-1 flex flex-col min-h-0 ${
          activeSession || activeMorphologySession || activeFreeMorphology || activeCompositionSession || activeExamSession
            ? 'p-0 overflow-hidden'
            : 'overflow-y-auto p-3 sm:p-6 md:p-8'
        }`}>
          {/* Teacher Student-Preview Notification Banner */}
          {isTeacher && currentRole === 'student' && !activeSession && !activeExamSession && !activeCompositionSession && (
            <div className="mb-6 p-3.5 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-sans rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">👨‍🏫</span>
                <div>
                  <div className="font-bold text-[#78350F]">Режим предварительного просмотра студента</div>
                  <div className="text-[11px] text-[#92400E]">
                    Вы просматриваете интерфейс и практические материалы курса как студент ({currentStudent.name}).
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentRole('teacher')}
                className="px-3 py-1.5 bg-[#92400E] hover:bg-[#78350F] text-white font-bold text-xs rounded transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Вернуться в журнал Magister</span>
              </button>
            </div>
          )}

          {activeManualMorphologySession ? (
            <ManualMorphologyRunner
              assignment={activeManualMorphologySession}
              onComplete={handleCompleteManualMorphology}
              onExit={() => setActiveManualMorphologySession(null)}
            />
          ) : activeMorphologySession || activeFreeMorphology ? (
            <MorphologyRunner
              title={activeMorphologySession ? activeMorphologySession.title : `Свободная тренировка: ${activeFreeMorphology === 'noun' ? 'Существительные' : activeFreeMorphology === 'verb' ? 'Глаголы' : activeFreeMorphology === 'adjective' ? 'Прилагательные' : activeFreeMorphology === 'mistakes' ? 'Работа над ошибками' : 'Микс'}`}
              words={activeMorphologyWords}
              onComplete={(scorePercent, xpGained, missedWordIds, masteredWordIds) => {
                if (activeMorphologySession) {
                  handleCompleteMorphology(scorePercent, xpGained);
                } else {
                  handleCompleteFreeMorphology(scorePercent, xpGained, missedWordIds, masteredWordIds);
                }
              }}
              onExit={() => {
                setActiveMorphologySession(null);
                setActiveFreeMorphology(null);
              }}
            />
          ) : activeCompositionSession ? (
            <GreekCompositionRunner
              assignment={activeCompositionSession}
              onComplete={handleCompleteComposition}
              onExit={() => setActiveCompositionSession(null)}
            />
          ) : activeExamSession ? (
            <ExamRunner
              assignment={activeExamSession.assignment}
              words={activeExamSession.words}
              onComplete={handleCompleteExam}
              onExit={() => setActiveExamSession(null)}
            />
          ) : activeSession && activeSession.isOpen ? (
            <DuolingoEngine
              title={activeSession.title}
              sectionId={activeSession.sectionId}
              words={activeSession.words}
              phrases={activeSession.phrases}
              studentSettings={currentStudent.settings}
              initialMode={activeSession.trainingMode}
              initialDirection={activeSession.direction}
              initialChunkIndex={activeSession.initialChunkIndex}
              initialStageIndex={activeSession.initialStageIndex}
              unmasteredWords={activeSession.unmasteredWords}
              customMnemonics={currentStudent.customMnemonics}
              completedChunkRounds={currentStudent.completedChunkRounds}
              onUpdateMnemonic={handleUpdateStudentMnemonic}
              onComplete={handleCompletePractice}
              onExit={() => setActiveSession(null)}
            />
          ) : currentRole === 'teacher' ? (
            <TeacherDashboard
              students={students}
              customLists={customLists}
              onAssignHomework={handleAssignHomework}
              onCreateCustomList={handleCreateCustomList}
              onUpdateStudentNote={handleUpdateStudentNote}
              onGradeAttempt={handleGradeAttempt}
              onGradeExam={handleGradeExam}
              onSelectStudentToSimulate={(student) => {
                setCurrentStudentId(student.id);
                setCurrentRole('student');
              }}
              onOpenAddStudentModal={() => setIsAddStudentModalOpen(true)}
              onDeleteStudent={handleDeleteStudent}
              onResetStudentProgress={handleResetStudentProgress}
              onDeleteAssignment={handleDeleteAssignment}
            />
          ) : (
            <StudentHub
              currentStudent={currentStudent}
              customLists={customLists}
              isGuest={isGuest}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onStartPractice={handleStartPractice}
              onStartExam={(assignment, words) => {
                setActiveExamSession({ assignment, words });
              }}
              onStartComposition={(assignment) => {
                setActiveCompositionSession(assignment);
              }}
              onStartMorphology={(assignment) => {
                setActiveMorphologySession(assignment);
              }}
              onStartManualMorphology={(assignment) => {
                setActiveManualMorphologySession(assignment);
              }}
              onStartFreeMorphology={(pos) => {
                setActiveFreeMorphology(pos);
              }}
              onOpenErasmianGuide={() => setIsErasmianModalOpen(true)}
              onUpdateMnemonic={handleUpdateStudentMnemonic}
              onAcknowledgeHomework={handleAcknowledgeHomework}
            />
          )}
        </div>
      </div>

      {/* Erasmian Guide Modal */}
      <ErasmianGuideModal
        isOpen={isErasmianModalOpen}
        onClose={() => setIsErasmianModalOpen(false)}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={handleAddStudent}
      />

      {/* Student Profile & Settings Modal */}
      <StudentProfileModal
        student={currentStudent}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateSettings={handleUpdateStudentSettings}
        onUpdateProfile={handleUpdateStudentProfile}
        onDelete={() => handleDeleteStudent(currentStudent.id)}
        onResetProgress={() => handleResetStudentProgress(currentStudent.id)}
      />

      {/* Google Auth & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUserProfile={currentUserProfile}
        onProfileUpdated={(updatedProfile) => {
          setCurrentUserProfile(updatedProfile);
          localStorage.setItem('koine_user_profile', JSON.stringify(updatedProfile));
          localStorage.setItem('koine_user_onboarded', 'true');
          saveUserProfileToCloud(updatedProfile);
          setIsAuthModalOpen(false);
          setIsWelcomeModalOpen(false);
          if (updatedProfile.role === 'teacher') {
            setCurrentRole('teacher');
          } else {
            setCurrentRole('student');
            // update or create student in list
            setStudents((prev) => {
              const idx = prev.findIndex((s) => s.id === updatedProfile.uid);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  name: updatedProfile.displayName,
                  greekAlias: updatedProfile.greekAlias,
                  avatar: updatedProfile.avatar,
                };
                saveStudentToCloud(updated[idx]);
                return updated;
              } else {
                const newDoc: Student = {
                  id: updatedProfile.uid,
                  name: updatedProfile.displayName,
                  greekAlias: updatedProfile.greekAlias,
                  avatar: updatedProfile.avatar,
                  xp: 0,
                  streakDays: 1,
                  lastActive: new Date().toISOString().split('T')[0],
                  accuracyRate: 0,
                  masteredWordsCount: 0,
                  completedLessons: [],
                  assignedHomework: [],
                  wordMastery: {},
                  recentMistakes: [],
                  sessionAttempts: [],
                  settings: {
                    preferredLearningMode: 'frequency',
                    audioSpeed: 0.82,
                    voiceEngine: 'latin_phonetic',
                    dailyWordGoal: 10,
                    batchSize: 8,
                    showTransliteration: true,
                    showPhoneticIpa: true,
                    greekFontSize: 'normal',
                    soundEffectsEnabled: true,
                    autoPlayAudio: true,
                  },
                };
                saveStudentToCloud(newDoc);
                setCurrentStudentId(newDoc.id);
                return [newDoc, ...prev];
              }
            });
          }
        }}
        onLoggedOut={() => {
          setCurrentUserProfile(null);
          localStorage.removeItem('koine_user_profile');
        }}
      />

      {/* PWA / Native Mobile App Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Welcome / Name Entry Modal for First-time Users */}
      <WelcomeOnboardingModal
        isOpen={isWelcomeModalOpen}
        onRegister={handleRegisterNewUser}
        onOpenGoogleAuth={() => {
          setIsWelcomeModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        onContinueAsGuest={handleContinueAsGuest}
      />
    </div>
  );
}
