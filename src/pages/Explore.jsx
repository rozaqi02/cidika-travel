import React from "react";
import data from "../data/packages.json";
import { toIDR } from "../utils/format";

export default function Explore() {
  return (
    <div className="container mt-6 space-y-4">
      <h1 className="text-2xl font-bold">Explore Paket</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {data.map(p => (
          <details key={p.id} className="card p-4">
            <summary className="cursor-pointer font-semibold">{p.title}</summary>
            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <div>
                {p.spots && <>
                  <h4 className="font-medium">Spot Wisata:</h4>
                  <ul className="list-disc ml-5 text-sm">{p.spots.map((s,i)=><li key={i}>{s}</li>)}</ul>
                </>}
                {p.spots_day1 && <>
                  <h4 className="font-medium">Hari 1:</h4>
                  <ul className="list-disc ml-5 text-sm">{p.spots_day1.map((s,i)=><li key={i}>{s}</li>)}</ul>
                  <h4 className="font-medium mt-2">Hari 2:</h4>
                  <ul className="list-disc ml-5 text-sm">{p.spots_day2.map((s,i)=><li key={i}>{s}</li>)}</ul>
                </>}
                {p.snorkeling && <>
                  <h4 className="font-medium mt-2">Spot Snorkeling:</h4>
                  <ul className="list-disc ml-5 text-sm">{p.snorkeling.map((s,i)=><li key={i}>{s}</li>)}</ul>
                </>}
              </div>
              <div>
                {p.include && <>
                  <h4 className="font-medium">Termasuk:</h4>
                  <ul className="list-disc ml-5 text-sm">{p.include.map((s,i)=><li key={i}>{s}</li>)}</ul>
                </>}
                {p.priceTiers && <>
                  <h4 className="font-medium mt-2">Harga per Pax:</h4>
                  <ul className="list-disc ml-5 text-sm">
                    {p.priceTiers.map(([n,price]) => <li key={n}>{n} pax: {toIDR(price)}</li>)}
                  </ul>
                </>}
                {p.note && <p className="text-sm text-slate-500 mt-2">{p.note}</p>}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}