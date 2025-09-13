import React from "react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800">
      <div className="container py-10 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 className="font-semibold mb-2">CIDIKA TRAVEL&TOUR</h3>
          <p>PAKET TRIP NUSA PENIDA ISLAND TOUR & SNORKELING</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Contact Us</h4>
          <ul className="space-y-1">
            <li><strong>ALAMAT:</strong> Bunga Mekar Nusa Penida, Kabupaten Klungkung, Bali</li>
            <li><strong>EMAIL:</strong> cidikatravel@gmail.com</li>
            <li><strong>WA/TLP:</strong> +62 8952 3949 667</li>
            <li><strong>IG:</strong> @cidikatravel</li>
          </ul>
        </div>
        <div>
          <p className="text-slate-500">&copy; {new Date().getFullYear()} CIDIKA TRAVEL&TOUR. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}