import React from "react";
import { Link } from "react-router-dom";
import { Compass, MessageCircle, Search } from "lucide-react";

export default function EmptyState({
  icon: Icon = Search,
  title,
  description,
  actionLabel,
  actionTo = "/contact",
  onAction,
  secondaryHref = "https://wa.me/62895630193926",
  secondaryLabel,
}) {
  return (
    <div className="col-span-full rounded-3xl border border-dashed border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-white to-amber-50/50 px-6 py-16 text-center dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {actionLabel ? (
          onAction ? (
            <button type="button" onClick={onAction} className="btn btn-primary rounded-full px-6 py-2.5">
              {actionLabel}
            </button>
          ) : (
            <Link to={actionTo} className="btn btn-primary rounded-full px-6 py-2.5">
              {actionLabel}
            </Link>
          )
        ) : null}
        {secondaryLabel ? (
          <a
            href={secondaryHref}
            target="_blank"
            rel="noreferrer"
            className="btn btn-wa inline-flex items-center gap-2 rounded-full px-6 py-2.5"
          >
            <MessageCircle size={16} />
            {secondaryLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function ExploreEmptyState({ t, onReset }) {
  return (
    <EmptyState
      icon={Compass}
      title={t("explore.empty", { defaultValue: "No packages found." })}
      description={t("explore.emptyHint", {
        defaultValue: "Try adjusting your search or filters.",
      })}
      actionLabel={t("explore.resetFilters", { defaultValue: "Reset filters" })}
      onAction={onReset}
      secondaryLabel={t("footer.cta.whatsapp", { defaultValue: "Chat on WhatsApp" })}
    />
  );
}