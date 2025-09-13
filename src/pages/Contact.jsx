import React from "react";
export default function Contact() {
  return (
    <div className="container mt-6 grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <h1 className="text-2xl font-bold mb-2">Contact Us</h1>
        <ul className="space-y-1 text-slate-700 dark:text-slate-200">
          <li><strong>ALAMAT:</strong> Bunga Mekar Nusa Penida, Kabupaten Klungkung, Bali</li>
          <li><strong>EMAIL:</strong> cidikatravel@gmail.com</li>
          <li><strong>WA/TLP:</strong> +62 8952 3949 667</li>
          <li><strong>IG:</strong> @cidikatravel</li>
        </ul>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Form Cepat</h2>
        <p className="text-sm text-slate-500">Form ini contoh; di produksi arahkan ke WhatsApp/Email.</p>
        <form className="grid gap-2 mt-2">
          <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Nama" />
          <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Email/WA" />
          <textarea className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Pesan" rows="4" />
          <button className="btn btn-primary">Kirim</button>
        </form>
      </div>
    </div>
  );
}