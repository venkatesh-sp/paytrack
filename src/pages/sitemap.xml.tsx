import type { GetServerSideProps } from "next";

const PUBLIC_PATHS = ["", "/login", "/register", "/forgot-password"];

export default function Sitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://paytrack.app";

  const urls = PUBLIC_PATHS.map(
    (path) => `  <url><loc>${baseUrl}${path}</loc></url>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.write(xml);
  res.end();

  return { props: {} };
};
