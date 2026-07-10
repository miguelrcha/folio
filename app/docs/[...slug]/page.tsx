import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getDocsSource } from "@/lib/source";
import { getMDXComponents } from "@/components/mdx";
import { getServerLanguage } from "@/lib/i18n/server";

export default async function Page(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;
  const lang = await getServerLanguage();
  const source = getDocsSource(lang);
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
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  // Slugs are the same for every language — both MDX collections mirror
  // the same filenames — so the English source is enough to enumerate them.
  return getDocsSource("en").generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const lang = await getServerLanguage();
  const page = getDocsSource(lang).getPage(params.slug);
  if (!page) notFound();

  return {
    title: `Folio | ${page.data.title}`,
    description: page.data.description,
  };
}
