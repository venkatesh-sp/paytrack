import { useRef, useState, type ChangeEvent } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

export function ExportLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="outline" asChild>
      <a href={href}>
        <Download className="size-4" />
        {label}
      </a>
    </Button>
  );
}

export function ImportFileButton({
  label,
  onImport,
  describeResult,
}: {
  label: string;
  onImport: (data: unknown) => Promise<unknown>;
  /** Turns the mutation's result into the toast's success message. */
  describeResult: (result: unknown) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file afterward

    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON.");
      }
      const result = await onImport(data);
      toast.success(describeResult(result));
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Import failed — check the file and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {label}
      </Button>
    </>
  );
}
