"use client";

import { TemplatesProvider } from "@/components/sections/cms/TemplatesProvider/TemplatesProvider";
import TemplatesGrid from "@/components/sections/cms/TemplatesGrid/TemplatesGrid";
import s from "./TemplatesPage.module.css";

export default function TemplatesPage() {
  return (
    <TemplatesProvider>
      <div className={s.page}>
        <h1 className={s.title}>შაბლონები</h1>
        <TemplatesGrid />
      </div>
    </TemplatesProvider>
  );
}
