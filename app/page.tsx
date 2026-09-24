import { redirect } from "next/navigation";

import { getSession } from "@/lib/data/session";

export default async function Page() {
  const session = await getSession();
  redirect(session ? "/today" : "/sign-in");
}
