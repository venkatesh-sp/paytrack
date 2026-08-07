import Head from "next/head";
import Link from "next/link";
import { AlertTriangle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ServerErrorPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <Head>
        <title>Something went wrong · PayTrack</title>
      </Head>
      <span className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="size-7" />
      </span>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          An unexpected error occurred on our end. Please try again shortly.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">
          <LayoutDashboard className="size-4" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
