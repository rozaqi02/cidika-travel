import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, packages: 0, contents: 0 });

  useEffect(() => {
    (async () => {
      const { count: o } = await supabase.from("orders").select("*", { count: "exact", head: true });
      const { count: p } = await supabase.from("packages").select("*", { count: "exact", head: true });
      const { count: c } = await supabase.from("page_content").select("*", { count: "exact", head: true });
      setStats({ orders: o||0, packages: p||0, contents: c||0 });
    })();
  }, []);

  return (
    <div className="container mt-6 grid md:grid-cols-3 gap-4">
      {Object.entries(stats).map(([k,v]) => (
        <div key={k} className="card p-4">
          <p className="text-slate-500 capitalize">{k}</p>
          <p className="text-3xl font-bold">{v}</p>
        </div>
      ))}
    </div>
  );
}