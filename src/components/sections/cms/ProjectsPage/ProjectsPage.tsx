"use client";

import { Suspense } from "react";
import { ProjectsProvider } from "@/components/sections/cms/ProjectsProvider/ProjectsProvider";
import ProjectsInbox from "@/components/sections/cms/ProjectsInbox/ProjectsInbox";
import ProjectsChat from "@/components/sections/cms/ProjectsChat/ProjectsChat";
import ProjectsPanel from "@/components/sections/cms/ProjectsPanel/ProjectsPanel";
import s from "./ProjectsPage.module.css";

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsProvider>
        <div className={s.layout}>
          <ProjectsInbox />
          <ProjectsChat />
          <ProjectsPanel />
        </div>
      </ProjectsProvider>
    </Suspense>
  );
}
