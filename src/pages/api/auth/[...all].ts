import { toNodeHandler } from "better-auth/node";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = toNodeHandler(auth);

export default async function authHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await handler(req, res);
}
