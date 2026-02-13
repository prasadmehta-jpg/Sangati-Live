"use client";

import { useState, useEffect } from "react";

function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const colors = { success: "#29F58C", error: "#FF495C", info: "#2EE4FF" };
  const el = document.createElement("div");
  el.textContent = message;
  el.style.cssText = `position:fixed;bottom:2rem;right:2rem;padding:1rem 1.5rem;background:${colors[type]};color:black;border-radius:.5rem;z-index:1000;font-weight:bold`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function Login({
  open,
  close,
  login,
}: {
  open: boolean;
  close: () => void;
  login: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="glass w-full max-w-sm p-10 rounded-2xl text-center">
        <h2 className="text-3xl serif text-white mb-8">Admin Access</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (username === "prasadmehta" && password === "admin888") {
              login();
            } else {
              showToast("Access Denied", "error");
            }
          }}
          className="space-y-6"
        >
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 rounded-lg bg-white/5 border border-white/10 focus:border-[#FF7F50] outline-none text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-lg bg-white/5 border border-white/10 focus:border-[#FF7F50] outline-none text-white"
            required
          />
          <button
            type="submit"
            className="w-full py-5 px-12 bg-[#FF7F50] hover:bg-[#ff6b36] transition-all rounded-xl text-white uppercase tracking-widest font-bold"
          >
            Enter System
          </button>
        </form>
      </div>
    </div>
  );
}

interface Win {
  e: string;
  t: string;
  v: string;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [load, setLoad] = useState({ grill: 72, prep: 45, pack: 88, assembly: 63 });
  const [wins, setWins] = useState<Win[]>([
    { e: "Auto-nuked Pack jam", t: "Just now", v: "₹150" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoad((prev) => {
        const next = { ...prev };
        if (next.pack > 85) {
          next.pack = Math.max(40, next.pack - 30);
          setWins((w) => [
            { e: "Auto-nuked Pack jam", t: "Just now", v: "₹150" },
            ...w,
          ]);
          showToast("AI fixed Pack jam", "success");
        }
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (level: number) => {
    if (level >= 85) return "border-red-500";
    if (level >= 70) return "border-yellow-500";
    return "border-green-500";
  };

  const getStatusText = (level: number) => {
    if (level >= 85) return { label: "JAM", color: "text-red-400" };
    if (level >= 70) return { label: "WATCH", color: "text-yellow-400" };
    return { label: "SMOOTH", color: "text-green-400" };
  };

  return (
    <div className="min-h-screen p-8">
      <header className="glass p-6 mb-8 flex justify-between items-center rounded-xl">
        <h1 className="text-4xl serif text-white">Sangati Admin</h1>
        <button
          onClick={onLogout}
          className="px-8 py-3 border border-[#FF7F50] text-[#FF7F50] hover:bg-[#FF7F50] hover:text-black rounded-lg transition"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(load).map(([station, level]) => {
          const status = getStatusText(level);
          return (
            <div
              key={station}
              className={`glass rounded-xl p-6 text-center border-t-4 ${getStatusColor(level)}`}
            >
              <h3 className="capitalize text-xl mb-2">{station}</h3>
              <p className="text-5xl font-bold">{level}%</p>
              <p className={`text-sm mt-2 ${status.color}`}>{status.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-12">
        <h2 className="text-3xl serif text-white mb-6">AI Wins Today</h2>
        {wins.map((w, i) => (
          <div
            key={i}
            className="glass p-4 rounded-lg mb-4 border-l-4 border-green-500"
          >
            <p>{w.e}</p>
            <p className="text-xs text-slate-400">
              {w.t} &bull;{" "}
              <span className="text-green-400 font-bold">+{w.v}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (isLoggedIn) {
    return <Dashboard onLogout={() => setIsLoggedIn(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-[#050810] to-[#0a0f1e]">
      <h1 className="text-6xl md:text-8xl serif text-white mb-8">Sangati</h1>
      <p className="text-2xl text-slate-400 mb-12">One AI. Total Harmony.</p>
      <button
        onClick={() => setShowLogin(true)}
        className="px-16 py-6 bg-[#FF7F50] hover:bg-[#ff6b36] text-white text-2xl rounded-xl uppercase tracking-widest font-bold transition-all"
      >
        Admin Login
      </button>
      <Login
        open={showLogin}
        close={() => setShowLogin(false)}
        login={() => setIsLoggedIn(true)}
      />
    </div>
  );
}
