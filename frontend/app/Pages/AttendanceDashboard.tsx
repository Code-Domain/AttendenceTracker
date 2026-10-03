"use client";

import * as XLSX from 'xlsx';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { removeToken } from "@/lib/auth";
import {
  LayoutDashboard, CalendarDays, Users, BarChart3, UserCircle,
  Upload, Plus, Trash2, Check, X, Clock, BookOpen, ClipboardCheck, GraduationCap,
  AlertCircle, TrendingUp, Calendar, Award, KeyRound, Bell, Monitor, Moon, Table, LogOut, Search, ChevronLeft, ChevronRight
} from 'lucide-react';

import {
  getStudents, createStudent, removeStudent, createManyStudents,
  getSchedules, createSchedule, createManySchedules, removeSchedule,
  getMyProfile, updateProfile,
  getAttendance, markAttendanceApi, finalizeDayApi,
  getActivities, logActivityApi
} from "@/lib/api";

// --- Types & Interfaces ---
type View = 'dashboard' | 'attendance' | 'schedule' | 'students' | 'analytics' | 'profile';

interface ScheduleClass {
  id: string;
  day: string;
  time: string;
  subject: string;
  semester: number;
  rollRange: string;
}

interface Student {
  id: string;
  name: string;
  rollNo: string;
  semester: number;
}

interface AttendanceRecord {
  classId: string;
  studentId: string;
  status: 'Present' | 'Absent' | 'Unmarked';
  date: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

// --- Strict Roll No Validation ---
const isValidRollNo = (rollNo: string) => {
  return /^\d{4}-(CSE|ME|EE|EC|LT|C)-\d{2,3}$/.test(rollNo);
};

// --- Strictly Filter & Sort Students by Semester, Year, Branch, and Roll Range ---
const getFilteredStudentsForClass = (cls: ScheduleClass | undefined, allStudents: Student[]) => {
  if (!cls) return [];

  let semesterStudents = allStudents.filter((s: Student) => s.semester === cls.semester);

  const parts = cls.rollRange.split(' to ');
  if (parts.length === 2) {
    const startRoll = parts[0].trim();
    const endRoll = parts[1].trim();

    const matchStart = startRoll.match(/^(\d{4})-([A-Z]+)-(\d+)$/);
    const matchEnd = endRoll.match(/^(\d{4})-([A-Z]+)-(\d+)$/);

    if (matchStart && matchEnd && matchStart[1] === matchEnd[1] && matchStart[2] === matchEnd[2]) {
      const year = matchStart[1];
      const branch = matchStart[2];
      const startNum = parseInt(matchStart[3], 10);
      const endNum = parseInt(matchEnd[3], 10);

      return semesterStudents.filter((s: Student) => {
        const sMatch = s.rollNo.match(/^(\d{4})-([A-Z]+)-(\d+)$/);
        if (sMatch && sMatch[1] === year && sMatch[2] === branch) {
          const sNum = parseInt(sMatch[3], 10);
          return sNum >= startNum && sNum <= endNum;
        }
        return false;
      }).sort((a: Student, b: Student) => {
        const aMatch = a.rollNo.match(/^(\d{4})-([A-Z]+)-(\d+)$/);
        const bMatch = b.rollNo.match(/^(\d{4})-([A-Z]+)-(\d+)$/);
        if (aMatch && bMatch) {
          return parseInt(aMatch[3], 10) - parseInt(bMatch[3], 10);
        }
        return a.rollNo.localeCompare(b.rollNo);
      });
    }
  }

  return semesterStudents.sort((a: Student, b: Student) => a.rollNo.localeCompare(b.rollNo));
};

// --- Modal Component ---
const ErrorModal = ({ show, title, message, onClose, format }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-red-100 rounded-full"><AlertCircle className="w-6 h-6 text-red-600" /></div>
          <div><h3 className="text-lg font-bold text-slate-900">{title}</h3><p className="text-sm text-slate-600 mt-1">{message}</p></div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Required Format:</p>
          <ul className="space-y-1">
            {format.map((f: string, i: number) => <li key={i} className="text-sm text-slate-700 flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> {f}</li>)}
          </ul>
        </div>
        <button onClick={onClose} className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium">Understood</button>
      </div>
    </div>
  );
};

export default function AttendanceDashboard() {
  const router = useRouter();

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [schedule, setSchedule] = useState<ScheduleClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [modal, setModal] = useState({ show: false, type: 'schedule' });

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await getMyProfile();
        setProfile(profileData);

        const studentData = await getStudents();
        setStudents(studentData.map((s: any) => ({ id: s._id, name: s.name, rollNo: s.rollNo, semester: s.semester })));

        const scheduleData = await getSchedules();
        setSchedule(scheduleData.map((c: any) => ({ id: c._id, day: c.day, time: c.time, subject: c.subject, semester: c.semester, rollRange: c.rollRange })));

        const attendanceData = await getAttendance();
        setAttendance(attendanceData.map((a: any) => ({
          classId: a.classId,
          studentId: a.studentId,
          status: a.status,
          date: a.date.split('T')[0]
        })));

        const activityData = await getActivities();
        setRecentActivities(activityData.map((a: any) => ({
          id: a._id,
          action: a.action,
          details: a.details,
          timestamp: a.timestamp
        })));

      } catch (error: any) {
        console.error("Loading data failed:", error);
        if (error.message.includes("Token") || error.message.includes("token") || error.message.includes("Invalid")) {
          handleLogout();
        }
      }
    }
    loadData();
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const logActivity = async (action: string, details: string) => {
    try {
      const savedAct = await logActivityApi(action, details);
      setRecentActivities(prev => [{
        id: savedAct._id,
        action: savedAct.action,
        details: savedAct.details,
        timestamp: savedAct.timestamp
      }, ...prev].slice(0, 10));
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  // --- Excel Upload & Validation ---
  const handleScheduleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        if (json.length < 2) throw new Error("Empty sheet");

        const headers = json[0].filter((h: any) => h).map((h: any) => String(h).trim().toLowerCase());
        if (["day", "time", "subject", "semester", "rollnorange"].some(rh => !headers.includes(rh))) {
          setModal({ show: true, type: 'schedule' }); return;
        }

        const getCellValue = (row: any[], headerName: string) => row[headers.indexOf(headerName)] || "";
        const parsedSchedule: any[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i]; if (!row || row.length === 0) continue;
          const dayMap: any = { 'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday' };
          let dayValue = String(getCellValue(row, "day")).trim();
          parsedSchedule.push({
            day: dayMap[dayValue.toLowerCase()] || dayValue,
            time: String(getCellValue(row, "time") || '').trim(),
            subject: String(getCellValue(row, "subject") || '').trim(),
            semester: parseInt(String(getCellValue(row, "semester"))) || 0,
            rollRange: String(getCellValue(row, "rollnorange") || '').trim(),
          });
        }

        if (parsedSchedule.length > 0) {
          try {
            const savedData = await createManySchedules(parsedSchedule);
            const formattedSaved = savedData.map((c: any) => ({ id: c._id, day: c.day, time: c.time, subject: c.subject, semester: c.semester, rollRange: c.rollRange }));
            setSchedule(prev => [...prev, ...formattedSaved]);
            logActivity("Uploaded Schedule", `Added ${formattedSaved.length} classes via Excel`);
            alert(`Successfully uploaded and saved ${formattedSaved.length} classes!`);
          } catch (error) { console.error(error); alert("Failed to save schedule to database."); }
        }
      } catch (error) { console.error(error); setModal({ show: true, type: 'schedule' }); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleStudentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        if (json.length < 2) throw new Error("Empty sheet");

        const headers = json[0].filter((h: any) => h).map((h: any) => String(h).trim().replace(/\s+/g, '').toLowerCase());
        if (["name", "rollno", "semester"].some(rh => !headers.includes(rh))) {
          setModal({ show: true, type: 'students' }); return;
        }

        const getCellValue = (row: any[], headerName: string) => row[headers.indexOf(headerName)] || "";
        const parsedStudents: any[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i]; if (!row || row.length === 0) continue;
          const name = String(getCellValue(row, "name") || '').trim();
          const rollNo = String(getCellValue(row, "rollno") || '').trim();
          const semester = parseInt(String(getCellValue(row, "semester") || '0')) || 0;

          if (!isValidRollNo(rollNo)) {
            alert(`Invalid Roll No Format: ${rollNo}. Must be like 2024-CSE-01. Skipping this student.`);
            continue;
          }
          if (name && rollNo && semester > 0) parsedStudents.push({ name, rollNo, semester });
        }

