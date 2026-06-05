import { redirect } from "next/navigation";
import { normalizeUsername } from "@/lib/creator-profile";

type Props = { params: Promise<{ username: string }> };

/** Legacy URL — canonical public profile is /profile/[username] */
export default async function CreatorRedirectPage({ params }: Props) {
  const { username } = await params;
  redirect(`/profile/${normalizeUsername(username)}`);
}
