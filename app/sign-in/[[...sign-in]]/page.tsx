import { redirect } from "next/navigation";

export default function SignInRedirect({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = searchParams.role ?? "customer";
  redirect(`/login?role=${role}`);
}
