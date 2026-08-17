import { mobileEnv } from '@/config/env';

type JsonBody = Record<string, unknown>;

export async function meutccRequest<T>(
  path: string,
  accessToken: string,
  options: { method?: 'GET' | 'POST'; body?: JsonBody } = {},
) {
  const response = await fetch(`${mobileEnv.apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Não foi possível concluir a operação.');
  return data;
}
