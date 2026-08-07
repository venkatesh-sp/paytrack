import type { NextApiResponse } from "next";
import { ZodError } from "zod";
import { NotFoundError, ValidationError } from "@/server/errors";

export function respondWithError(res: NextApiResponse, error: unknown) {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid input", details: error.flatten() });
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Something went wrong" });
}
