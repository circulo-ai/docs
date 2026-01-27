import { getSource } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/mdx-components";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";

type DocsPageProps = {
  params: { slug?: string[] } | Promise<{ slug?: string[] }>;
};

export default async function Page(props: DocsPageProps) {
  const params = await props.params;
  if (!params.slug || params.slug.length === 0) {
    return (
      <DocsPage>
        <DocsTitle>Documentation</DocsTitle>
        <DocsDescription>
          Select a service and version to get started.
        </DocsDescription>
        <DocsBody>
          <p>Use the sidebar to navigate documentation.</p>
        </DocsBody>
      </DocsPage>
    );
  }

  const source = await getSource();
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const source = await getSource();
  return source.generateParams();
}

export async function generateMetadata(
  props: DocsPageProps,
): Promise<Metadata> {
  const params = await props.params;
  if (!params.slug || params.slug.length === 0) {
    return {
      title: "Documentation",
      description: "Browse services and versions.",
    };
  }
  const source = await getSource();
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
