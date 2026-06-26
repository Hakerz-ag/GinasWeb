/**
 * API client for Gina's Tennis World — talks to the FastAPI backend.
 *
 * All requests go through this single axios instance.
 * The auth token is automatically attached from localStorage.
 */

import axios from "axios";

// ── Base URL ────────────────────────────────────────────────────────────────
// All requests go through /api/* which Next.js proxies to the FastAPI backend.
// In development: Next.js rewrites /api/* → http://localhost:8000/*
// In production: The catch-all API route in src/app/api/[[...path]]/route.ts proxies.
const API_BASE_URL = "/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Auto-attach JWT token ──────────────────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auto-refresh on 401 (token expired) ────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error?.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh for login/register/refresh endpoints
      const url = originalRequest.url || "";
      if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh") || url.includes("/auth/forgot-password") || url.includes("/auth/reset-password")) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // No refresh token — clear auth and redirect to login
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue up requests while we're refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Re-try the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${localStorage.getItem("authToken")}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post("/api/auth/refresh", { refresh_token: refreshToken });
        const { access_token, refresh_token: newRefreshToken, user: userData } = response.data;

        // Store the new tokens
        localStorage.setItem("authToken", access_token);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("authUser", JSON.stringify(userData));

        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process any queued requests
        processQueue(null);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear everything and redirect to login
        processQueue(refreshError);
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authUser");
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Types ───────────────────────────────────────────────────────────────────
export interface UserOut {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  birth_date: string;
  skill_level: string;       // "none", "beginner", "intermediate", "advanced"
  assessment_completed: boolean;
  sessions_taken: number;
  status: string;
  totp_enabled: boolean;     // Whether MFA is enabled for this user
  created_at: string | null;
  sub_accounts: SubAccountOut[];
  classes: string[];
  bookings: string[];
}

export interface SubAccountOut {
  id: string;
  name: string;
  birth_date: string;
  phone: string;
  email: string;
  relationship: string;
  skill_level: string;
  assessment_completed: boolean;
  sessions_taken: number;
}

export interface AssessmentOut {
  id: string;
  user_id: string;
  sub_account_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  skill_level_assigned: string;
  notes: string;
  created_at: string | null;
}

export interface ClassOut {
  id: string;
  title: string;
  instructor_name: string;
  type: string;
  level: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  max_students: number;
  current_students: number;
  price: number;
  description: string;
  season: string;
}

export interface BookingOut {
  id: string;
  user_id: string;
  court_number: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  contract_type: string;
  ball_machine: boolean;
  party_size: number;
  notes: string;
  created_at: string | null;
}

export interface OpenTimeOut {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  court: string;
  status: string;
}

export interface EnrollmentOut {
  id: string;
  user_id: string;
  class_id: string;
  sub_account_id: string | null;
  status: string;
  enrolled_at: string | null;
}

export interface AuthResponse {
  user: UserOut;
  token: string;
  refresh_token?: string;
  mfa_required?: boolean;
  mfa_temp_token?: string;
}

export interface MessageResponse {
  message: string;
}

export interface EmailResponse {
  sent: boolean;
  recipient_count: number;
  message: string;
}

export interface ScheduleBlockOut {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  reason: string;
  block_type: string;
  date?: string;
}

export interface ChatMessageOut {
  id: string;
  user_id?: string | null;
  name: string;
  email: string;
  message: string;
  read: boolean;
  reply_to?: string | null;
  created_at: string | null;
}

export interface NotificationOut {
  id: string;
  user_id: string;
  type: string;       // "booking", "enrollment", "assessment", "payment", "system"
  title: string;
  message: string;
  read: boolean;
  action_url: string;
  related_id: string;
  created_at: string | null;
}

// Minimal PaymentPlan types for frontend usage
export interface InstallmentOut {
  id: string;
  due_date?: string;
  amount: number;
  status: string;
  payment_id?: string;
}

export interface PaymentPlanOut {
  id: string;
  user_id: string;
  total_amount: number;
  plan_type: string;
  installments: InstallmentOut[];
  created_at?: string | null;
}

