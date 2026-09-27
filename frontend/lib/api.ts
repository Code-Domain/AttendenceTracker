const API_URL = "http://localhost:5000/api";
import { getToken } from "./auth";

// Helper to attach token to headers
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// --- Auth APIs ---
export async function registerTeacher(data: any) {
  const res = await fetch(`${API_URL}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Registration failed");
  return result;
}

export async function loginTeacher(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Login failed");
  return result;
}

export async function getMyProfile() {
  const token = getToken();
  if (!token) throw new Error("No token found");

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    console.error("Profile fetch failed:", result);
    throw new Error(result.message || "Failed to fetch profile");
  }
  
  return result.data;
}
// --- Student APIs ---
export async function getStudents() {
  const res = await fetch(`${API_URL}/students`, { headers: authHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function createStudent(student: any) {
  const res = await fetch(`${API_URL}/students`, { method: "POST", headers: authHeaders(), body: JSON.stringify(student) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function createManyStudents(students: any[]) {
  const res = await fetch(`${API_URL}/students/bulk`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ students }) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function removeStudent(id: string) {
  const res = await fetch(`${API_URL}/students/${id}`, { method: "DELETE", headers: authHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result;
}

// --- Schedule APIs ---
export async function getSchedules() {
  const res = await fetch(`${API_URL}/schedules`, { headers: authHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function createSchedule(schedule: any) {
  const res = await fetch(`${API_URL}/schedules`, { method: "POST", headers: authHeaders(), body: JSON.stringify(schedule) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function createManySchedules(schedules: any[]) {
  const res = await fetch(`${API_URL}/schedules/bulk`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ schedules }) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function removeSchedule(id: string) {
  const res = await fetch(`${API_URL}/schedules/${id}`, { method: "DELETE", headers: authHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result;
}

// --- Profile APIs ---
export async function getProfile() {
  const res = await fetch(`${API_URL}/teacher`, { headers: authHeaders() });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function updateProfile(id: string, data: any) {
  const res = await fetch(`${API_URL}/teacher/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}