import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [msg, setMsg]       = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(t("admin.login.loggingIn"));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else window.location.replace("/admin");
  };

  return (
    <div className="container mt-10 max-w-md">
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2">{t("admin.login.title")}</h1>
        <form onSubmit={onSubmit} className="grid gap-3">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder={t("admin.login.email")} required />
          <input type="password" value={password} onChange={e=>setPass(e.target.value)} className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder={t("admin.login.password")} required />
          <button className="btn btn-primary">{t("admin.login.submit")}</button>
          {msg && <p className="text-sm text-slate-500">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
