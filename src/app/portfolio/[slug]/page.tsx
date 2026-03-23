import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FEATURED_PROJECTS } from "@/lib/constants";
import ProjectDetail from "./ProjectDetail";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return FEATURED_PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = FEATURED_PROJECTS.find((p) => p.slug === slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: `${project.title} — Sitely`,
    description: project.description ?? `${project.title} case study`,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = FEATURED_PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
