"use client";

import { TemplatesProvider, useTemplates } from "@/components/sections/cms/TemplatesProvider/TemplatesProvider";
import TemplatesFilters from "@/components/sections/cms/TemplatesFilters/TemplatesFilters";
import TemplatesGrid from "@/components/sections/cms/TemplatesGrid/TemplatesGrid";
import s from "./TemplatesPage.module.css";

function TemplatesInner() {
  const { filtered, templates } = useTemplates();
  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>შაბლონები</h1>
        <span className={s.countBadge}>{filtered.length} / {templates.length}</span>
      </div>
      <TemplatesFilters />
      <TemplatesGrid />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <TemplatesProvider>
      <TemplatesInner />
    </TemplatesProvider>
  );
}
