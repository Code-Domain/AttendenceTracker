"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginTeacher } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { token } = await loginTeacher(email, password);
      saveToken(token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-3">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">AttendTrack</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-md" placeholder="you@university.edu" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-md" placeholder="••••••••" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium">Sign In</button>
        </form>
        
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account? <a href="/register" className="text-blue-600 font-medium hover:underline">Register here</a>
        </p>
      </div>
    </div>
  );
}