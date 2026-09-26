const API_URL = "http://localhost:5000/api";

export async function getStudents() {
  const response = await fetch(`${API_URL}/students`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to load students");
  }

  return result.data;
}

export async function createStudent(student: {
  name: string;
  rollNo: string;
  semester: number;
}) {
  const response = await fetch(`${API_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to add student");
  }

  return result.data;
}

export async function removeStudent(id: string) {
  const response = await fetch(`${API_URL}/students/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    // This alert will tell you exactly why the database rejected the delete
    alert(`Database Error: ${result.message || "Failed to delete student"}`);
    throw new Error(result.message || "Failed to delete student");
  }

  return result;
}
// Fixed: Using API_URL so it hits your Express backend at port 5000
export const createManyStudents = async (students: any[]) => {
  const res = await fetch(`${API_URL}/students/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students })
  });
  
  if (!res.ok) throw new Error("Failed to save students in bulk");
  
  const data = await res.json();
  return data.data; // Returns the array of saved students from MongoDB
};

export async function getSchedules() {
  const response = await fetch(`${API_URL}/schedules`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to load schedules");
  return result.data;
}

export async function createSchedule(schedule: { day: string; time: string; subject: string; semester: number; rollRange: string; }) {
  const response = await fetch(`${API_URL}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schedule),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to add schedule");
  return result.data;
}

export const createManySchedules = async (schedules: any[]) => {
  const res = await fetch(`${API_URL}/schedules/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedules })
  });
  if (!res.ok) throw new Error("Failed to save schedules in bulk");
  const data = await res.json();
  return data.data; 
};

export async function removeSchedule(id: string) {
  const response = await fetch(`${API_URL}/schedules/${id}`, {
    method: "DELETE",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to delete schedule");
  return result;
}

export async function getProfile() {
  const res = await fetch(`${API_URL}/teacher`);
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function updateProfile(id: string, data: any) {
  const res = await fetch(`${API_URL}/teacher/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message);
  return result.data;
}

export async function registerTeacher(data: { name: string; email: string; password: string; department: string; employeeId: string }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Registration failed");
  return result;
}

export async function loginTeacher(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Login failed");
  return result;
}

export async function getMyProfile(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to fetch profile");
  return result.data;
}