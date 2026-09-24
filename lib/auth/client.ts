import { createAuthClient } from "better-auth/react";

/** Browser client. Requests stay on this origin; the server holds the secrets. */
export const authClient = createAuthClient();
