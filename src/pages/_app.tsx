import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorPresetProvider } from "@/components/color-preset-provider";
import { QueryProvider } from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ColorPresetProvider>
        <QueryProvider>
          <TooltipProvider>
            <Component {...pageProps} />
            <Toaster richColors closeButton />
          </TooltipProvider>
        </QueryProvider>
      </ColorPresetProvider>
    </ThemeProvider>
  );
}
