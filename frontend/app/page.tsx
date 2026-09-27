"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, removeToken } from "@/lib/auth";
import AttendanceDashboard from "./Pages/AttendanceDashboard"; // Make sure this path is correct!

export default function Home() {
  const router = useRouter();
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Check if the user has a login token saved in their browser
    const token = getToken();
    
    if (!token) {
      // If no token, force them to the login page immediately
      router.replace("/login");
    } else {
      // If token exists, allow them to see the dashboard
      setShowDashboard(true);
    }
  }, [router]);

  // While checking for the token, show a loading message
  if (!showDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading AttendTrack...</p>
      </div>
    );
  }

  // If they are logged in, show the Dashboard
  return <AttendanceDashboard />;
}