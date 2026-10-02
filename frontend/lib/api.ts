const API_URL = "http://localhost:5000/api";
import { getToken } from "./auth";

// Helper to attach token to headers
const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

// Bulletproof fetch helper
async function fetchJSON(url: string, options: any = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error("Network Error: Backend server is not running or unreachable.");
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Backend returned an invalid response. Is the backend running?`);
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

// --- Auth APIs ---
export async function registerTeacher(data: any) {
  return fetchJSON(`${API_URL}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}

export async function loginTeacher(email: string, password: string) {
  return fetchJSON(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
}

export async function getMyProfile() {
  const data = await fetchJSON(`${API_URL}/auth/me`, { headers: authHeaders() });
  return data.data;
}

// --- Student APIs ---
export async function getStudents() {
  const data = await fetchJSON(`${API_URL}/students`, { headers: authHeaders() });
  return data.data;
}
export async function createStudent(student: any) {
  const data = await fetchJSON(`${API_URL}/students`, { method: "POST", headers: authHeaders(), body: JSON.stringify(student) });
  return data.data;
}
export async function createManyStudents(students: any[]) {
  const data = await fetchJSON(`${API_URL}/students/bulk`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ students }) });
  return data.data;
}
export async function removeStudent(id: string) {
  return fetchJSON(`${API_URL}/students/${id}`, { method: "DELETE", headers: authHeaders() });
}

// --- Schedule APIs ---
export async function getSchedules() {
  const data = await fetchJSON(`${API_URL}/schedules`, { headers: authHeaders() });
  return data.data;
}
export async function createSchedule(schedule: any) {
  const data = await fetchJSON(`${API_URL}/schedules`, { method: "POST", headers: authHeaders(), body: JSON.stringify(schedule) });
  return data.data;
}
export async function createManySchedules(schedules: any[]) {
  const data = await fetchJSON(`${API_URL}/schedules/bulk`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ schedules }) });
  return data.data;
}
export async function removeSchedule(id: string) {
  return fetchJSON(`${API_URL}/schedules/${id}`, { method: "DELETE", headers: authHeaders() });
}

// --- Profile API ---
export async function updateProfile(id: string, data: any) {
  const resData = await fetchJSON(`${API_URL}/auth/update/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  return resData.data;
}

// --- Attendance APIs ---
export async function getAttendance() {
  const data = await fetchJSON(`${API_URL}/attendance`, { headers: authHeaders() });
  return data.data;
}
export async function markAttendanceApi(record: { classId: string; studentId: string; status: string; date: string; }) {
  const data = await fetchJSON(`${API_URL}/attendance/mark`, { method: "POST", headers: authHeaders(), body: JSON.stringify(record) });
  return data.data;
}
export async function finalizeDayApi(records: any[]) {
  return fetchJSON(`${API_URL}/attendance/finalize`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ records }) });
}

// --- Activity APIs ---
export async function getActivities() {
  const data = await fetchJSON(`${API_URL}/activities`, { headers: authHeaders() });
  return data.data;
}
export async function logActivityApi(action: string, details: string) {
  const data = await fetchJSON(`${API_URL}/activities`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ action, details }) });
  return data.data;
}