        if (parsedStudents.length > 0) {
          try {
            const savedData = await createManyStudents(parsedStudents);
            setStudents(prev => [...prev, ...savedData.map((s: any) => ({ id: s._id, name: s.name, rollNo: s.rollNo, semester: s.semester }))]);
            logActivity("Uploaded Students", `Added ${savedData.length} students via Excel`);
            alert(`Successfully uploaded ${savedData.length} students!`);
          } catch (error) { console.error(error); alert("Failed to save students to database."); }
        }
      } catch (error) { console.error(error); setModal({ show: true, type: 'students' }); }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- CRUD & Attendance Logic ---
  const addClass = async (cls: Omit<ScheduleClass, 'id'>) => {
    try {
      const savedClass = await createSchedule(cls);
      setSchedule(prev => [...prev, { id: savedClass._id, ...savedClass }]);
      logActivity("Added Class", `${cls.subject} on ${cls.day}`);
    } catch { alert("Could not save class to database."); }
  };

  const deleteClass = async (id: string) => {
    try {
      await removeSchedule(id);
      setSchedule(prev => prev.filter(c => c.id !== id));
      logActivity("Deleted Class", `${schedule.find(c => c.id === id)?.subject}`);
    } catch { alert("Could not delete class from database."); }
  };

  const addStudent = async (stu: Omit<Student, "id">) => {
    try {
      const saved = await createStudent({ name: stu.name, rollNo: stu.rollNo, semester: Number(stu.semester) });
      setStudents(prev => [...prev, { id: saved._id, ...saved }]);
      logActivity("Added Student", `${stu.name} (${stu.rollNo})`);
    } catch { alert("Could not save student to database."); }
  };

  const deleteStudent = async (id: string) => {
    try {
      await removeStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      logActivity("Deleted Student", `${students.find(s => s.id === id)?.name}`);
    } catch { console.error("Failed to delete student"); }
  };

  const markPresent = async (classId: string, studentId: string, date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    try {
      await markAttendanceApi({ classId, studentId, status: 'Present', date: targetDate });
      setAttendance(prev => {
        const existing = prev.find(a => a.classId === classId && a.studentId === studentId && a.date === targetDate);
        if (existing) return prev.map(a => a.classId === classId && a.studentId === studentId && a.date === targetDate ? { ...a, status: 'Present' } : a);
        return [...prev, { classId, studentId, status: 'Present', date: targetDate }];
      });
    } catch (error) {
      alert("Failed to mark present in database.");
    }
  };

  const markAbsent = async (classId: string, studentId: string, date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    try {
      await markAttendanceApi({ classId, studentId, status: 'Absent', date: targetDate });
      setAttendance(prev => {
        const existing = prev.find(a => a.classId === classId && a.studentId === studentId && a.date === targetDate);
        if (existing) return prev.map(a => a.classId === classId && a.studentId === studentId && a.date === targetDate ? { ...a, status: 'Absent' } : a);
        return [...prev, { classId, studentId, status: 'Absent', date: targetDate }];
      });
    } catch (error) {
      alert("Failed to mark absent in database.");
    }
  };

  const finalizeDay = async (classId: string) => {
    const cls = schedule.find(c => c.id === classId);
    if (!cls) return;

    const today = new Date().toISOString().split('T')[0];
    const classStudents = getFilteredStudentsForClass(cls, students);
    const recordsToFinalize: any[] = [];

    classStudents.forEach(stu => {
      if (!attendance.find(a => a.classId === cls.id && a.studentId === stu.id && a.date === today)) {
        recordsToFinalize.push({ classId: cls.id, studentId: stu.id, date: today });
      }
    });

    if (recordsToFinalize.length === 0) {
      alert("All students are already marked!");
      return;
    }

    try {
      await finalizeDayApi(recordsToFinalize);
      setAttendance(prev => [...prev, ...recordsToFinalize.map(rec => ({ ...rec, status: 'Absent' }))]);
      logActivity("Attendance Finalized", `Finalized attendance for ${cls.subject}`);
      alert(`Attendance finalized for ${cls.subject}! Unmarked students set to Absent.`);
    } catch (error) {
      alert("Failed to finalize attendance in database.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <ErrorModal show={modal.show} title="Invalid Excel Format" message={`The Excel file you uploaded does not match the required structure.`} format={modal.type === 'schedule' ? ["Day", "Time", "Subject", "Semester", "RollNoRange"] : ["Name", "RollNo", "Semester"]} onClose={() => setModal({ ...modal, show: false })} />

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white"><GraduationCap size={24} /></div>
          <div><h1 className="text-lg font-bold text-white">AttendTrack</h1><p className="text-xs text-slate-500">Teacher Portal</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavButton icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavButton icon={<ClipboardCheck size={18} />} label="Take Attendance" active={activeView === 'attendance'} onClick={() => setActiveView('attendance')} />
          <NavButton icon={<CalendarDays size={18} />} label="Schedule" active={activeView === 'schedule'} onClick={() => setActiveView('schedule')} />
          <NavButton icon={<Users size={18} />} label="Students" active={activeView === 'students'} onClick={() => setActiveView('students')} />
          <NavButton icon={<BarChart3 size={18} />} label="Analytics" active={activeView === 'analytics'} onClick={() => setActiveView('analytics')} />
          <NavButton icon={<UserCircle size={18} />} label="Profile" active={activeView === 'profile'} onClick={() => setActiveView('profile')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-400 hover:bg-red-900 hover:text-white">
            <LogOut size={18} /> <span className="ml-3">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-y-auto p-8">
        {activeView === 'dashboard' && <DashboardView schedule={schedule} students={students} attendance={attendance} recentActivities={recentActivities} />}
        {activeView === 'attendance' && <AttendanceView schedule={schedule} students={students} markPresent={markPresent} markAbsent={markAbsent} attendance={attendance} finalizeDay={finalizeDay} />}
        {activeView === 'schedule' && <ScheduleView schedule={schedule} addClass={addClass} deleteClass={deleteClass} handleUpload={handleScheduleUpload} />}
        {activeView === 'students' && <StudentsView students={students} addStudent={addStudent} deleteStudent={deleteStudent} handleUpload={handleStudentUpload} />}
        {activeView === 'analytics' && <AnalyticsView students={students} schedule={schedule} attendance={attendance} />}
        {activeView === 'profile' && <ProfileView profile={profile} setProfile={setProfile} logActivity={logActivity} />}
      </main>
    </div>
  );
}

// --- Reusable UI Components ---
const NavButton = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{icon}<span className="ml-3">{label}</span></button>
);
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>;
const PageHeader = ({ title, subtitle, children }: any) => <div className="flex justify-between items-center mb-8"><div><h1 className="text-2xl font-bold text-slate-900">{title}</h1><p className="text-sm text-slate-500 mt-1">{subtitle}</p></div><div className="flex gap-2">{children}</div></div>;

// --- Dashboard View ---
const DashboardView = ({ schedule, students, attendance, recentActivities }: { schedule: ScheduleClass[], students: Student[], attendance: AttendanceRecord[], recentActivities: ActivityLog[] }) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = schedule.filter((c: ScheduleClass) => c.day === today);
  const presentToday = attendance.filter((a: AttendanceRecord) => a.status === 'Present').length;
  const attendanceRate = presentToday > 0 ? ((presentToday / attendance.length) * 100).toFixed(0) : 0;

  const subjectStats = schedule.map((cls: ScheduleClass) => {
    const uniqueDates = new Set(
      attendance
        .filter((a: AttendanceRecord) => a.classId === cls.id)
        .map((a: AttendanceRecord) => a.date.split('T')[0])
    );
    return { subject: cls.subject, count: uniqueDates.size };
  });

  return (
    <div>
      <PageHeader title="Dashboard Overview" subtitle="Welcome back! Here's your daily snapshot." />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between items-start mb-2"><span className="text-slate-500 text-sm font-medium">Today's Classes</span><div className="p-2 bg-blue-50 rounded-lg"><Clock size={16} className="text-blue-600" /></div></div><h3 className="text-3xl font-bold text-slate-900">{todayClasses.length}</h3></div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between items-start mb-2"><span className="text-slate-500 text-sm font-medium">Total Students</span><div className="p-2 bg-purple-50 rounded-lg"><Users size={16} className="text-purple-600" /></div></div><h3 className="text-3xl font-bold text-slate-900">{students.length}</h3></div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between items-start mb-2"><span className="text-slate-500 text-sm font-medium">Total Classes Taken</span><div className="p-2 bg-green-50 rounded-lg"><BarChart3 size={16} className="text-green-600" /></div></div><h3 className="text-3xl font-bold text-slate-900">{subjectStats.reduce((acc, curr) => acc + curr.count, 0)}</h3></div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between items-start mb-2"><span className="text-slate-500 text-sm font-medium">Attendance Rate</span><div className="p-2 bg-orange-50 rounded-lg"><ClipboardCheck size={16} className="text-orange-600" /></div></div><h3 className="text-3xl font-bold text-slate-900">{attendanceRate}%</h3></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card><h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><BookOpen size={20} /> Classes Taken Per Subject</h2><div className="space-y-3">{subjectStats.length > 0 ? subjectStats.map((stat, i) => (<div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="font-medium text-sm text-slate-700">{stat.subject}</span><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{stat.count} Classes</span></div>)) : <p className="text-sm text-slate-500 text-center py-4">No schedule data available.</p>}</div></Card>
        <Card><h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><ClipboardCheck size={20} /> Recent Activity</h2><div className="space-y-4 max-h-72 overflow-y-auto pr-2">{recentActivities.length > 0 ? recentActivities.map((act) => (<div key={act.id} className="flex items-center gap-3 text-sm border-b border-slate-50 pb-2"><div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600"><TrendingUp size={14} /></div><div className="flex-1"><p className="font-medium text-slate-700">{act.action}</p><p className="text-xs text-slate-500">{act.details}</p></div><span className="text-xs text-slate-400">{new Date(act.timestamp).toLocaleTimeString()}</span></div>)) : <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>}</div></Card>
      </div>
    </div>
  );
};

// --- Attendance View ---
const AttendanceView = ({ schedule, students, markPresent, markAbsent, attendance, finalizeDay }: any) => {
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = schedule.filter((c: ScheduleClass) => c.day === today);

  const filteredClasses = todayClasses.filter((c: ScheduleClass) =>
    c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rollRange.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClass = schedule.find((c: ScheduleClass) => c.id === activeClassId);
  const activeStudents = getFilteredStudentsForClass(activeClass, students);

  return (
    <div>
      <PageHeader title="Take Attendance" subtitle={`Select a class to mark students. Today is ${today}.`}>
        {activeClass && (
          <button onClick={() => finalizeDay(activeClass.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-2 font-medium">
            <X size={16} /> Finalize {activeClass.subject}
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Today's Classes ({today})</h2>
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input type="text" placeholder="Search class or roll range..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm" />
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
            {filteredClasses.length > 0 ? filteredClasses.map((cls: ScheduleClass) => (
              <button key={cls.id} onClick={() => setActiveClassId(cls.id)} className={`w-full text-left p-4 rounded-lg border transition-colors ${activeClassId === cls.id ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'}`}>
                <h4 className="font-semibold text-slate-800 text-sm">{cls.subject}</h4>
                <p className="text-xs text-slate-500 mt-1">Sem {cls.semester} • {cls.time}</p>
                <p className="text-xs text-slate-400 mt-1 truncate">Roll: {cls.rollRange}</p>
              </button>
            )) : <p className="text-sm text-slate-500 text-center py-4">No classes found for today.</p>}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          {activeClass ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-lg font-bold text-slate-900">{activeClass.subject}</h2><p className="text-sm text-slate-500">Semester {activeClass.semester} • {activeClass.rollRange}</p></div>
                <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full">{activeStudents.length} Students</span>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {activeStudents.map((stu: Student) => {
                  const todayDate = new Date().toISOString().split('T')[0];
                  const record = attendance.find((a: AttendanceRecord) => a.classId === activeClass.id && a.studentId === stu.id && a.date === todayDate);
                  return (
                    <div key={stu.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">{stu.name.charAt(0)}</div>
                        <div><p className="font-medium text-slate-800 text-sm">{stu.name}</p><p className="text-xs text-slate-500">{stu.rollNo}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => markPresent(activeClass.id, stu.id)} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${record?.status === 'Present' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Present</button>
                        <button onClick={() => markAbsent(activeClass.id, stu.id)} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${record?.status === 'Absent' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Absent</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
              <ClipboardCheck size={48} className="mb-4 opacity-50" />
              <p className="text-sm">Select a class from the left to start marking attendance</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// --- Schedule View ---
const ScheduleView = ({ schedule, addClass, deleteClass, handleUpload }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [newClass, setNewClass] = useState({ day: 'Monday', time: '', subject: '', semester: '', rollRange: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addClass({ ...newClass, semester: Number(newClass.semester) });
    setNewClass({ day: 'Monday', time: '', subject: '', semester: '', rollRange: '' });
    setShowForm(false);
  };

  const filteredSchedule = schedule.filter((c: ScheduleClass) =>
    c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.day.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rollRange.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Weekly Schedule" subtitle="Manage your class timings and subjects.">
        <label className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors"><Upload size={16} /> Upload Excel<input type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" /></label>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm font-medium transition-colors"><Plus size={16} /> Add Class</button>
      </PageHeader>

      <Card className="mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder="Search schedule..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm" />
        </div>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select value={newClass.day} onChange={e => setNewClass({ ...newClass, day: e.target.value })} className="border border-slate-200 p-2 rounded-md text-sm bg-white">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d}>{d}</option>)}</select>
            <input type="text" placeholder="Time (10:00 - 11:00)" value={newClass.time} onChange={e => setNewClass({ ...newClass, time: e.target.value })} className="border border-slate-200 p-2 rounded-md text-sm" required />
            <input type="text" placeholder="Subject" value={newClass.subject} onChange={e => setNewClass({ ...newClass, subject: e.target.value })} className="border border-slate-200 p-2 rounded-md text-sm" required />
            <input type="number" placeholder="Semester" value={newClass.semester} onChange={e => setNewClass({ ...newClass, semester: e.target.value })} className="border border-slate-200 p-2 rounded-md text-sm" required />
            <input type="text" placeholder="Roll Range (e.g., 2024-CSE-01 to 2024-CSE-20)" value={newClass.rollRange} onChange={e => setNewClass({ ...newClass, rollRange: e.target.value })} className="border border-slate-200 p-2 rounded-md text-sm" required />
            <button type="submit" className="bg-green-600 text-white p-2 rounded-md text-sm font-medium hover:bg-green-700 md:col-start-5">Save Class</button>
          </form>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSchedule.length > 0 ? filteredSchedule.map((cls: ScheduleClass) => (
          <Card key={cls.id}><div className="flex justify-between items-start"><div className="flex gap-4"><div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><BookOpen size={20} /></div><div><h3 className="font-bold text-slate-900">{cls.subject}</h3><div className="flex flex-col gap-1 text-xs text-slate-500 mt-1"><span className="flex items-center gap-1"><CalendarDays size={12} /> {cls.day} • {cls.time}</span><span className="flex items-center gap-1"><Users size={12} /> Sem {cls.semester} • Roll: {cls.rollRange}</span></div></div></div><button onClick={() => deleteClass(cls.id)} className="text-slate-400 hover:text-red-500 p-2 rounded transition-colors"><Trash2 size={16} /></button></div></Card>
        )) : <p className="text-slate-500 col-span-2 text-center py-8">No classes found matching your search.</p>}
      </div>
    </div>
  );
};

// --- Students View ---
const StudentsView = ({ students, addStudent, deleteStudent, handleUpload }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', semester: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidRollNo(newStudent.rollNo)) { alert("Invalid Roll No Format. Must be like 2024-CSE-03 (Branches: CSE, ME, EE, EC, LT, C)"); return; }
    try {
      await addStudent(newStudent);
      setNewStudent({ name: "", rollNo: "", semester: "" });
      setShowForm(false);
    } catch { alert("Could not save student"); }
  };

  const filteredStudents = students.filter((s: Student) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `semester ${s.semester}`.includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Student Directory" subtitle="Manage all students under your tutelage.">
        <label className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors"><Upload size={16} /> Upload Excel<input type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" /></label>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm font-medium transition-colors"><Plus size={16} /> Add Student</button>
      </PageHeader>

      <Card className="mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder="Search by name, roll no, or semester..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm" />
        </div>
      </Card>

      {showForm && (<Card className="mb-6"><form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4"><input type="text" placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="border border-slate-200 p-2 rounded-md text-sm" required /><input type="text" placeholder="Roll No (e.g., 2024-CSE-03)" value={newStudent.rollNo} onChange={e => setNewStudent({ ...newStudent, rollNo: e.target.value })} className="border border-slate-200 p-2 rounded-md text-sm" required /><input type="number" placeholder="Semester" value={newStudent.semester} onChange={e => setNewStudent({ ...newStudent, semester: e.target.value })} className="border border-slate-200 p-2 rounded-md text-sm" required /><button type="submit" className="bg-green-600 text-white p-2 rounded-md text-sm font-medium hover:bg-green-700">Save Student</button></form></Card>)}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roll No</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map((stu: Student) => (
                <tr key={stu.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-slate-700">{stu.rollNo}</td>
                  <td className="p-4 text-sm text-slate-800">{stu.name}</td>
                  <td className="p-4 text-sm text-slate-600">Semester {stu.semester}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteStudent(stu.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )) : <tr><td colSpan={4} className="p-8 text-center text-slate-500">No students found matching your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- Analytics View (Cascading Student Search & Subject Date-Range Register) ---
const AnalyticsView = ({ students, schedule, attendance }: any) => {
  const [analyticsType, setAnalyticsType] = useState<'student' | 'subject'>('student');

  // Student Analytics State
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedSem, setSelectedSem] = useState<number | ''>('');
  const [selectedRoll, setSelectedRoll] = useState<string>('');

  // Explicitly type the arrays to fix TS implicit any errors
  const uniqueNames: string[] = Array.from(new Set(students.map((s: Student) => s.name)));
  const uniqueSemesters: number[] = Array.from(new Set(students.filter((s: Student) => s.name === selectedName).map((s: Student) => s.semester)));
  const availableRolls: string[] = students.filter((s: Student) => s.name === selectedName && s.semester === selectedSem).map((s: Student) => s.rollNo);
  const targetStudent = students.find((s: Student) => s.name === selectedName && s.semester === selectedSem && s.rollNo === selectedRoll);

  const studentStats = (() => {
    if (!targetStudent) return null;
    const studentRecords = attendance.filter((a: AttendanceRecord) => a.studentId === targetStudent.id);
    const presentCount = studentRecords.filter((a: AttendanceRecord) => a.status === 'Present').length;
    const totalClasses = studentRecords.length;
    const percentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
    return { ...targetStudent, presentCount, totalClasses, percentage };
  })();

  // Subject Analytics State
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSubSem, setSelectedSubSem] = useState<number | ''>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Explicitly type the arrays to fix TS implicit any errors
  const uniqueSubjects: string[] = Array.from(new Set(schedule.map((c: ScheduleClass) => c.subject)));
  const availableSemesters: number[] = Array.from(new Set(
    schedule.filter((c: ScheduleClass) => c.subject === selectedSubject).map((c: ScheduleClass) => c.semester)
  ));
  const availableBranches: string[] = Array.from(new Set(
    students
      .filter((s: Student) => s.semester === selectedSubSem)
      .map((s: Student) => {
        const match = s.rollNo.match(/^\d{4}-([A-Z]+)-\d{2,3}$/);
        return match ? match[1] : '';
      })
      .filter((b: string) => b !== '')
  ));

  // 4. Find the specific class that matches Subject, Semester, and Branch
  const activeClass = schedule.find((c: ScheduleClass) =>
    c.subject === selectedSubject &&
    c.semester === selectedSubSem &&
    c.rollRange.includes(`-${selectedBranch}-`)
  );

  // 5. Get Students filtered by the specific class roll range
  const subjectStudents = getFilteredStudentsForClass(activeClass, students);

  // 6. Get Dates when attendance was marked for this specific class
  const classDates: string[] = activeClass
    ? [...new Set(attendance.filter((a: AttendanceRecord) => a.classId === activeClass.id).map((a: AttendanceRecord) => a.date.split('T')[0]))].sort()
    : [];

  // 7. Filter dates by the selected Start and End Date
  const datesInRange: string[] = [];
  if (startDate && endDate) {
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (classDates.includes(dateStr)) {
        datesInRange.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
  }

  return (
    // ... rest of the component JSX remains exactly the same
    <div>
      <PageHeader title="Analytics" subtitle="Deep dive into individual student or subject performance." />
      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setAnalyticsType('student')} className={`px-4 py-2 text-sm font-medium ${analyticsType === 'student' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Student Analytics</button>
        <button onClick={() => setAnalyticsType('subject')} className={`px-4 py-2 text-sm font-medium ${analyticsType === 'subject' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Subject Register</button>
      </div>

      {analyticsType === 'student' ? (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">1. Select Name</label>
              <select value={selectedName} onChange={e => { setSelectedName(e.target.value); setSelectedSem(''); setSelectedRoll(''); }} className="w-full border border-slate-200 p-2 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">-- Choose Name --</option>
                {uniqueNames.map((name: string) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">2. Select Semester</label>
              <select value={selectedSem} onChange={e => { setSelectedSem(e.target.value === '' ? '' : parseInt(e.target.value)); setSelectedRoll(''); }} disabled={!selectedName} className="w-full border border-slate-200 p-2 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100">
                <option value="">-- Choose Sem --</option>
                {uniqueSemesters.map((sem: number) => <option key={sem} value={sem}>{sem}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">3. Select Roll No</label>
              <select value={selectedRoll} onChange={e => setSelectedRoll(e.target.value)} disabled={!selectedSem} className="w-full border border-slate-200 p-2 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100">
                <option value="">-- Choose Roll --</option>
                {availableRolls.map((roll: string) => <option key={roll} value={roll}>{roll}</option>)}
              </select>
            </div>
          </div>

          {studentStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-600 to-blue-800 text-white"><div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mb-4 backdrop-blur-sm">{studentStats.name.charAt(0)}</div><h3 className="text-xl font-bold">{studentStats.name}</h3><p className="text-sm text-blue-200 mt-1">{studentStats.rollNo}</p><span className="mt-4 px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">Semester {studentStats.semester}</span></Card>
              <Card><div className="text-slate-500 text-sm font-medium mb-1">Classes Attended</div><div className="text-3xl font-bold text-slate-900">{studentStats.presentCount} <span className="text-base text-slate-400 font-normal">/ {studentStats.totalClasses}</span></div></Card>
              <Card><div className="text-slate-500 text-sm font-medium mb-1">Attendance %</div><div className={`text-3xl font-bold ${studentStats.percentage > 75 ? 'text-green-600' : 'text-red-600'}`}>{studentStats.percentage.toFixed(1)}%</div></Card>
              <Card className="md:col-span-3"><h3 className="font-bold text-slate-900 mb-4">Attendance History</h3><div className="space-y-2">{attendance.filter((a: AttendanceRecord) => a.studentId === studentStats.id).map((a: AttendanceRecord, i: number) => { const cls = schedule.find((c: ScheduleClass) => c.id === a.classId); return (<div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-md border border-slate-100"><span className="font-medium text-sm text-slate-700">{cls?.subject || 'Unknown Class'} ({a.date})</span><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${a.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></div>); })}{attendance.filter((a: AttendanceRecord) => a.studentId === studentStats.id).length === 0 && <p className="text-sm text-slate-500 text-center py-4">No records found.</p>}</div></Card>
            </div>
          ) : <p className="text-slate-500 text-center py-8">Select Name, Semester, and Roll No to view analytics.</p>}
        </Card>
      ) : (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Subject</label>
              <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedSubSem(''); setSelectedBranch(''); }} className="w-full border border-slate-200 p-2 rounded-md bg-white text-sm">
                <option value="">-- Select Subject --</option>
                {uniqueSubjects.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Semester</label>
              <select value={selectedSubSem} onChange={e => { setSelectedSubSem(e.target.value === '' ? '' : parseInt(e.target.value)); setSelectedBranch(''); }} disabled={!selectedSubject} className="w-full border border-slate-200 p-2 rounded-md bg-white text-sm disabled:bg-slate-100">
                <option value="">-- Sem --</option>
                {availableSemesters.map((sem: number) => <option key={sem} value={sem}>{sem}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Branch</label>
              <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} disabled={!selectedSubSem} className="w-full border border-slate-200 p-2 rounded-md bg-white text-sm disabled:bg-slate-100">
                <option value="">-- Branch --</option>
                {availableBranches.map((br: string) => <option key={br} value={br}>{br}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={!selectedBranch} className="w-full border border-slate-200 p-2 rounded-md bg-white text-sm disabled:bg-slate-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!startDate} className="w-full border border-slate-200 p-2 rounded-md bg-white text-sm disabled:bg-slate-100" />
            </div>
          </div>

          {selectedSubject && selectedSubSem && selectedBranch && startDate && endDate && datesInRange.length > 0 ? (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10">Roll No</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                    {datesInRange.map((d: string) => <th key={d} className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {subjectStudents.map((stu: Student) => (
                    <tr key={stu.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white z-10">{stu.rollNo}</td>
                      <td className="p-4 text-sm text-slate-800">{stu.name}</td>
                      {datesInRange.map((d: string) => {
                        const rec = attendance.find((a: AttendanceRecord) => a.classId === activeClass?.id && a.studentId === stu.id && a.date.split('T')[0] === d);
                        return (
                          <td key={d} className="p-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${rec?.status === 'Present' ? 'bg-green-100 text-green-700' : rec?.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'}`}>
                              {rec?.status === 'Present' ? 'P' : rec?.status === 'Absent' ? 'A' : '-'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              {selectedBranch ? "Please select a Start and End date to view the attendance register." : "Please select Subject, Semester, and Branch to view its attendance register."}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// --- Profile View ---
const ProfileView = ({ profile, setProfile, logActivity }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile || {});
  const [pwdData, setPwdData] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => { setFormData(profile); }, [profile]);

  if (!profile) return <div className="p-8 text-slate-500">Loading profile...</div>;

  const handleSaveBiodata = async () => {
    try {
      const dataToSave = {
        name: formData?.name || profile.name,
        email: formData?.email || profile.email,
        department: formData?.department || profile.department,
        employeeId: formData?.employeeId || profile.employeeId,
        phone: formData?.phone || profile.phone
      };

      const updated = await updateProfile(profile._id, dataToSave);

      if (updated) {
        setProfile(updated);
        setIsEditing(false);
        logActivity("Updated Profile", "Biodata saved successfully.");
        alert("Profile saved successfully to database!");
      } else {
        alert("Failed to save profile: Backend returned no data.");
      }
    } catch (error: any) {
      console.error("Profile save error:", error);
      alert(`Failed to save profile: ${error.message}`);
    }
  };

  const handleResetPassword = async () => {
    if (!pwdData.current || !pwdData.new || !pwdData.confirm) {
      alert("Please fill out all password fields.");
      return;
    }
    if (pwdData.new !== pwdData.confirm) {
      alert("New passwords do not match!");
      return;
    }

    try {
      await updateProfile(profile._id, {
        currentPassword: pwdData.current,
        password: pwdData.new
      });

      logActivity("Updated Profile", "Password updated successfully.");
      alert("Password changed successfully!");
      setPwdData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      console.error("Password update error:", error);
      alert(`Failed to change password: ${error.message}`);
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information and security." />
      <Card className="mb-6 p-0 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8 -mt-12">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <img src={`https://ui-avatars.com/api/?name=${formData?.name || 'Teacher'}&background=ffffff&color=4f46e5&size=128&bold=true`} alt="Profile" className="w-24 h-24 rounded-xl border-4 border-white shadow-lg" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{formData?.name}</h2>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1"><GraduationCap size={14} /> {formData?.department} • {formData?.employeeId}</p>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${isEditing ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><UserCircle size={20} className="text-slate-500" /> Biodata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label><input type="text" value={formData?.name || ''} disabled={!isEditing} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`w-full p-2.5 border rounded-md text-sm ${!isEditing ? 'bg-slate-50 border-slate-100 text-slate-700' : 'border-blue-300 bg-white'}`} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label><input type="email" value={formData?.email || ''} disabled={!isEditing} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`w-full p-2.5 border rounded-md text-sm ${!isEditing ? 'bg-slate-50 border-slate-100 text-slate-700' : 'border-blue-300 bg-white'}`} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label><input type="text" value={formData?.department || ''} disabled={!isEditing} onChange={e => setFormData({ ...formData, department: e.target.value })} className={`w-full p-2.5 border rounded-md text-sm ${!isEditing ? 'bg-slate-50 border-slate-100 text-slate-700' : 'border-blue-300 bg-white'}`} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Employee ID</label><input type="text" value={formData?.employeeId || ''} disabled={!isEditing} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} className={`w-full p-2.5 border rounded-md text-sm ${!isEditing ? 'bg-slate-50 border-slate-100 text-slate-700' : 'border-blue-300 bg-white'}`} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone Number</label><input type="text" value={formData?.phone || ''} disabled={!isEditing} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={`w-full p-2.5 border rounded-md text-sm ${!isEditing ? 'bg-slate-50 border-slate-100 text-slate-700' : 'border-blue-300 bg-white'}`} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Join Date</label><input type="text" value={formData?.joinDate ? new Date(formData.joinDate).toLocaleDateString() : ''} disabled className="w-full p-2.5 border rounded-md text-sm bg-slate-50 border-slate-100 text-slate-700" /></div>
            </div>
            {isEditing && <button onClick={handleSaveBiodata} className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"><Check size={16} /> Save Changes</button>}
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><KeyRound size={20} className="text-slate-500" /> Security & Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Password</label><input type="password" value={pwdData.current} onChange={e => setPwdData({ ...pwdData, current: e.target.value })} placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-md text-sm" /></div>
              <div className="hidden md:block"></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">New Password</label><input type="password" value={pwdData.new} onChange={e => setPwdData({ ...pwdData, new: e.target.value })} placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-md text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Confirm Password</label><input type="password" value={pwdData.confirm} onChange={e => setPwdData({ ...pwdData, confirm: e.target.value })} placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-md text-sm" /></div>
            </div>
            <button onClick={handleResetPassword} className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 text-sm font-medium flex items-center gap-2"><KeyRound size={16} /> Reset Password</button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Award size={20} className="text-slate-500" /> Teaching Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100"><span className="text-sm text-slate-600">Total Classes</span><span className="font-bold text-slate-900">12</span></div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100"><span className="text-sm text-slate-600">Total Students</span><span className="font-bold text-slate-900">240</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Years Active</span><span className="font-bold text-slate-900">5.2</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};