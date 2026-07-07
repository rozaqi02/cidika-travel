import React from "react";
import { Check } from "lucide-react";

export default function StepIndicator({ steps = [], current = 0 }) {
  return (
    <ol className="flex w-full min-w-0 items-center justify-center gap-1.5 sm:gap-4">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex min-w-0 items-center gap-1.5 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-9 sm:w-9 ${
                  done
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : active
                      ? "bg-sky-600 text-white shadow-md shadow-sky-500/30 ring-2 ring-sky-500/20 sm:ring-4"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {done ? <Check size={16} /> : index + 1}
              </div>
              <span
                className={`hidden text-[10px] font-semibold uppercase tracking-wider sm:block ${
                  active ? "text-sky-600 dark:text-sky-400" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={`h-0.5 w-4 flex-shrink-0 rounded-full sm:w-12 ${
                  index < current ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}