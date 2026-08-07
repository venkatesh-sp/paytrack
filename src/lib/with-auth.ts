import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { getServerSession } from "@/lib/session";
import type { Session } from "@/lib/auth";

/**
 * Wraps a page's getServerSideProps so it requires an authenticated session.
 * Unauthenticated requests are redirected to /login with a returnTo param.
 */
export function withAuth<P extends Record<string, unknown>>(
  getProps?: (
    ctx: GetServerSidePropsContext,
    session: Session,
  ) => Promise<GetServerSidePropsResult<P>>,
): GetServerSideProps<P | Record<string, never>> {
  return async (ctx) => {
    const session = await getServerSession(ctx.req);

    if (!session) {
      return {
        redirect: {
          destination: `/login?returnTo=${encodeURIComponent(ctx.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    if (!getProps) {
      return { props: {} };
    }

    return getProps(ctx, session);
  };
}
