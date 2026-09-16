import { getSupabaseBrowserClient } from "./supabase/client";

export async function getDeliveryDownloadUrl(fileKey: string): Promise<string> {
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sua sessão expirou. Entre novamente para abrir o arquivo.");
  }
  const response = await fetch(`/api/files?key=${encodeURIComponent(fileKey)}`, {
    headers: {
      authorization: `Bearer ${data.session.access_token}`,
      accept: "application/json",
    },
    cache: "no-store",
  });
  const result = await response.json() as { signedUrl?: string; error?: string };
  if (!response.ok || !result.signedUrl) {
    throw new Error(result.error ?? "Não foi possível abrir o arquivo.");
  }
  const url = new URL(result.signedUrl);
  if (url.protocol !== "https:") throw new Error("Endereço de arquivo inválido.");
  return url.href;
}
