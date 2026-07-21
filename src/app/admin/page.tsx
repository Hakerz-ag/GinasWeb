'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LayoutShell from '@/components/LayoutShell';
import { api, ClassOut, UserOut, OpenTimeOut, AssessmentOut, ScheduleBlockOut, ChatMessageOut, PaymentMethodConfig } from '@/lib/api';
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
  MapPin,
  FileText,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

const SKILL_LEVELS = ['none', 'beginner', 'adv-beg', 'intermediate', 'int-adv', 'advanced'];
const SKILL_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-700',
  beginner: 'bg-green-100 text-green-700',
  'adv-beg': 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  'int-adv': 'bg-indigo-100 text-indigo-700',
  advanced: 'bg-purple-100 text-purple-700',
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Generate time options from 6:00 AM to 10:30 PM in 30-minute increments
const timeSlots: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of ['00', '30']) {
    if (h === 22 && m === '30') break; // stop at 10:30 PM
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    timeSlots.push(`${hour12}:${m} ${ampm}`);
  }
}

export default function AdminDashboard() {
  const { user, isAuthenticated, loading, justLoggedOut } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'schedule' | 'bookings' | 'email' | 'opentimes' | 'scheduleblocks' | 'messages' | 'payments' | 'enrollments'>('overview');
  const [users, setUsers] = useState<UserOut[]>([]);
  const [classes, setClasses] = useState<ClassOut[]>([]);
  const [openTimes, setOpenTimes] = useState<OpenTimeOut[]>([]);
  const [assessments, setAssessments] = useState<AssessmentOut[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlockOut[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageOut[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
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
  const [openTimeStart, setOpenTimeStart] = useState('9:00 AM');
  const [openTimeEnd, setOpenTimeEnd] = useState('10:00 AM');
  const [openTimeCourt, setOpenTimeCourt] = useState('1');
  const [newClass, setNewClass] = useState({ title: '', type: 'adult-clinic', level: 'beginner', day: 'Monday', startTime: '6:00 PM', endTime: '7:30 PM', startDate: '', endDate: '', season: '', minAge: '' as string | number, maxAge: '' as string | number, price: 350 });
  const [editingClass, setEditingClass] = useState<ClassOut | null>(null);
  const [editClass, setEditClass] = useState({ title: '', type: 'adult-clinic', level: 'beginner', day: 'Monday', startTime: '6:00 PM', endTime: '7:30 PM', startDate: '', endDate: '', season: '', minAge: '' as string | number, maxAge: '' as string | number, price: 350 });
  const [skillDropdownOpen, setSkillDropdownOpen] = useState<string | null>(null);
  const [newBlock, setNewBlock] = useState({ day: 'Monday', startTime: '12:00 PM', endTime: '1:00 PM', reason: 'Clinic break', blockType: 'clinic_break', date: '' });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodConfig>({
    stripe_enabled: true, cash_enabled: true, check_enabled: true,
    venmo_enabled: true, zelle_enabled: true, pay_at_location_enabled: true,
    venmo_handle: '@gina-genovese-6', zelle_info: 'ginastennisworld@gmail.com',
  });
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(false);
  const [paymentConfigSaved, setPaymentConfigSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classPayments, setClassPayments] = useState<any[]>([]);
  const [showClassPayments, setShowClassPayments] = useState(false);
  const [loadingClassPayments, setLoadingClassPayments] = useState(false);
  const [spotlightFiles, setSpotlightFiles] = useState<{ adult?: File | null; teen?: File | null }>({});
  const [spotlightDesc, setSpotlightDesc] = useState('');
  const [spotlights, setSpotlights] = useState<any[]>([]);

  // Fetch data from API on mount
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !justLoggedOut) { router.push('/login'); return; }
    if (isAuthenticated && user?.role !== 'admin') { router.push('/customer'); return; }

    const fetchData = async () => {
      try {
        const [usersRes, classesRes, openTimesRes, assessmentsRes, blocksRes, messagesRes, bookingsRes] = await Promise.all([
          api.getUsers(),
          api.getClasses(),
          api.getOpenTimes(),
          api.getAssessments(),
          api.getScheduleBlocks(),
          api.getChatMessages(),
          api.getBookings(),
        ]);
        setUsers(usersRes.data);
        setClasses(classesRes.data);
        setOpenTimes(openTimesRes.data);
        setAssessments(assessmentsRes.data);
        setScheduleBlocks(blocksRes.data);
        setChatMessages(messagesRes.data);
        setAllBookings(bookingsRes.data);
        try {
          const sp = await api.getSpotlight();
          setSpotlights(sp.data || []);
        } catch (err) {
          console.error('Failed to load spotlight entries:', err);
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      }
    };

    const fetchPaymentConfig = async () => {
      try {
        const res = await api.getPaymentConfig();
        setPaymentConfig(res.data);
      } catch (err) {
        console.error('Failed to fetch payment config (may need admin auth):', err);
      }
    };

    fetchData();
    fetchPaymentConfig();
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

  const openClassPayments = async (clsId: string) => {
    setSelectedClassId(clsId);
    setLoadingClassPayments(true);
    try {
      const res = await api.getClassPaymentStatus(clsId);
      setClassPayments(res.data || []);
      setShowClassPayments(true);
    } catch (err) {
      console.error('Failed to load class payments:', err);
      alert('Failed to load class payments');
    } finally {
      setLoadingClassPayments(false);
    }
  };

  const closeClassPayments = () => { setShowClassPayments(false); setSelectedClassId(null); setClassPayments([]); };

  const markEnrollmentPaid = async (enr: any) => {
    try {
      // create an offline payment and immediately confirm it (admin action)
      const cls = classes.find(c => c.id === selectedClassId);
      const payRes = await api.createPayment({ user_id: enr.user_id, amount: cls?.price || 0, payment_type: 'class', payment_method: 'venmo', enrollment_id: enr.enrollment_id });
      const payment = payRes.data;
      await api.confirmPayment(payment.id, 'Marked paid by admin');
      // refresh
      if (selectedClassId) await openClassPayments(selectedClassId);
    } catch (err) {
      console.error(err);
      alert('Failed to mark as paid');
    }
  };

  const notifyUnpaid = async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.notifyUnpaid(selectedClassId);
      alert(`Created notifications for ${res.data.notified} users`);
    } catch (err) {
      console.error(err);
      alert('Failed to notify unpaid students');
    }
  };

  const doSetClassLevel = async (level: string) => {
    if (!selectedClassId) return;
    try {
      await api.setClassLevel(selectedClassId, level);
      alert('Class level updated');
      // refresh classes list
      const res = await api.getClasses(); setClasses(res.data);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail || 'Failed to set class level');
    }
  };

  const loadSpotlights = async () => {
    try {
      const res = await api.getSpotlight();
      setSpotlights(res.data || []);
    } catch (err) { console.error('Failed to load spotlights:', err); }
  };

  const handleUploadSpotlight = async (isAdult: boolean) => {
    try {
      const file = isAdult ? spotlightFiles.adult : spotlightFiles.teen;
      if (!file) { alert('Please select a file to upload'); return; }
      const form = new FormData();
      form.append('image', file);
      form.append('title', isAdult ? 'Student of the Month (Adult)' : 'Student of the Month (Teen)');
      form.append('description', spotlightDesc || '');
      form.append('is_adult', isAdult ? 'true' : 'false');
      await api.uploadSpotlight(form);
      setSpotlightFiles({});
      setSpotlightDesc('');
      await loadSpotlights();
      alert('Uploaded');
    } catch (err) { console.error(err); alert('Upload failed'); }
  };

  const handleDeleteSpotlight = async (id: string) => {
    if (!confirm('Delete this spotlight entry?')) return;
    try {
      await api.deleteSpotlight(id);
      setSpotlights(spotlights.filter(s => s.id !== id));
    } catch (err) { console.error(err); alert('Failed to delete'); }
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
              {/* Per-class payment checklist */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">Per-class Payment Checklist</h3>
                <p className="text-sm text-gray-500 mb-4">Open a class to see enrollments and mark students as paid.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {classes.map(cls => (
                    <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-semibold text-green-900">{cls.title}</p>
                        <p className="text-xs text-gray-500">{cls.day_of_week} {cls.start_time} • ${cls.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openClassPayments(cls.id)} className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg">View Payments</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-500">Tip: Use "Notify Unpaid" inside a class to create in-app alerts for unpaid students.</div>
              </div>
              {/* Spotlight (Student of the Month) */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">Student(s) of the Month</h3>
                <p className="text-sm text-gray-500 mb-4">Upload one adult and one teen to feature on the public homepage.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Adult Spotlight Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setSpotlightFiles({ ...spotlightFiles, adult: e.target.files?.[0] })} />
                    <button onClick={() => handleUploadSpotlight(true)} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Upload Adult</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Teen Spotlight Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setSpotlightFiles({ ...spotlightFiles, teen: e.target.files?.[0] })} />
                    <button onClick={() => handleUploadSpotlight(false)} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Upload Teen</button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea value={spotlightDesc} onChange={e => setSpotlightDesc(e.target.value)} className="w-full mt-2 p-3 border rounded-lg" rows={3} />
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Existing Spotlights</h4>
                  {spotlights.length === 0 ? (
                    <div className="text-sm text-gray-500">No spotlight entries yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {spotlights.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <img src={s.image_path} alt={s.title} className="w-16 h-16 object-cover rounded-md" />
                            <div>
                              <p className="font-medium text-green-900">{s.title}</p>
                              <p className="text-xs text-gray-500">{s.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${s.is_adult ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>{s.is_adult ? 'Adult' : 'Teen'}</span>
                            <button onClick={() => handleDeleteSpotlight(s.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Class Payments Modal */}
              {showClassPayments && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-6">
                  <div className="bg-white rounded-2xl w-full max-w-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-green-900">Class Payments</h4>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { const lvl = prompt('Set class level (beginner/intermediate/advanced):'); if (lvl) doSetClassLevel(lvl); }} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg">Set Level</button>
                        <button onClick={notifyUnpaid} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg">Notify Unpaid</button>
                        <button onClick={closeClassPayments} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">Close</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {loadingClassPayments ? (
                        <div className="text-center py-6">Loading…</div>
                      ) : classPayments.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">No enrollments found for this class.</div>
                      ) : (
                        <div className="space-y-2">
                          {classPayments.map(enr => (
                            <div key={enr.enrollment_id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                              <div>
                                <p className="font-medium text-green-900">{enr.student_name || enr.user_email}</p>
                                <p className="text-xs text-gray-500">{enr.user_phone || ''}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${enr.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{enr.paid ? 'Paid' : 'Unpaid'}</span>
                                {!enr.paid && <button onClick={() => markEnrollmentPaid(enr)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">Mark Paid</button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
              { key: 'bookings' as const, label: 'Bookings', icon: MapPin },
              { key: 'email' as const, label: 'Email', icon: Mail },
              { key: 'opentimes' as const, label: 'Open Times', icon: Clock },
              { key: 'scheduleblocks' as const, label: 'Blocks', icon: Ban },
              { key: 'messages' as const, label: 'Messages', icon: MessageCircle },
              { key: 'payments' as const, label: 'Payments', icon: CreditCard },
              { key: 'enrollments' as const, label: 'Enrollments', icon: Users },
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
                      <p className="text-xs text-gray-500">{cls.current_students} students • {cls.day_of_week} {cls.start_time} • Ages {cls.min_age}–{cls.max_age}</p>
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
                          {block.date && <p className="text-xs text-red-600 mt-0.5">Date: {new Date(block.date).toLocaleDateString()}</p>}
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
                    {users.sort((a, b) => a.name.localeCompare(b.name)).map(u => (
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
                    {classes.filter(cls => {
                      // Filter out past classes (those with end_date before today)
                      if (cls.end_date) {
                        const endDate = new Date(cls.end_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return endDate >= today;
                      }
                      return true; // Keep classes without end_date
                    }).map(cls => (
                      <div key={cls.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">{cls.title.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-green-900">{cls.title}</p>
                          <p className="text-sm text-gray-500">{cls.day_of_week} {cls.start_time} – {cls.end_time}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${SKILL_COLORS[cls.level] || 'bg-gray-100 text-gray-700'}`}>{cls.level}</span>
                            {cls.season && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700">{cls.season}</span>}
                            {cls.start_date && <span className="text-[10px] text-gray-400">Starts: {new Date(cls.start_date).toLocaleDateString()}</span>}
                            {cls.end_date && <span className="text-[10px] text-gray-400">Ends: {new Date(cls.end_date).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                            setEditingClass(cls);
                            setEditClass({
                              title: cls.title, type: cls.type, level: cls.level, day: cls.day_of_week,
                              startTime: cls.start_time, endTime: cls.end_time,
                              startDate: cls.start_date || '', endDate: cls.end_date || '', season: cls.season || '',
                              minAge: cls.min_age ?? '', maxAge: cls.max_age ?? '', price: cls.price,
                            });
                          }} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200">Edit</button>
                          {cls.season && (
                            <button onClick={async () => {
                              if (confirm(`Renew "${cls.title}" to the next season? This will create a new class with shifted dates and copy all active enrollments.`)) {
                                try {
                                  const res = await api.renewClass(cls.id);
                                  setClasses([...classes, res.data]);
                                } catch (err) { console.error(err); }
                              }
                            }} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200"><Sparkles className="w-3 h-3 inline" /> Renew</button>
                          )}
                          <button onClick={async () => {
                            if (confirm(`Delete "${cls.title}"?`)) {
                              try { await api.deleteClass(cls.id); setClasses(classes.filter(c => c.id !== cls.id)); } catch (err) { console.error(err); }
                            }
                          }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                        </div>
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
                        title: newClass.title, type: newClass.type, level: newClass.level,
                        day_of_week: newClass.day, start_time: newClass.startTime, end_time: newClass.endTime,
                        start_date: newClass.startDate, end_date: newClass.endDate, season: newClass.season || undefined,
                        min_age: typeof newClass.minAge === 'string' ? parseInt(newClass.minAge) || 0 : newClass.minAge, max_age: typeof newClass.maxAge === 'string' ? parseInt(newClass.maxAge) || 100 : newClass.maxAge, price: newClass.price, description: '',
                      });
                      setClasses([...classes, res.data]);
                      setNewClass({ title: '', type: 'adult-clinic', level: 'beginner', day: 'Monday', startTime: '6:00 PM', endTime: '7:30 PM', startDate: '', endDate: '', season: '', minAge: '', maxAge: '', price: 350 });
                    } catch (err) { console.error(err); }
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-gray-500">Title</label><input type="text" value={newClass.title} onChange={e => setNewClass({ ...newClass, title: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">Type</label><select value={newClass.type} onChange={e => setNewClass({ ...newClass, type: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="adult-clinic">Adult Clinic</option><option value="junior-clinic">Junior Clinic</option></select></div>
                      <div><label className="text-sm text-gray-500">Level</label><select value={newClass.level} onChange={e => setNewClass({ ...newClass, level: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="beginner">Beginner</option><option value="adv-beg">Adv. Beg.</option><option value="intermediate">Intermediate</option><option value="int-adv">Int./Adv.</option><option value="advanced">Advanced</option></select></div>
                      <div><label className="text-sm text-gray-500">Day</label><select value={newClass.day} onChange={e => setNewClass({ ...newClass, day: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                      <div><label className="text-sm text-gray-500">Start Time</label><input type="text" value={newClass.startTime} onChange={e => setNewClass({ ...newClass, startTime: e.target.value })} placeholder="e.g. 3:15 PM" className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">End Time</label><input type="text" value={newClass.endTime} onChange={e => setNewClass({ ...newClass, endTime: e.target.value })} placeholder="e.g. 4:45 PM" className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">Start Date</label><input type="date" value={newClass.startDate} onChange={e => setNewClass({ ...newClass, startDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">End Date</label><input type="date" value={newClass.endDate} onChange={e => setNewClass({ ...newClass, endDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">Season</label><select value={newClass.season} onChange={e => setNewClass({ ...newClass, season: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="">No Season</option><option value="winter">❄️ Winter</option><option value="spring">🌸 Spring</option><option value="summer">☀️ Summer</option><option value="fall">🍂 Fall</option></select></div>
                      {newClass.type === 'junior-clinic' && (<><div><label className="text-sm text-gray-500">Min Age</label><input type="number" placeholder="6" value={newClass.minAge} onChange={e => setNewClass({ ...newClass, minAge: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">Max Age</label><input type="number" placeholder="17" value={newClass.maxAge} onChange={e => setNewClass({ ...newClass, maxAge: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div></>)}
                      <div><label className="text-sm text-gray-500">Price ($)</label><input type="text" inputMode="decimal" value={newClass.price} onChange={e => setNewClass({ ...newClass, price: parseFloat(e.target.value) || 0 })} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="350-700" /></div>
                    </div>
                    <button type="submit" className="mt-4 w-full text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium py-2">Add Class</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ── Edit Class Modal ────────────────────────────────────────────── */}
          {editingClass && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-900">Edit Class</h3>
                  <button onClick={() => setEditingClass(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await api.updateClass(editingClass.id, {
                      title: editClass.title, type: editClass.type, level: editClass.level,
                      day_of_week: editClass.day, start_time: editClass.startTime, end_time: editClass.endTime,
                      start_date: editClass.startDate, end_date: editClass.endDate, season: editClass.season || undefined,
                      min_age: typeof editClass.minAge === 'string' ? parseInt(editClass.minAge) || 0 : editClass.minAge,
                      max_age: typeof editClass.maxAge === 'string' ? parseInt(editClass.maxAge) || 100 : editClass.maxAge,
                      price: editClass.price, description: '',
                    });
                    setClasses(classes.map(c => c.id === editingClass.id ? res.data : c));
                    setEditingClass(null);
                  } catch (err) { console.error(err); alert('Failed to update class'); }
                }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm text-gray-500">Title</label><input type="text" value={editClass.title} onChange={e => setEditClass({ ...editClass, title: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="text-sm text-gray-500">Type</label><select value={editClass.type} onChange={e => setEditClass({ ...editClass, type: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="adult-clinic">Adult Clinic</option><option value="junior-clinic">Junior Clinic</option></select></div>
                    <div><label className="text-sm text-gray-500">Level</label><select value={editClass.level} onChange={e => setEditClass({ ...editClass, level: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="beginner">Beginner</option><option value="adv-beg">Adv. Beg.</option><option value="intermediate">Intermediate</option><option value="int-adv">Int./Adv.</option><option value="advanced">Advanced</option></select></div>
                    <div><label className="text-sm text-gray-500">Day</label><select value={editClass.day} onChange={e => setEditClass({ ...editClass, day: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label className="text-sm text-gray-500">Start Time</label><input type="text" value={editClass.startTime} onChange={e => setEditClass({ ...editClass, startTime: e.target.value })} placeholder="e.g. 3:15 PM" className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="text-sm text-gray-500">End Time</label><input type="text" value={editClass.endTime} onChange={e => setEditClass({ ...editClass, endTime: e.target.value })} placeholder="e.g. 4:45 PM" className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="text-sm text-gray-500">Start Date</label><input type="date" value={editClass.startDate} onChange={e => setEditClass({ ...editClass, startDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="text-sm text-gray-500">End Date</label><input type="date" value={editClass.endDate} onChange={e => setEditClass({ ...editClass, endDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="text-sm text-gray-500">Season</label><select value={editClass.season} onChange={e => setEditClass({ ...editClass, season: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="">No Season</option><option value="winter">❄️ Winter</option><option value="spring">🌸 Spring</option><option value="summer">☀️ Summer</option><option value="fall">🍂 Fall</option></select></div>
                    {editClass.type === 'junior-clinic' && (<><div><label className="text-sm text-gray-500">Min Age</label><input type="number" placeholder="6" value={editClass.minAge} onChange={e => setEditClass({ ...editClass, minAge: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="text-sm text-gray-500">Max Age</label><input type="number" placeholder="17" value={editClass.maxAge} onChange={e => setEditClass({ ...editClass, maxAge: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" /></div></>)}
                    <div><label className="text-sm text-gray-500">Price ($)</label><input type="text" inputMode="decimal" value={editClass.price} onChange={e => setEditClass({ ...editClass, price: parseFloat(e.target.value) || 0 })} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="350-700" /></div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button type="submit" className="flex-1 text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium py-2">Save Changes</button>
                    <button type="button" onClick={() => setEditingClass(null)} className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium py-2">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Bookings ────────────────────────────────────────────────────── */}
          {activeSection === 'bookings' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-yellow-500" /> Court Bookings & Applications</h2>
              <p className="text-gray-600 text-sm mb-6">All court booking requests, including 30-week contract applications. Approve or deny pending bookings.</p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Bookings', value: allBookings.length, color: 'bg-blue-100 text-blue-700' },
                  { label: '30-Week Contracts', value: allBookings.filter(b => b.contract_type === '30-week').length, color: 'bg-green-100 text-green-700' },
                  { label: 'Pending Approval', value: allBookings.filter(b => b.status === 'pending').length, color: 'bg-yellow-100 text-yellow-700' },
                  { label: 'Approved', value: allBookings.filter(b => b.status === 'approved').length, color: 'bg-emerald-100 text-emerald-700' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-2xl font-bold text-green-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* 30-Week Contracts Section */}
              {allBookings.filter(b => b.contract_type === '30-week').length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    30-Week Contract Applications
                  </h3>
                  <div className="space-y-3">
                    {allBookings
                      .filter(b => b.contract_type === '30-week')
                      .sort((a, b) => {
                        const statusOrder: Record<string, number> = { pending: 0, approved: 1, denied: 2, completed: 3 };
                        return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
                      })
                      .map(booking => {
                        const bookingUser = users.find(u => u.id === booking.user_id);
                        return (
                          <div key={booking.id} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${
                            booking.status === 'pending' ? 'border-l-yellow-500' :
                            booking.status === 'approved' ? 'border-l-green-500' :
                            booking.status === 'denied' ? 'border-l-red-500' :
                            'border-l-blue-500'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-green-900">Court {booking.court_number}</span>
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    booking.status === 'denied' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </span>
                                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">30-Week Contract</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {booking.date} • {booking.start_time} – {booking.end_time}
                                </p>
                                {bookingUser && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    👤 {bookingUser.name} ({bookingUser.email})
                                    {booking.party_size && ` • Party of ${booking.party_size}`}
                                  </p>
                                )}
                                {booking.notes && (
                                  <p className="text-xs text-gray-400 mt-1 italic">"{booking.notes}"</p>
                                )}
                                {booking.ball_machine && (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-50 text-yellow-700">🎾 Ball Machine</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {booking.status === 'pending' && (
                                  <>
                                    <button onClick={async () => {
                                      try {
                                        await api.updateBooking(booking.id, { status: 'approved' });
                                        setAllBookings(allBookings.map(b => b.id === booking.id ? { ...b, status: 'approved' } : b));
                                      } catch (err) { console.error(err); }
                                    }} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-semibold">Approve</button>
                                    <button onClick={async () => {
                                      try {
                                        await api.updateBooking(booking.id, { status: 'denied' });
                                        setAllBookings(allBookings.map(b => b.id === booking.id ? { ...b, status: 'denied' } : b));
                                      } catch (err) { console.error(err); }
                                    }} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-semibold">Deny</button>
                                  </>
                                )}
                                <button onClick={async () => {
                                  if (confirm('Delete this booking?')) {
                                    try { await api.deleteBooking(booking.id); setAllBookings(allBookings.filter(b => b.id !== booking.id)); } catch (err) { console.error(err); }
                                  }
                                }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200"><Trash2 className="w-3 h-3 inline" /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* All Other Bookings */}
              <h3 className="font-bold text-green-900 mb-4">All Bookings</h3>
              {allBookings.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No bookings yet.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Court</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Time</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Contract</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allBookings
                        .sort((a, b) => {
                          const statusOrder: Record<string, number> = { pending: 0, approved: 1, denied: 2, completed: 3 };
                          return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
                        })
                        .map(booking => {
                        const bookingUser = users.find(u => u.id === booking.user_id);
                        return (
                          <tr key={booking.id} className="hover:bg-green-50/50">
                            <td className="px-4 py-3 text-sm font-medium text-green-900">
                              {bookingUser?.name || 'Unknown'}
                              <p className="text-xs text-gray-400">{bookingUser?.email}</p>
                            </td>
                            <td className="px-4 py-3 text-sm">Court {booking.court_number}</td>
                            <td className="px-4 py-3 text-sm">{booking.date}</td>
                            <td className="px-4 py-3 text-sm">{booking.start_time} – {booking.end_time}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                booking.contract_type === '30-week' ? 'bg-green-100 text-green-700' :
                                booking.contract_type === '15-week' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {booking.contract_type === '30-week' ? '30-Week' :
                                 booking.contract_type === '15-week' ? '15-Week' :
                                 booking.contract_type || 'Single'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                                booking.status === 'denied' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {booking.status === 'pending' && (
                                  <>
                                    <button onClick={async () => {
                                      try {
                                        await api.updateBooking(booking.id, { status: 'approved' });
                                        setAllBookings(allBookings.map(b => b.id === booking.id ? { ...b, status: 'approved' } : b));
                                      } catch (err) { console.error(err); }
                                    }} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">✓</button>
                                    <button onClick={async () => {
                                      try {
                                        await api.updateBooking(booking.id, { status: 'denied' });
                                        setAllBookings(allBookings.map(b => b.id === booking.id ? { ...b, status: 'denied' } : b));
                                      } catch (err) { console.error(err); }
                                    }} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">✗</button>
                                  </>
                                )}
                                <button onClick={async () => {
                                  if (confirm('Delete this booking?')) {
                                    try { await api.deleteBooking(booking.id); setAllBookings(allBookings.filter(b => b.id !== booking.id)); } catch (err) { console.error(err); }
                                  }
                                }} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Class Enrollments */}
              <h3 className="font-bold text-green-900 mt-8 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /> Class Enrollments</h3>
              <p className="text-gray-600 text-sm mb-4">Students enrolled in classes. Shows which classes each student is signed up for.</p>
              {users.filter(u => u.role === 'customer' && u.classes && u.classes.length > 0).length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No class enrollments yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users
                    .filter(u => u.role === 'customer' && u.classes && u.classes.length > 0)
                    .map(u => (
                      <div key={u.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">{u.name.charAt(0)}</div>
                            <div>
                              <p className="font-semibold text-green-900">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${u.assessment_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {u.assessment_completed ? '✓ Assessed' : '⚠ Pending'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {u.classes.map((cls, idx) => {
                            const classData = classes.find(c => c.title === cls);
                            return (
                              <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                                {cls}
                                {classData && <span className="text-blue-400 ml-1">({classData.day_of_week} {classData.start_time})</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
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
                      <p className="text-xs text-gray-500 mb-2">Choose days based on your class schedule or pick specific days.</p>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map(day => (
                          <button key={day} onClick={() => toggleEmailDay(day)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailDays.includes(day) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-50'}`}>{day}</button>
                        ))}
                        {classes.length > 0 && (
                          <button onClick={() => {
                            const classDays = Array.from(new Set(classes.map(c => c.day_of_week)));
                            setEmailDays(classDays);
                          }} className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors">📋 Class Days Only</button>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Times</label>
                      <p className="text-xs text-gray-500 mb-2">Choose times based on your class schedule or pick specific times (9 AM – 9 PM).</p>
                      <div className="flex flex-wrap gap-2">
                        {timeSlots.filter(t => {
                          const timeStr = t;
                          let hour = parseInt(timeStr.split(':')[0]);
                          if (timeStr.includes('PM') && hour !== 12) hour += 12;
                          if (timeStr.includes('AM') && hour === 12) hour = 0;
                          return hour >= 9 && hour < 21;
                        }).map(time => (
                          <button key={time} onClick={() => toggleEmailTime(time)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${emailTimes.includes(time) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-50'}`}>{time}</button>
                        ))}
                        {classes.length > 0 && (
                          <button onClick={() => {
                            const classTimes = Array.from(new Set(classes.map(c => c.start_time)));
                            setEmailTimes(classTimes);
                          }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors">📋 Class Times Only</button>
                        )}
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
                        <div className="flex-1"><p className="font-semibold text-green-900">{ot.day}</p><p className="text-sm text-gray-500">{ot.start_time} – {ot.end_time} — Court {ot.court}</p></div>
                        <button onClick={async () => { try { await api.deleteOpenTime(ot.id); setOpenTimes(openTimes.filter(x => x.id !== ot.id)); } catch (err) { console.error(err); } }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"><Trash2 className="w-3 h-3 inline" /> Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-green-900 mb-4">Add Open Time</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try { const res = await api.addOpenTime({ day: openTimeDay, start_time: openTimeStart, end_time: openTimeEnd, court: openTimeCourt }); setOpenTimes([...openTimes, res.data]); } catch (err) { console.error(err); }
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-gray-500">Day</label><select value={openTimeDay} onChange={e => setOpenTimeDay(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">{daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                      <div><label className="text-sm text-gray-500">Start Time</label><input type="text" value={openTimeStart} onChange={e => setOpenTimeStart(e.target.value)} placeholder="e.g. 6:30 AM" className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">End Time</label><input type="text" value={openTimeEnd} onChange={e => setOpenTimeEnd(e.target.value)} placeholder="e.g. 8:00 AM" className="w-full p-2 border border-gray-300 rounded-lg" /></div>
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
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2"><Ban className="w-5 h-5 text-red-500" /> Clinic Breaks & Club Holidays</h2>
              <p className="text-gray-600 text-sm mb-6">Manage clinic breaks (when the club is open but clinics are not running — those times become available for open court rental) and club holidays (when the entire facility is closed).</p>
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
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${block.block_type === 'club_holiday' ? 'bg-red-100 text-red-700' : block.block_type === 'clinic_break' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{block.block_type === 'clinic_break' ? 'Clinic Break' : block.block_type === 'club_holiday' ? 'Club Holiday' : block.block_type}</span>
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
                    // Check for duplicate blocks
                    const isDuplicate = scheduleBlocks.some(b =>
                      b.day === newBlock.day &&
                      b.start_time === newBlock.startTime &&
                      b.end_time === newBlock.endTime &&
                      b.block_type === newBlock.blockType
                    );
                    if (isDuplicate) {
                      alert('This block already exists. Please modify the time or type to create a different block.');
                      return;
                    }
                    try {
                      const res = await api.createScheduleBlock({ day: newBlock.day, start_time: newBlock.startTime, end_time: newBlock.endTime, reason: newBlock.reason, block_type: newBlock.blockType });
                      setScheduleBlocks([...scheduleBlocks, res.data]);
                      setNewBlock({ day: 'Monday', startTime: '12:00 PM', endTime: '1:00 PM', reason: 'Lunch break', blockType: 'lunch', date: '' });
                    } catch (err) { console.error(err); }
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-gray-500">Day</label><select value={newBlock.day} onChange={e => setNewBlock({ ...newBlock, day: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg">{daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}<option value="all">Every Day</option></select></div>
                      <div><label className="text-sm text-gray-500">Specific Date (optional)</label><input type="date" value={newBlock.date} onChange={e => setNewBlock({ ...newBlock, date: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Optional" /></div>
                      <div><label className="text-sm text-gray-500">Type</label><select value={newBlock.blockType} onChange={e => setNewBlock({ ...newBlock, blockType: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg"><option value="clinic_break">Clinic Break (club open, time available)</option><option value="club_holiday">Club Holiday (facility closed)</option><option value="delay">Delayed Opening</option><option value="maintenance">Maintenance</option></select></div>
                      <div><label className="text-sm text-gray-500">Start Time</label><input type="text" value={newBlock.startTime} onChange={e => setNewBlock({ ...newBlock, startTime: e.target.value })} placeholder="e.g. 12:00 PM" className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="text-sm text-gray-500">End Time</label><input type="text" value={newBlock.endTime} onChange={e => setNewBlock({ ...newBlock, endTime: e.target.value })} placeholder="e.g. 1:00 PM" className="w-full p-2 border border-gray-300 rounded-lg" /></div>
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
                        <button onClick={() => setReplyingTo(replyingTo === msg.id ? null : msg.id)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200">Reply</button>
                        <button onClick={async () => {
                          try { await api.deleteChatMessage(msg.id); setChatMessages(chatMessages.filter(m => m.id !== msg.id)); } catch (err) { console.error(err); }
                        }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                      </div>
                      {replyingTo === msg.id && (
                        <div className="mt-3 ml-13 flex gap-2">
                          <input type="text" value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder={`Reply to ${msg.name}...`} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:outline-none" onKeyDown={async (e) => {
                            if (e.key === 'Enter' && replyMessage.trim()) {
                              try {
                                await fetch('/api/chat-messages', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name: `Admin (${user?.name || 'Gina'})`, email: user?.email || '', message: `Re: ${replyMessage}`, reply_to: msg.id }),
                                });
                                setReplyMessage('');
                                setReplyingTo(null);
                                alert('Reply sent!');
                              } catch (err) { console.error(err); }
                            }
                          }} />
                          <button onClick={async () => {
                            if (!replyMessage.trim()) return;
                            try {
                              await fetch('/api/chat-messages', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: `Admin (${user?.name || 'Gina'})`, email: user?.email || '', message: replyMessage, reply_to: msg.id }),
                              });
                              setReplyMessage('');
                              setReplyingTo(null);
                              alert('Reply sent!');
                            } catch (err) { console.error(err); }
                          }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Send</button>
                          <button onClick={() => { setReplyingTo(null); setReplyMessage(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Payment Methods ─────────────────────────────────────────── */}
          {activeSection === 'payments' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-2 flex items-center gap-2"><CreditCard className="w-5 h-5 text-yellow-500" /> Payment Methods</h2>
              <p className="text-gray-600 text-sm mb-6">Toggle which payment methods customers can use. Changes take effect immediately.</p>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {/* Stripe */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><CreditCard className="w-5 h-5 text-purple-600" /></div>
                    <div>
                      <p className="font-semibold text-green-900">Credit/Debit Card (Stripe)</p>
                      <p className="text-xs text-gray-500">Online card payments via Stripe. Requires API keys to be configured.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const updated = { ...paymentConfig, stripe_enabled: !paymentConfig.stripe_enabled };
                      setPaymentConfig(updated);
                      try { await api.updatePaymentConfig(updated); setPaymentConfigSaved(true); setTimeout(() => setPaymentConfigSaved(false), 2000); } catch (err) { console.error(err); setPaymentConfig({ ...paymentConfig }); }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${paymentConfig.stripe_enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paymentConfig.stripe_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Cash */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><span className="text-lg">💵</span></div>
                    <div>
                      <p className="font-semibold text-green-900">Cash</p>
                      <p className="text-xs text-gray-500">Reservation only — customer pays on first day of class.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const updated = { ...paymentConfig, cash_enabled: !paymentConfig.cash_enabled };
                      setPaymentConfig(updated);
                      try { await api.updatePaymentConfig(updated); setPaymentConfigSaved(true); setTimeout(() => setPaymentConfigSaved(false), 2000); } catch (err) { console.error(err); setPaymentConfig({ ...paymentConfig }); }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${paymentConfig.cash_enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paymentConfig.cash_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Check */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
                    <div>
                      <p className="font-semibold text-green-900">Check</p>
                      <p className="text-xs text-gray-500">Reservation only — customer pays on first day of class.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const updated = { ...paymentConfig, check_enabled: !paymentConfig.check_enabled };
                      setPaymentConfig(updated);
                      try { await api.updatePaymentConfig(updated); setPaymentConfigSaved(true); setTimeout(() => setPaymentConfigSaved(false), 2000); } catch (err) { console.error(err); setPaymentConfig({ ...paymentConfig }); }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${paymentConfig.check_enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paymentConfig.check_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Venmo */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center"><span className="text-lg">📱</span></div>
                    <div>
                      <p className="font-semibold text-green-900">Venmo</p>
                      <p className="text-xs text-gray-500">Send payment via Venmo. Set your handle below.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const updated = { ...paymentConfig, venmo_enabled: !paymentConfig.venmo_enabled };
                      setPaymentConfig(updated);
                      try { await api.updatePaymentConfig(updated); setPaymentConfigSaved(true); setTimeout(() => setPaymentConfigSaved(false), 2000); } catch (err) { console.error(err); setPaymentConfig({ ...paymentConfig }); }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${paymentConfig.venmo_enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paymentConfig.venmo_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Zelle */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><span className="text-lg">🏦</span></div>
                    <div>
                      <p className="font-semibold text-green-900">Zelle</p>
                      <p className="text-xs text-gray-500">Send payment via Zelle. Set your info below.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const updated = { ...paymentConfig, zelle_enabled: !paymentConfig.zelle_enabled };
                      setPaymentConfig(updated);
                      try { await api.updatePaymentConfig(updated); setPaymentConfigSaved(true); setTimeout(() => setPaymentConfigSaved(false), 2000); } catch (err) { console.error(err); setPaymentConfig({ ...paymentConfig }); }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${paymentConfig.zelle_enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paymentConfig.zelle_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Pay at Location */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-amber-600" /></div>
                    <div>
                      <p className="font-semibold text-green-900">Pay at Location</p>
                      <p className="text-xs text-gray-500">Customer pays when they arrive at the club.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const updated = { ...paymentConfig, pay_at_location_enabled: !paymentConfig.pay_at_location_enabled };
                      setPaymentConfig(updated);
                      try { await api.updatePaymentConfig(updated); setPaymentConfigSaved(true); setTimeout(() => setPaymentConfigSaved(false), 2000); } catch (err) { console.error(err); setPaymentConfig({ ...paymentConfig }); }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${paymentConfig.pay_at_location_enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paymentConfig.pay_at_location_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Saved indicator */}
              {paymentConfigSaved && (
                <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Changes saved!
                </div>
              )}

              {/* Venmo & Zelle config */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Venmo Handle</label>
                    <input
                      type="text"
                      value={paymentConfig.venmo_handle}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, venmo_handle: e.target.value })}
                      placeholder="@gina-genovese-6"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shown to customers when they select Venmo payment.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zelle Info</label>
                    <input
                      type="text"
                      value={paymentConfig.zelle_info}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, zelle_info: e.target.value })}
                      placeholder="ginastennisworld@gmail.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email or phone number customers use to send Zelle payments. Will display as "Gina Rose Enterprises LLC".</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setPaymentConfigLoading(true);
                    try {
                      const res = await api.updatePaymentConfig(paymentConfig);
                      setPaymentConfig(res.data);
                      setPaymentConfigSaved(true);
                      setTimeout(() => setPaymentConfigSaved(false), 3000);
                    } catch (err) {
                      console.error('Failed to save payment config:', err);
                      alert('Failed to save changes. Please try again.');
                    } finally {
                      setPaymentConfigLoading(false);
                    }
                  }}
                  disabled={paymentConfigLoading}
                  className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {paymentConfigLoading ? 'Saving...' : 'Save Payment Details'}
                </button>
              </div>
            </div>
          )}

          {/* ── Enrollment Requests ────────────────────────────────────────── */}
          {activeSection === 'enrollments' && (
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-yellow-500" /> Enrollment Requests</h2>
              <p className="text-gray-600 text-sm mb-6">Review and approve or deny class enrollment requests. Gina decides the appropriate level placement.</p>
              {users.filter(u => u.role === 'customer' && u.classes && u.classes.length > 0).length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No enrollment requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.filter(u => u.role === 'customer' && u.classes && u.classes.length > 0).map(u => (
                    <div key={u.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">{u.name.charAt(0)}</div>
                          <div>
                            <p className="font-semibold text-green-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${SKILL_COLORS[u.skill_level] || 'bg-gray-100 text-gray-700'}`}>
                            {u.skill_level ? u.skill_level.charAt(0).toUpperCase() + u.skill_level.slice(1) : 'No Level'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {u.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {u.classes.map((cls, idx) => {
                          const classData = classes.find(c => c.title === cls);
                          return (
                            <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                              {cls}
                              {classData && <span className="text-blue-400 ml-1">({classData.day_of_week} {classData.start_time})</span>}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Set level:</span>
                        <div className="flex gap-1">
                          {SKILL_LEVELS.filter(l => l !== 'none').map(level => (
                            <button key={level} onClick={async () => {
                              try {
                                await api.setSkillLevel(u.id, level);
                                setUsers(users.map(usr => usr.id === u.id ? { ...usr, skill_level: level, assessment_completed: true } : usr));
                              } catch (err) { console.error(err); }
                            }} className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${u.skill_level === level ? SKILL_COLORS[level] + ' ring-2 ring-green-600' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>
                              {level === 'adv-beg' ? 'Adv.Beg' : level === 'int-adv' ? 'Int/Adv' : level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                          ))}
                        </div>
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