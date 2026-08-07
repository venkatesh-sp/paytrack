import Head from "next/head";
import Link from "next/link";
import { Compass, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <Head>
        <title>Page not found · PayTrack</title>
      </Head>
      <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
        <Compass className="size-7" />
      </span>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
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
