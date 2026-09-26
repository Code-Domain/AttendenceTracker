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