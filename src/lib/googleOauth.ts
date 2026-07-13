export interface PkcePair {
  verifier: string;
  challenge: string;
}

export interface AuthUrlParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
}

export interface TokenExchangePayload {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface RefreshPayload {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function generatePkce(): Promise<PkcePair> {
  const verifierBytes = new Uint8Array(64);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64url(verifierBytes);

  const encoder = new TextEncoder();
  const challengeBytes = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  const challenge = base64url(new Uint8Array(challengeBytes));

  return { verifier, challenge };
}

export function buildAuthUrl(params: AuthUrlParams): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

export function parseRedirectUri(uri: string): {
  code?: string;
  error?: string;
  state?: string;
} {
  try {
    const url = new URL(uri);
    const code = url.searchParams.get("code") ?? undefined;
    const error = url.searchParams.get("error") ?? undefined;
    const state = url.searchParams.get("state") ?? undefined;
    return { code, error, state };
  } catch {
    return {};
  }
}

export function buildTokenExchangePayload(
  params: TokenExchangePayload,
): URLSearchParams {
  return new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
    grant_type: "authorization_code",
  });
}

export function buildRefreshPayload(
  params: RefreshPayload,
): URLSearchParams {
  return new URLSearchParams({
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "refresh_token",
  });
}
