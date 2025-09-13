import React from "react";
export default function FAQ() {
  const faqs = [
    ["Bagaimana cara booking?", "Tambah paket ke keranjang lalu Checkout, atau hubungi kontak kami."],
    ["Apakah private tour?", "Ya, semua paket bersifat private (tidak digabung)."],
    ["Bisa custom itinerary?", "Bisa, silakan sebutkan preferensi Anda saat menghubungi kami."]
  ];
  return (
    <div className="container mt-6">
      <h1 className="text-2xl font-bold mb-4">FAQ</h1>
      <div className="space-y-3">
        {faqs.map(([q,a],i)=>(
          <details key={i} className="card p-4">
            <summary className="font-medium cursor-pointer">{q}</summary>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}