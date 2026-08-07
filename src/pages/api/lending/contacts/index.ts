import { withApiAuth } from "@/lib/with-api-auth";
import { respondWithError } from "@/server/api-error";
import { createLendingContactSchema } from "@/lib/validations/lending";
import { createLendingContact, listLendingContacts } from "@/server/services/lending";

export default withApiAuth(async (req, res, session) => {
  const userId = session.user.id;

  try {
    if (req.method === "GET") {
      const contacts = await listLendingContacts(userId);
      res.status(200).json({ contacts });
      return;
    }

    if (req.method === "POST") {
      const input = createLendingContactSchema.parse(req.body);
      const contact = await createLendingContact(userId, input);
      res.status(201).json({ contact });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    respondWithError(res, error);
  }
});
