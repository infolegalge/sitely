"use client";

import { EditorProvider } from "@/components/sections/cms/EditorProvider/EditorProvider";
import TemplateEditor from "@/components/sections/cms/TemplateEditor/TemplateEditor";

export default function NewTemplatePage() {
  return (
    <EditorProvider>
      <TemplateEditor />
    </EditorProvider>
  );
}
