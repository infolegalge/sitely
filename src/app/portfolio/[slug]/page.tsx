import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FEATURED_PROJECTS } from "@/lib/constants";
import { PORTFOLIO_PROJECTS } from "@/lib/portfolio-projects";
import ProjectDetail from "./ProjectDetail";

const ALL_PROJECTS = [...FEATURED_PROJECTS, ...PORTFOLIO_PROJECTS];

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return ALL_PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = ALL_PROJECTS.find((p) => p.slug === slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: `${project.title} — Sitely`,
    description: project.description ?? `${project.title} case study`,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = ALL_PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
