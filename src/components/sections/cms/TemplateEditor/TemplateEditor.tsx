"use client";

import dynamic from "next/dynamic";
import { useEditor } from "@/components/sections/cms/EditorProvider/EditorProvider";
import s from "./TemplateEditor.module.css";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <div className={s.editorLoading}>ედიტორი იტვირთება...</div>,
});

const INDUSTRIES = [
  "რესტორანი",
  "სასტუმრო",
  "სილამაზის სალონი",
  "სამედიცინო",
  "განათლება",
  "ავტო სერვისი",
  "იურიდიული",
  "უძრავი ქონება",
  "სპორტი / ფიტნესი",
  "საცალო ვაჭრობა",
  "ტურიზმი",
  "ტექნოლოგიები",
  "სხვა",
];

export default function TemplateEditor() {
  const { data, setField, saving, loading, save, previewHtml, isEdit } = useEditor();

  if (loading) {
    return <div className={s.loading}>იტვირთება...</div>;
  }

  return (
    <div className={s.editor}>
      <div className={s.sidebar}>
        <h2 className={s.sidebarTitle}>
          {isEdit ? "შაბლონის რედაქტირება" : "ახალი შაბლონი"}
        </h2>

        <label className={s.label}>
          სახელი *
          <input
            className={s.input}
            value={data.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="მაგ: რესტორანი Premium"
          />
        </label>

        <label className={s.label}>
          ინდუსტრია *
          <select
            className={s.select}
            value={data.industry}
            onChange={(e) => setField("industry", e.target.value)}
          >
            <option value="">აირჩიეთ...</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </label>

        <label className={s.label}>
          აღწერა
          <textarea
            className={s.textarea}
            value={data.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
            placeholder="მოკლე აღწერა..."
          />
        </label>

        <label className={s.label}>
          Thumbnail URL
          <input
            className={s.input}
            value={data.thumbnail_url}
            onChange={(e) => setField("thumbnail_url", e.target.value)}
            placeholder="https://..."
          />
        </label>

        <div className={s.actions}>
          <button
            className={s.saveBtn}
            onClick={save}
            disabled={saving || !data.name || !data.industry || !data.html_content}
          >
            {saving ? "ინახება..." : isEdit ? "განახლება" : "შენახვა"}
          </button>
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
  );
}
