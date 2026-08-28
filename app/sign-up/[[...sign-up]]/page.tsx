import { redirect } from "next/navigation";

export default function SignUpRedirect({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = searchParams.role ?? "customer";
  redirect(`/login?role=${role}&mode=sign-up`);
}
