'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LayoutShell from '@/components/LayoutShell';
import { api, ClassOut, UserOut, OpenTimeOut, AssessmentOut, ScheduleBlockOut, ChatMessageOut } from '@/lib/api';
import {
  Users,
  Calendar,
  CheckCircle,
  Settings,
  BarChart3,
  UserPlus,
  Clock,
  Mail,
  X,
  Trash2,
  ArrowLeft,
  Award,
  ChevronDown,
  Send,
  Ban,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

const SKILL_LEVELS = ['none', 'beginner', 'intermediate', 'advanced'];
const SKILL_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-700',
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = ['4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];

export default function AdminDashboard() {
  const { user, isAuthenticated, loading, justLoggedOut } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'schedule' | 'email' | 'opentimes' | 'scheduleblocks' | 'messages'>('overview');
  const [users, setUsers] = useState<UserOut[]>([]);
  const [classes, setClasses] = useState<ClassOut[]>([]);
  const [openTimes, setOpenTimes] = useState<OpenTimeOut[]>([]);
  const [assessments, setAssessments] = useState<AssessmentOut[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlockOut[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageOut[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOut | null>(null);
  const [selectedSubAccount, setSelectedSubAccount] = useState<{ id: string; name: string; parentUser: UserOut } | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'customer', phone: '', password: 'changeme' });
  const [emailDays, setEmailDays] = useState<string[]>([]);
  const [emailTimes, setEmailTimes] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailSendAll, setEmailSendAll] = useState(false);
  const [openTimeDay, setOpenTimeDay] = useState('Monday');
  const [openTimeSlot, setOpenTimeSlot] = useState('');
  const [openTimeCourt, setOpenTimeCourt] = useState('1');
  const [newClass, setNewClass] = useState({ title: '', type: 'adult-clinic', level: 'beginner', day: 'Monday', startTime: '6:00 PM', endTime: '7:30 PM', startDate: '', endDate: '', maxStudents: 6, price: 35, instructor: 'Wendy' });
  const [skillDropdownOpen, setSkillDropdownOpen] = useState<string | null>(null);
  const [newBlock, setNewBlock] = useState({ day: 'Monday', startTime: '12:00 PM', endTime: '1:00 PM', reason: 'Lunch break', blockType: 'lunch' });

  // Fetch data from API on mount
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !justLoggedOut) { router.push('/login'); return; }
    if (isAuthenticated && user?.role !== 'admin') { router.push('/customer'); return; }

    const fetchData = async () => {
      try {
        const [usersRes, classesRes, openTimesRes, assessmentsRes, blocksRes, messagesRes] = await Promise.all([
          api.getUsers(),
          api.getClasses(),
          api.getOpenTimes(),
          api.getAssessments(),
          api.getScheduleBlocks(),
          api.getChatMessages(),
        ]);
        setUsers(usersRes.data);
        setClasses(classesRes.data);
        setOpenTimes(openTimesRes.data);
        setAssessments(assessmentsRes.data);
        setScheduleBlocks(blocksRes.data);
        setChatMessages(messagesRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      }
    };
    fetchData();
  }, [isAuthenticated, user, loading, justLoggedOut, router]);

  if (loading) return null;
  if (!isAuthenticated || !user) return null;

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;
    try {
      const res = await api.createUser(newUser);
      setUsers([...users, res.data]);
      setNewUser({ name: '', email: '', role: 'customer', phone: '', password: 'changeme' });
      setShowAddUser(false);
    } catch (err) {
      console.error('Failed to add user:', err);
    }
  };

  const toggleEmailDay = (day: string) => {
    setEmailDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleEmailTime = (time: string) => {
    setEmailTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
  };

  const handleSendEmail = async () => {
    try {
      await api.sendEmail({ days: emailDays, times: emailTimes, subject: emailSubject, body: emailBody, send_to_all: emailSendAll });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) { console.error('Failed to send email:', err); }
  };

  // ── Sub-account profile panel ──────────────────────────────────────────
  if (selectedSubAccount) {
    const sa = selectedSubAccount.parentUser.sub_accounts?.find(s => s.id === selectedSubAccount.id);
    if (!sa) { setSelectedSubAccount(null); return null; }
    const parentUser = selectedSubAccount.parentUser;
    const saAssessments = assessments.filter(a => a.sub_account_id === sa.id);

    return (
      <LayoutShell>
        <section className="bg-gradient-to-r from-green-900 to-green-950 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button onClick={() => setSelectedSubAccount(null)} className="flex items-center gap-2 text-green-300 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Family Member Profile</h1>
          </div>
        </section>
        <section className="bg-green-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-green-900 text-2xl font-bold">{sa.name.charAt(0)}</div>
                <div>
                  <h2 className="text-xl font-bold text-green-900">{sa.name}</h2>
                  <p className="text-sm text-gray-500">{sa.relationship} of {parentUser.name}</p>
                  {sa.birth_date && <p className="text-sm text-gray-500">Born: {new Date(sa.birth_date).toLocaleDateString()}</p>}
                  {sa.phone && <p className="text-sm text-gray-500">{sa.phone}</p>}
                  {sa.email && <p className="text-sm text-gray-500">{sa.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="relative">
                  <button onClick={() => setSkillDropdownOpen(skillDropdownOpen === sa.id ? null : sa.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${SKILL_COLORS[sa.skill_level] || 'bg-gray-100 text-gray-700'}`}>
                    {sa.skill_level.charAt(0).toUpperCase() + sa.skill_level.slice(1)} <ChevronDown className="w-4 h-4" />
                  </button>
                  {skillDropdownOpen === sa.id && (
                    <div className="absolute z-10 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      {SKILL_LEVELS.map(level => (
                        <button key={level} onClick={async () => {
                          try {
                            await api.setSubAccountSkillLevel(parentUser.id, sa.id, level);
                            setSelectedSubAccount({
                              ...selectedSubAccount,
                              parentUser: {
                                ...parentUser,
                                sub_accounts: parentUser.sub_accounts?.map(s =>
                                  s.id === sa.id ? { ...s, skill_level: level, assessment_completed: level !== 'none' } : s
                                )
                              }
                            });
                            setSkillDropdownOpen(null);
                          } catch (err) { console.error(err); }
                        }} className={`w-full text-left px-3 py-2 text-xs hover:bg-green-50 ${sa.skill_level === level ? 'bg-green-50 font-bold' : ''}`}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${sa.assessment_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {sa.assessment_completed ? '✓ Assessed' : '⚠ Pending'}
                </span>
                <span className="text-xs text-gray-500">{sa.sessions_taken} sessions</span>
              </div>
              {saAssessments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Assessment History</h4>
                  {saAssessments.map(a => (
                    <div key={a.id} className="bg-yellow-50 rounded-lg p-3 mb-2 text-sm">
                      <span className="font-medium text-yellow-900">{a.date} at {a.start_time}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </LayoutShell>
    );
  }

  // ── Student profile panel ──────────────────────────────────────────────
  if (selectedUser) {
    const userAssessments = assessments.filter(a => a.user_id === selectedUser.id && !a.sub_account_id);
    return (
      <LayoutShell>
        <section className="bg-gradient-to-r from-green-900 to-green-950 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-green-300 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Student Profile</h1>
          </div>
        </section>
        <section className="bg-green-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">{selectedUser.name.charAt(0)}</div>
                <h2 className="text-xl font-bold text-green-900">{selectedUser.name}</h2>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                <p className="text-sm text-gray-500">{selectedUser.phone}</p>
                {selectedUser.birth_date && <p className="text-sm text-gray-500">Born: {new Date(selectedUser.birth_date).toLocaleDateString()}</p>}
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-bold rounded-full ${selectedUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedUser.status}</span>
                <p className="text-xs text-gray-400 mt-2">Joined {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Award className="w-4 h-4 text-yellow-500" /> Skill Level</h4>
                  <div className="relative">
                    <button onClick={() => setSkillDropdownOpen(skillDropdownOpen === selectedUser.id ? null : selectedUser.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${SKILL_COLORS[selectedUser.skill_level] || 'bg-gray-100 text-gray-700'}`}>
                      <span>{selectedUser.skill_level.charAt(0).toUpperCase() + selectedUser.skill_level.slice(1)}</span><ChevronDown className="w-4 h-4" />
                    </button>
                    {skillDropdownOpen === selectedUser.id && (
                      <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        {SKILL_LEVELS.map(level => (
                          <button key={level} onClick={async () => {
                            try {
                              await api.setSkillLevel(selectedUser.id, level);
                              setUsers(users.map(u => u.id === selectedUser.id ? { ...u, skill_level: level, assessment_completed: level !== 'none' } : u));
                              setSelectedUser({ ...selectedUser, skill_level: level, assessment_completed: level !== 'none' });
                              setSkillDropdownOpen(null);
                            } catch (err) { console.error(err); }
                          }} className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 ${selectedUser.skill_level === level ? 'bg-green-50 font-bold' : ''}`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${selectedUser.assessment_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedUser.assessment_completed ? '✓ Assessed' : '⚠ Not Assessed'}</span>
                    <span className="text-xs text-gray-500">{selectedUser.sessions_taken} sessions</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                {/* Family Members */}
                {selectedUser.sub_accounts && selectedUser.sub_accounts.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-500" /> Family Members</h3>
                    <div className="space-y-3">
                      {selectedUser.sub_accounts.map(sa => (
                        <div key={sa.id} className="bg-purple-50 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-purple-900">{sa.name}</p>
                            <p className="text-sm text-purple-700">{sa.relationship}{sa.birth_date ? ` • Born ${new Date(sa.birth_date).toLocaleDateString()}` : ''}</p>
                            {sa.phone && <p className="text-xs text-purple-600">{sa.phone}</p>}
                            {sa.email && <p className="text-xs text-purple-600">{sa.email}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${SKILL_COLORS[sa.skill_level] || 'bg-gray-100 text-gray-700'}`}>{sa.skill_level.charAt(0).toUpperCase() + sa.skill_level.slice(1)}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sa.assessment_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{sa.assessment_completed ? '✓' : '⚠'}</span>
                            <button onClick={() => setSelectedSubAccount({ id: sa.id, name: sa.name, parentUser: selectedUser })} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200">View</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Enrolled Classes */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /> Enrolled Classes</h3>
                  {selectedUser.classes && selectedUser.classes.length > 0 ? (
                    <div className="space-y-3">
                      {selectedUser.classes.map((cls, idx) => {
                        const classData = classes.find(mc => mc.title === cls);
                        return (
                          <div key={idx} className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-blue-900">{cls}</p>
                              {classData && <p className="text-sm text-blue-700">{classData.day_of_week} {classData.start_time} – {classData.end_time}</p>}
                              {classData && <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full ${SKILL_COLORS[classData.level] || 'bg-gray-100 text-gray-700'}`}>{classData.level}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-gray-500 text-sm">Not enrolled in any classes.</p>}
                </div>
                {/* Assessment History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Assessment History</h3>
                  {userAssessments.length > 0 ? (
                    <div className="space-y-3">
                      {userAssessments.map(a => (
                        <div key={a.id} className="bg-yellow-50 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-yellow-900">{a.date} at {a.start_time}</p>
                            <p className="text-sm text-yellow-700">Status: {a.status}</p>
                            {a.skill_level_assigned && a.skill_level_assigned !== 'none' && <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full ${SKILL_COLORS[a.skill_level_assigned]}`}>Level: {a.skill_level_assigned}</span>}
                            {a.notes && <p className="text-xs text-yellow-600 mt-1">{a.notes}</p>}
                          </div>
                          <div className="flex gap-2">
                            {a.status === 'scheduled' && (
                              <button onClick={async () => {
                                try {
                                  await api.completeAssessment(a.id, { status: 'completed', skill_level_assigned: selectedUser.skill_level !== 'none' ? selectedUser.skill_level : 'beginner' });
                                  const res = await api.getAssessments();
                                  setAssessments(res.data);
                                } catch (err) { console.error(err); }
                              }} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200">Complete</button>
                            )}
                            <button onClick={async () => {
                              try { await api.deleteAssessment(a.id); setAssessments(assessments.filter(x => x.id !== a.id)); } catch (err) { console.error(err); }
                            }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 text-sm">No assessments scheduled. Parents book assessments from their account.</p>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </LayoutShell>
    );
  }

  // ── Main Dashboard ─────────────────────────────────────────────────────
  return (
    <LayoutShell>
      {/* Dashboard Header */}
      <section className="bg-gradient-to-r from-green-900 to-green-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold mb-2">⚙️ ADMIN</div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-green-300 mt-1">Manage users, classes, schedule, and communications.</p>
            </div>
            <Link href="/settings" className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors"><Settings className="w-4 h-4" /> Settings</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-950/5 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: users.length.toString(), icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
              { label: 'Active Classes', value: classes.length.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
              { label: 'Pending Assessments', value: assessments.filter(a => a.status === 'scheduled').length.toString(), icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-100' },
              { label: 'New Messages', value: chatMessages.filter(m => !m.read).length.toString(), icon: MessageCircle, color: 'text-red-600', bg: 'bg-red-100' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                <div><p className="text-xl font-bold text-green-900">{stat.value}</p><p className="text-[11px] text-gray-500 leading-tight">{stat.label}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
              { key: 'users' as const, label: 'Users', icon: UserPlus },
              { key: 'schedule' as const, label: 'Schedule', icon: Calendar },
              { key: 'email' as const, label: 'Email', icon: Mail },
              { key: 'opentimes' as const, label: 'Open Times', icon: Clock },
              { key: 'scheduleblocks' as const, label: 'Blocks', icon: Ban },
              { key: 'messages' as const, label: 'Messages', icon: MessageCircle },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveSection(tab.key)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === tab.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
            <Link href="/admin/calendar" className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-green-700 hover:border-green-300 transition-colors whitespace-nowrap"><Calendar className="w-4 h-4" />Calendar</Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-green-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Overview ─────────────────────────────────────────────────── */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-yellow-500" /> Class Overview</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map(cls => (
                    <div key={cls.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-green-900 text-sm">{cls.title}</h3>
                        <span className="text-sm font-bold text-green-900">${cls.price}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                        <div className={`h-2 rounded-full ${cls.current_students / cls.max_students >= 0.8 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${(cls.current_students / cls.max_students) * 100}%` }} />
                      </div>
                      <p className="text-xs text-gray-500">{cls.current_students}/{cls.max_students} students • {cls.day_of_week} {cls.start_time}</p>
                      {cls.end_date && <p className="text-xs text-gray-400 mt-1">Season ends: {new Date(cls.end_date).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Schedule Blocks Summary */}
              {scheduleBlocks.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2"><Ban className="w-5 h-5 text-red-500" /> Active Schedule Blocks</h2>
                  <div className="space-y-2">
                    {scheduleBlocks.map(block => (
                      <div key={block.id} className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-red-900">{block.day}: {block.start_time} – {block.end_time}</p>
                          <p className="text-sm text-red-700">{block.reason}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${block.block_type === 'closure' ? 'bg-red-100 text-red-700' : block.block_type === 'lunch' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{block.block_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Users ────────────────────────────────────────────────────── */}
          {activeSection === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-green-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-yellow-500" /> User Management</h2>
                <button onClick={() => setShowAddUser(true)} className="btn-primary text-sm py-2"><UserPlus className="w-4 h-4 inline mr-1" /> Add User</button>
              </div>
              {showAddUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-green-900">Add New User</h3><button onClick={() => setShowAddUser(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
                    <div className="space-y-3">
                      <input type="text" placeholder="Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                      <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                      <input type="tel" placeholder="Phone" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                      <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">
                        <option value="customer">Customer</option><option value="coach">Coach</option><option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setShowAddUser(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                      <button onClick={handleAddUser} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Add User</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Skill Level</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Assessment</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-green-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-green-900">{u.name}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'coach' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span></td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button onClick={() => setSkillDropdownOpen(skillDropdownOpen === u.id ? null : u.id)} className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${SKILL_COLORS[u.skill_level] || 'bg-gray-100 text-gray-700'}`}>
                              {u.skill_level.charAt(0).toUpperCase() + u.skill_level.slice(1)}<ChevronDown className="w-3 h-3" />
                            </button>
                            {skillDropdownOpen === u.id && (
                              <div className="absolute z-20 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                                {SKILL_LEVELS.map(level => (
                                  <button key={level} onClick={async () => {
                                    try {
                                      await api.setSkillLevel(u.id, level);
                                      setUsers(users.map(x => x.id === u.id ? { ...x, skill_level: level, assessment_completed: level !== 'none' } : x));
                                      setSkillDropdownOpen(null);
                                    } catch (err) { console.error(err); }
                                  }} className={`w-full text-left px-3 py-2 text-xs hover:bg-green-50 ${u.skill_level === level ? 'bg-green-50 font-bold' : ''}`}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.assessment_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{u.assessment_completed ? '✓ Done' : '⚠ Pending'}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedUser(u)} className="text-green-600 hover:text-green-800 text-sm font-medium">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Schedule ─────────────────────────────────────────────────── */}
          {activeSection === 'schedule' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-yellow-500" /> Schedule Management</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-green-900 mb-4">Classes</h3>
                  <div className="space-y-3">
                    {classes.map(cls => (
                      <div key={cls.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">{cls.title.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-green-900">{cls.title}</p>
                          <p className="text-sm text-gray-500">{cls.day_of_week} {cls.start_time} – {cls.end_time}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${SKILL_COLORS[cls.level] || 'bg-gray-100 text-gray-700'}`}>{cls.level}</span>
                            {cls.start_date && <span className="text-[10px] text-gray-400">Starts: {new Date(cls.start_date).toLocaleDateString()}</span>}
                            {cls.end_date && <span className="text-[10px] text-gray-400">Ends: {new Date(cls.end_date).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <button onClick={async () => {
                          if (confirm(`Delete "${cls.title}"?`)) {
                            try { await api.deleteClass(cls.id); setClasses(classes.filter(c => c.id !== cls.id)); } catch (err) { console.error(err); }
                          }
                        }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-green-900 mb-4">Add Class</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await api.createClass({
                        title: newClass.title, instructor_name: newClass.instructor, type: newClass.type, level: newClass.level,
                        day_of_week: newClass.day, start_time: newClass.startTime, end_time: newClass.endTime,
                        start_date: newClass.startDate, end_date: newClass.endDate,
                        max_students: newClass.maxStudents, price: newClass.price, description: '',
                      });
                      setClasses([...classes, res.data]);
                      setNewClass({ title: '', type: 'adult-clinic', level: 'beginner', day: 'Monday', startTime: '6:00 PM', endTime: '7:30 PM', startDate: '', endDate: '', maxStudents: 6, price: 35, instructor: 'Wendy' });
                    } catch (err) { console.error(err); }
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-gray-500">Title</label><input type="text" value={newClass.title} onChange={e => setNewClass({ ...newClass, title: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">Instructor</label><input type="text" value={newClass.instructor} onChange={e => setNewClass({ ...newClass, instructor: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">Type</label><select value={newClass.type} onChange={e => setNewClass({ ...newClass, type: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="adult-clinic">Adult Clinic</option><option value="junior-clinic">Junior Clinic</option><option value="power-conditioning">Power & Conditioning</option></select></div>
                      <div><label className="text-sm text-gray-500">Level</label><select value={newClass.level} onChange={e => setNewClass({ ...newClass, level: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="all">All</option></select></div>
                      <div><label className="text-sm text-gray-500">Day</label><select value={newClass.day} onChange={e => setNewClass({ ...newClass, day: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                      <div><label className="text-sm text-gray-500">Start Time</label><select value={newClass.startTime} onChange={e => setNewClass({ ...newClass, startTime: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="text-sm text-gray-500">End Time</label><select value={newClass.endTime} onChange={e => setNewClass({ ...newClass, endTime: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="text-sm text-gray-500">Start Date</label><input type="date" value={newClass.startDate} onChange={e => setNewClass({ ...newClass, startDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">End Date</label><input type="date" value={newClass.endDate} onChange={e => setNewClass({ ...newClass, endDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">Max Students</label><input type="number" value={newClass.maxStudents} onChange={e => setNewClass({ ...newClass, maxStudents: parseInt(e.target.value) || 6 })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">Price</label><input type="number" value={newClass.price} onChange={e => setNewClass({ ...newClass, price: parseFloat(e.target.value) || 35 })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    </div>
                    <button type="submit" className="mt-4 w-full text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium py-2">Add Class</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ── Email ────────────────────────────────────────────────────── */}
          {activeSection === 'email' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2"><Mail className="w-5 h-5 text-yellow-500" /> Email Management</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-600 text-sm mb-6">Send notifications about closures, delayed openings, or schedule changes. Select the days and times to target specific students, or send to all.</p>
                {/* Send to all toggle */}
                <div className="mb-6">
                  <button onClick={() => setEmailSendAll(!emailSendAll)} className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between w-full ${emailSendAll ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                    <div><h4 className="font-bold text-green-900">Send to All Customers</h4><p className="text-gray-500 text-sm mt-0.5">Email every active customer regardless of class schedule</p></div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${emailSendAll ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>{emailSendAll && <CheckCircle className="w-4 h-4 text-white" />}</div>
                  </button>
                </div>
                {/* Day selection */}
                {!emailSendAll && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Days</label>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map(day => (
                          <button key={day} onClick={() => toggleEmailDay(day)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailDays.includes(day) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-50'}`}>{day}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Times</label>
                      <div className="flex flex-wrap gap-2">
                        {timeSlots.map(time => (
                          <button key={time} onClick={() => toggleEmailTime(time)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${emailTimes.includes(time) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-50'}`}>{time}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="e.g., Facility Closed — Monday, June 2" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="e.g., Due to inclement weather, the facility will be closed on Monday, June 2. All classes and court bookings are cancelled. We will reschedule your session." rows={5} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none" />
                </div>
                {emailSent && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-green-700 font-medium">Email sent successfully!</span></div>
                )}
                <button onClick={handleSendEmail} disabled={!emailSubject || !emailBody} className={`btn-primary flex items-center gap-2 ${(!emailSubject || !emailBody) ? 'opacity-50 cursor-not-allowed' : ''}`}><Send className="w-4 h-4" /> Send Email</button>
              </div>
            </div>
          )}

          {/* ── Open Times ────────────────────────────────────────────────── */}
          {activeSection === 'opentimes' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-500" /> Open Times Management</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-green-900 mb-4">Open Times</h3>
                  <div className="space-y-3">
                    {openTimes.map(ot => (
                      <div key={ot.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">{ot.day.charAt(0)}</div>
                        <div className="flex-1"><p className="font-semibold text-green-900">{ot.day}</p><p className="text-sm text-gray-500">{ot.time} — Court {ot.court}</p></div>
                        <button onClick={async () => { try { await api.deleteOpenTime(ot.id); setOpenTimes(openTimes.filter(x => x.id !== ot.id)); } catch (err) { console.error(err); } }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"><Trash2 className="w-3 h-3 inline" /> Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-green-900 mb-4">Add Open Time</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try { const res = await api.addOpenTime({ day: openTimeDay, time: openTimeSlot, court: openTimeCourt }); setOpenTimes([...openTimes, res.data]); } catch (err) { console.error(err); }
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-gray-500">Day</label><select value={openTimeDay} onChange={e => setOpenTimeDay(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">{daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                      <div><label className="text-sm text-gray-500">Time</label><select value={openTimeSlot} onChange={e => setOpenTimeSlot(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="text-sm text-gray-500">Court</label><select value={openTimeCourt} onChange={e => setOpenTimeCourt(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg"><option value="1">Court 1</option><option value="2">Court 2</option><option value="3">Court 3</option></select></div>
                    </div>
                    <button type="submit" className="mt-4 w-full text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium py-2">Add Open Time</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ── Schedule Blocks ───────────────────────────────────────────── */}
          {activeSection === 'scheduleblocks' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2"><Ban className="w-5 h-5 text-red-500" /> Schedule Blocks</h2>
              <p className="text-gray-600 text-sm mb-6">Block times for lunch breaks, facility closures, maintenance, or delayed openings. These blocks are reflected in availability across the site.</p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-green-900 mb-4">Active Blocks</h3>
                  {scheduleBlocks.length === 0 ? (
                    <div className="text-center py-8"><Ban className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No schedule blocks set.</p></div>
                  ) : (
                    <div className="space-y-3">
                      {scheduleBlocks.map(block => (
                        <div key={block.id} className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-red-900">{block.day}: {block.start_time} – {block.end_time}</p>
                            <p className="text-sm text-red-700">{block.reason}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${block.block_type === 'closure' ? 'bg-red-100 text-red-700' : block.block_type === 'lunch' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{block.block_type}</span>
                            <button onClick={async () => { try { await api.deleteScheduleBlock(block.id); setScheduleBlocks(scheduleBlocks.filter(b => b.id !== block.id)); } catch (err) { console.error(err); } }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"><Trash2 className="w-3 h-3 inline" /> Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-green-900 mb-4">Add Block</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await api.createScheduleBlock({ day: newBlock.day, start_time: newBlock.startTime, end_time: newBlock.endTime, reason: newBlock.reason, block_type: newBlock.blockType });
                      setScheduleBlocks([...scheduleBlocks, res.data]);
                      setNewBlock({ day: 'Monday', startTime: '12:00 PM', endTime: '1:00 PM', reason: 'Lunch break', blockType: 'lunch' });
                    } catch (err) { console.error(err); }
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-gray-500">Day</label><select value={newBlock.day} onChange={e => setNewBlock({ ...newBlock, day: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}<option value="all">Every Day</option></select></div>
                      <div><label className="text-sm text-gray-500">Type</label><select value={newBlock.blockType} onChange={e => setNewBlock({ ...newBlock, blockType: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="lunch">Lunch Break</option><option value="closure">Closure</option><option value="delay">Delayed Opening</option><option value="maintenance">Maintenance</option></select></div>
                      <div><label className="text-sm text-gray-500">Start Time</label><select value={newBlock.startTime} onChange={e => setNewBlock({ ...newBlock, startTime: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="text-sm text-gray-500">End Time</label><select value={newBlock.endTime} onChange={e => setNewBlock({ ...newBlock, endTime: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div className="col-span-2"><label className="text-sm text-gray-500">Reason</label><input type="text" value={newBlock.reason} onChange={e => setNewBlock({ ...newBlock, reason: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="e.g., Lunch break, Maintenance, Weather closure" /></div>
                    </div>
                    <button type="submit" className="mt-4 w-full text-white bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium py-2">Add Schedule Block</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ── Chat Messages ──────────────────────────────────────────────── */}
          {activeSection === 'messages' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-yellow-500" /> Chat Messages</h2>
              <p className="text-gray-600 text-sm mb-6">Messages from the chat widget on the website. These come from visitors who want to reach Gina directly.</p>
              {chatMessages.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No messages yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`bg-white rounded-xl p-5 shadow-sm border ${msg.read ? 'border-gray-100' : 'border-green-300 bg-green-50/30'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.read ? 'bg-gray-100' : 'bg-green-600'}`}>
                            <span className={`font-bold ${msg.read ? 'text-gray-500' : 'text-white'}`}>{msg.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-green-900">{msg.name}</p>
                            <p className="text-xs text-gray-500">{msg.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!msg.read && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">New</span>
                          )}
                          <span className="text-xs text-gray-400">{msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed ml-13">{msg.message}</p>
                      <div className="flex items-center gap-2 mt-3 ml-13">
                        {!msg.read && (
                          <button onClick={async () => {
                            try { await api.markChatRead(msg.id); setChatMessages(chatMessages.map(m => m.id === msg.id ? { ...m, read: true } : m)); } catch (err) { console.error(err); }
                          }} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200">Mark Read</button>
                        )}
                        <button onClick={async () => {
                          try { await api.deleteChatMessage(msg.id); setChatMessages(chatMessages.filter(m => m.id !== msg.id)); } catch (err) { console.error(err); }
                        }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </LayoutShell>
  );
}