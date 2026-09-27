"use client"; // This must be the very first line!

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // App router uses next/navigation
import { registerTeacher } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { GraduationCap } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", department: "", employeeId: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { token } = await registerTeacher(formData);
      saveToken(token);
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-3">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-sm text-slate-500">Register as a Teacher</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-md" required />
          <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-md" required />
          <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-md" required />
          <input type="text" placeholder="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-md" required />
          <input type="text" placeholder="Employee ID" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-md" required />
          
          <button type="submit" className="w-full bg-indigo-600 text-white p-2.5 rounded-md hover:bg-indigo-700 transition-colors font-medium">Register</button>
        </form>
        
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <a href="/login" className="text-blue-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}