export interface PaymentOut {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;     // "pending", "completed", "failed", "refunded"
  payment_type: string; // "class", "booking", "assessment"
  payment_method: string; // "stripe", "cash", "check", "venmo", "zelle", "pay_at_location"
  related_id: string;
  stripe_payment_intent_id: string;
  stripe_checkout_session_id: string;
  description: string;
  admin_notes: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaymentMethodOption {
  id: string;       // "stripe", "cash", "check", "venmo", "zelle", "pay_at_location"
  label: string;    // "Credit/Debit Card (Stripe)", "Cash", etc.
  enabled: boolean;
  reservation_only?: boolean;
}

export interface PaymentMethodsResponse {
  methods: PaymentMethodOption[];
  venmo_handle: string;
  zelle_info: string;
  stripe_publishable_key: string;
}

export interface PaymentStats {
  total_revenue: number;
  pending_revenue: number;
  total_payments: number;
  completed_payments: number;
  method_breakdown: Record<string, { total: number; count: number; label: string }>;
}

export interface DashboardStats {
  total_customers: number;
  active_customers: number;
  pending_customers: number;
  total_bookings: number;
  pending_bookings: number;
  total_enrollments: number;
  active_classes: number;
  total_revenue: number;
  unread_messages: number;
  recent_signups: number;
}

// ── API functions ───────────────────────────────────────────────────────────
export const api = {
  // Health
  health: () => axiosInstance.get("/health"),

  // ── Auth ────────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    axiosInstance.post<AuthResponse>("/auth/login", { email, password }),

  register: (name: string, email: string, phone: string, password: string, birth_date?: string) =>
    axiosInstance.post<MessageResponse>("/auth/register", { name, email, phone, password, birth_date }),

  refreshToken: (refreshToken: string) =>
    axiosInstance.post<{ user: UserOut; access_token: string; refresh_token: string }>("/auth/refresh", { refresh_token: refreshToken }),

  logout: (refreshToken: string) =>
    axiosInstance.post<MessageResponse>("/auth/logout", { refresh_token: refreshToken }),

  forgotPassword: (email: string) =>
    axiosInstance.post<MessageResponse>("/auth/forgot-password", { email }),

  resetPassword: (email: string, token: string, newPassword: string) =>
    axiosInstance.post<MessageResponse>("/auth/reset-password", { email, token, new_password: newPassword }),

  // ── Users ──────────────────────────────────────────────────────────────
  getUsers: (role?: string) =>
    axiosInstance.get<UserOut[]>("/users", { params: { role } }),

  getUser: (userId: string) =>
    axiosInstance.get<UserOut>(`/users/${userId}`),

  createUser: (data: { name: string; email: string; phone: string; role: string; password: string }) =>
    axiosInstance.post<UserOut>("/users", data),

  updateUser: (userId: string, data: Partial<{ name: string; email: string; phone: string; role: string; status: string }>) =>
    axiosInstance.put<UserOut>(`/users/${userId}`, data),

  deleteUser: (userId: string) =>
    axiosInstance.delete<MessageResponse>(`/users/${userId}`),

  addSubAccount: (userId: string, data: { name: string; birth_date?: string; phone?: string; email?: string; relationship: string; skill_level?: string }) =>
    axiosInstance.post(`/users/${userId}/sub-accounts`, data),

  removeSubAccount: (userId: string, subId: string) =>
    axiosInstance.delete<MessageResponse>(`/users/${userId}/sub-accounts/${subId}`),

  // ── Classes ────────────────────────────────────────────────────────────
  getClasses: (filters?: { level?: string; type?: string; season?: string }) =>
    axiosInstance.get<ClassOut[]>("/classes", { params: filters }),

  getClass: (classId: string) =>
    axiosInstance.get<ClassOut>(`/classes/${classId}`),

  createClass: (data: {
    title: string; instructor_name: string; type: string; level: string;
    day_of_week: string; start_time: string; end_time: string;
    start_date: string; end_date: string; season?: string;
    max_students: number; price: number; description: string;
  }) => axiosInstance.post<ClassOut>("/classes", data),

  updateClass: (classId: string, data: Record<string, unknown>) =>
    axiosInstance.put<ClassOut>(`/classes/${classId}`, data),

  deleteClass: (classId: string) =>
    axiosInstance.delete<MessageResponse>(`/classes/${classId}`),

  enrollInClass: (userId: string, classId: string, subAccountId?: string) =>
    axiosInstance.post<EnrollmentOut>("/classes/enroll", {
      user_id: userId,
      class_id: classId,
      sub_account_id: subAccountId || null,
    }),

  bulkEnrollInClass: (userId: string, classId: string, subAccountIds: string[]) =>
    axiosInstance.post<EnrollmentOut[]>("/classes/enroll/bulk", {
      user_id: userId,
      class_id: classId,
      sub_account_ids: subAccountIds,
    }),

  renewClass: (classId: string) =>
    axiosInstance.post<ClassOut>(`/classes/renew/${classId}`),

  getEnrollments: (filters?: { user_id?: string; class_id?: string }) =>
    axiosInstance.get<EnrollmentOut[]>("/classes/enrollments", { params: filters }),

  unenroll: (enrollmentId: string) =>
    axiosInstance.delete<MessageResponse>(`/classes/enroll/${enrollmentId}`),

  // ── Bookings ───────────────────────────────────────────────────────────
  getBookings: (filters?: { status?: string; user_id?: string }) =>
    axiosInstance.get<BookingOut[]>("/bookings", { params: filters }),

  getBooking: (bookingId: string) =>
    axiosInstance.get<BookingOut>(`/bookings/${bookingId}`),

  createBooking: (data: {
    user_id: string; court_number: number; date: string;
    start_time: string; end_time: string; contract_type: string;
    ball_machine: boolean; party_size: number; notes: string;
  }) => axiosInstance.post<BookingOut>("/bookings", data),

  updateBooking: (bookingId: string, data: { status?: string }) =>
    axiosInstance.put<BookingOut>(`/bookings/${bookingId}`, data),

  deleteBooking: (bookingId: string) =>
    axiosInstance.delete<MessageResponse>(`/bookings/${bookingId}`),

  // ── Open Times ─────────────────────────────────────────────────────────
  getOpenTimes: () =>
    axiosInstance.get<OpenTimeOut[]>("/opentimes"),

  addOpenTime: (data: { day: string; start_time: string; end_time: string; court: string }) =>
    axiosInstance.post<OpenTimeOut>("/opentimes", data),

  deleteOpenTime: (otId: string) =>
    axiosInstance.delete<MessageResponse>(`/opentimes/${otId}`),

  // ── Calendar ───────────────────────────────────────────────────────────
  getCalendar: (year: number, month: number) =>
    axiosInstance.get("/calendar", { params: { year, month } }),

  // ── Email ──────────────────────────────────────────────────────────────
  sendEmail: (data: { days: string[]; times: string[]; subject: string; body: string; send_to_all?: boolean }) =>
    axiosInstance.post<EmailResponse>("/email/send", data),

  // ── Assessments ────────────────────────────────────────────────────────
  getAssessments: (userId?: string) =>
    axiosInstance.get<AssessmentOut[]>("/assessments", { params: { user_id: userId } }),

  createAssessment: (data: { user_id: string; sub_account_id?: string; date: string; start_time: string; end_time: string }) =>
    axiosInstance.post<AssessmentOut>("/assessments", data),

  completeAssessment: (assessmentId: string, data: { status: string; skill_level_assigned: string; notes?: string }) =>
    axiosInstance.put<AssessmentOut>(`/assessments/${assessmentId}`, data),

  deleteAssessment: (assessmentId: string) =>
    axiosInstance.delete<MessageResponse>(`/assessments/${assessmentId}`),

  // ── Skill Level ────────────────────────────────────────────────────────
  setSkillLevel: (userId: string, skillLevel: string) =>
    axiosInstance.put<UserOut>(`/users/${userId}`, { skill_level: skillLevel, assessment_completed: true }),

  setSubAccountSkillLevel: (userId: string, subAccountId: string, skillLevel: string) =>
    axiosInstance.put<SubAccountOut>(`/users/${userId}/sub-accounts/${subAccountId}`, { skill_level: skillLevel, assessment_completed: skillLevel !== 'none' }),

  // ── Schedule Blocks ────────────────────────────────────────────────────
  getScheduleBlocks: () =>
    axiosInstance.get<ScheduleBlockOut[]>("/schedule-blocks"),

  createScheduleBlock: (data: { day: string; start_time: string; end_time: string; reason: string; block_type: string }) =>
    axiosInstance.post<ScheduleBlockOut>("/schedule-blocks", data),

  deleteScheduleBlock: (blockId: string) =>
    axiosInstance.delete<MessageResponse>(`/schedule-blocks/${blockId}`),

  // ── Chat Messages ─────────────────────────────────────────────────────
  getChatMessages: (unreadOnly?: boolean) =>
    axiosInstance.get<ChatMessageOut[]>("/chat-messages", { params: { unread_only: unreadOnly } }),

  markChatRead: (msgId: string) =>
    axiosInstance.put<ChatMessageOut>(`/chat-messages/${msgId}`),

  deleteChatMessage: (msgId: string) =>
    axiosInstance.delete<MessageResponse>(`/chat-messages/${msgId}`),

  // ── Notifications ─────────────────────────────────────────────────────
  getNotifications: (userId?: string, unreadOnly?: boolean) =>
    axiosInstance.get<NotificationOut[]>("/notifications", { params: { user_id: userId, unread_only: unreadOnly } }),

  getUnreadNotificationCount: (userId: string) =>
    axiosInstance.get<{ unread_count: number }>(`/notifications/unread-count`, { params: { user_id: userId } }),

  createNotification: (data: { user_id: string; type: string; title: string; message: string; action_url?: string; related_id?: string }) =>
    axiosInstance.post<NotificationOut>("/notifications", data),

  markNotificationRead: (notificationId: string) =>
    axiosInstance.put<NotificationOut>(`/notifications/${notificationId}`, { read: true }),

  markAllNotificationsRead: (userId: string) =>
    axiosInstance.put<MessageResponse>(`/notifications/mark-all-read/${userId}`),

  deleteNotification: (notificationId: string) =>
    axiosInstance.delete<MessageResponse>(`/notifications/${notificationId}`),

  // Send SMS via backend (Twilio if configured)
  sendSms: (phone: string, message: string) =>
    axiosInstance.post<{ sent: boolean; detail: string }>("/notifications/send-sms", null, { params: { phone, message } }),

  // ── Payments ───────────────────────────────────────────────────────────
  getPaymentMethods: () =>
    axiosInstance.get<PaymentMethodsResponse>("/payments/methods"),

  getPayments: (filters?: { user_id?: string; status?: string; payment_type?: string; payment_method?: string }) =>
    axiosInstance.get<PaymentOut[]>("/payments", { params: filters }),

  getPayment: (paymentId: string) =>
    axiosInstance.get<PaymentOut>(`/payments/${paymentId}`),

  createPayment: (data: { user_id: string; amount: number; payment_type: string; payment_method?: string; related_id?: string; description?: string }) =>
    axiosInstance.post<PaymentOut>("/payments", data),
  createStripeCheckoutSession: (data: { user_id: string; amount: number; payment_type: string; related_id?: string; description?: string }) =>
    axiosInstance.post<{ checkout_url: string; session_id: string; payment_id: string }>("/payments/create-checkout-session", null, { params: data }),
  confirmPayment: (paymentId: string, adminNotes?: string) =>
    axiosInstance.post<PaymentOut>(`/payments/${paymentId}/confirm`, { admin_notes: adminNotes }),

  getPaymentStats: () =>
    axiosInstance.get<PaymentStats>("/payments/stats"),

  // Payment plans
  createPaymentPlan: (data: { user_id: string; total_amount: number; plan_type: string; booking_id?: string; enrollment_id?: string }) =>
    axiosInstance.post<PaymentPlanOut>("/payment-plans", data),
  getPaymentPlan: (planId: string) =>
    axiosInstance.get<PaymentPlanOut>(`/payment-plans/${planId}`),

  // ── Contact Form ───────────────────────────────────────────────────────
  submitContactForm: (data: { name: string; email: string; phone: string; subject: string; message: string }) =>
    axiosInstance.post<{ success: boolean; message: string }>("/contact", data),

  // ── MFA (Multi-Factor Authentication) ──────────────────────────────────
  mfaSetup: () =>
    axiosInstance.post<{ secret: string; uri: string; qr_code_data_url: string }>("/auth/mfa/setup"),

  mfaVerifySetup: (code: string) =>
    axiosInstance.post<{ user: UserOut; token: string }>("/auth/mfa/verify-setup", null, { params: { code } }),

  mfaVerifyLogin: (code: string, tempToken: string) =>
    axiosInstance.post<{ user: UserOut; token: string }>("/auth/mfa/verify", { code, temp_token: tempToken }),

  mfaDisable: (code: string) =>
    axiosInstance.post<{ message: string }>("/auth/mfa/disable", null, { params: { code } }),

  // ── Dashboard ─────────────────────────────────────────────────────────
  getDashboardStats: () =>
    axiosInstance.get<DashboardStats>("/dashboard/stats"),
};

export default api;