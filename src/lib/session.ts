import { fromNodeHeaders } from "better-auth/node";
import type { GetServerSidePropsContext, NextApiRequest } from "next";
import { auth, type Session } from "@/lib/auth";

export async function getServerSession(
  req: NextApiRequest | GetServerSidePropsContext["req"],
): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return session as Session | null;
}
