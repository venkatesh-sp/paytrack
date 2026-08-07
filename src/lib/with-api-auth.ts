import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@/lib/session";
import type { Session } from "@/lib/auth";

export type AuthedApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session,
) => Promise<void> | void;

/**
 * Wraps an API route handler so it requires an authenticated session. The
 * authenticated user id is derived from the server-side session only — never
 * from client-supplied request data.
 */
export function withApiAuth(handler: AuthedApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req);

    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await handler(req, res, session);
  };
}
