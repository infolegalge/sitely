"use client";

import { EditorProvider } from "@/components/sections/cms/EditorProvider/EditorProvider";
import TemplateEditor from "@/components/sections/cms/TemplateEditor/TemplateEditor";

interface EditTemplatePageProps {
  templateId: string;
}

export default function EditTemplatePage({ templateId }: EditTemplatePageProps) {
  return (
    <EditorProvider templateId={templateId}>
      <TemplateEditor />
    </EditorProvider>
  );
}
