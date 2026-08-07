import { Html, Head, Main, NextScript } from "next/document";

const setColorPresetScript = `
(function () {
  try {
    var preset = window.localStorage.getItem("color-preset");
    if (preset) document.documentElement.setAttribute("data-color-preset", preset);
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: setColorPresetScript }} />
      </Head>
      <body className="antialiased" suppressHydrationWarning>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
