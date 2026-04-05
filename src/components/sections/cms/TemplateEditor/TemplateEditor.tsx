"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CmsInput from "@/components/ui/CmsInput/CmsInput";
import { CmsTextarea } from "@/components/ui/CmsInput/CmsInput";
import CmsSelect from "@/components/ui/CmsSelect/CmsSelect";
import CmsButton from "@/components/ui/CmsButton/CmsButton";
import { useEditor } from "@/components/sections/cms/EditorProvider/EditorProvider";
import s from "./TemplateEditor.module.css";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <div className={s.editorLoading}>ედიტორი იტვირთება...</div>,
});

const INDUSTRY_OPTIONS = [
  { value: "", label: "აირჩიეთ..." },
  { value: "რესტორანი", label: "რესტორანი" },
  { value: "სასტუმრო", label: "სასტუმრო" },
  { value: "სილამაზის სალონი", label: "სილამაზის სალონი" },
  { value: "სამედიცინო", label: "სამედიცინო" },
  { value: "განათლება", label: "განათლება" },
  { value: "ავტო სერვისი", label: "ავტო სერვისი" },
  { value: "იურიდიული", label: "იურიდიული" },
  { value: "უძრავი ქონება", label: "უძრავი ქონება" },
  { value: "სპორტი / ფიტნესი", label: "სპორტი / ფიტნესი" },
  { value: "საცალო ვაჭრობა", label: "საცალო ვაჭრობა" },
  { value: "ტურიზმი", label: "ტურიზმი" },
  { value: "ტექნოლოგიები", label: "ტექნოლოგიები" },
  { value: "სხვა", label: "სხვა" },
];

export default function TemplateEditor() {
  const { data, setField, saving, loading, save, previewHtml, isEdit } = useEditor();

  if (loading) {
    return <div className={s.loading}>იტვირთება...</div>;
  }

  return (
    <>
      <div className={s.topBar}>
        <Link href="/secure-access/templates" className={s.backBtn}>
          <ArrowLeft size={16} />
          შაბლონები
        </Link>
      </div>

      <div className={s.editor}>
        <div className={s.sidebar}>
          <h2 className={s.sidebarTitle}>
            {isEdit ? "შაბლონის რედაქტირება" : "ახალი შაბლონი"}
          </h2>

          <CmsInput
            label="სახელი *"
            value={data.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="მაგ: რესტორანი Premium"
          />

          <CmsSelect
            label="ინდუსტრია *"
            options={INDUSTRY_OPTIONS}
            value={data.industry}
            onChange={(e) => setField("industry", e.target.value)}
          />

          <CmsTextarea
            label="აღწერა"
            value={data.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
            placeholder="მოკლე აღწერა..."
          />

          <CmsInput
            label="Thumbnail URL"
            value={data.thumbnail_url}
            onChange={(e) => setField("thumbnail_url", e.target.value)}
            placeholder="https://..."
          />

          <div className={s.actions}>
            <CmsButton
              onClick={save}
              loading={saving}
              disabled={!data.name || !data.industry || !data.html_content}
            >
              {isEdit ? "განახლება" : "შენახვა"}
            </CmsButton>
          </div>

          {previewHtml && (
            <div className={s.previewSection}>
              <h3 className={s.previewTitle}>Preview</h3>
              <iframe
                className={s.previewFrame}
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                title="Template Preview"
              />
            </div>
          )}
        </div>

        <div className={s.main}>
          <div className={s.editorHeader}>
            <span className={s.editorLabel}>HTML / Handlebars</span>
            <span className={s.editorHint}>
              ცვლადები: {"{{company_name}}"}, {"{{category}}"}, {"{{phone}}"}, {"{{email}}"}, {"{{address}}"}, {"{{website}}"}
            </span>
          </div>
          <div className={s.monacoWrap}>
            <MonacoEditor
              height="100%"
              language="html"
              theme="vs-dark"
              value={data.html_content}
              onChange={(v) => setField("html_content", v || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
