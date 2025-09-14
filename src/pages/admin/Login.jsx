import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";

export default function Login() {
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [msg, setMsg]         = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("Logging in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else window.location.replace("/admin"); // langsung ke Dashboard
  };

  return (
    <div className="container mt-10 max-w-md">
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2">Admin Login</h1>
        <form onSubmit={onSubmit} className="grid gap-3">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Email" required />
          <input type="password" value={password} onChange={e=>setPass(e.target.value)} className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Password" required />
          <button className="btn btn-primary">Login</button>
          {msg && <p className="text-sm text-slate-500">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
