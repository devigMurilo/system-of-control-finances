const baseUrls = {
  sandbox: "https://sandbox.belvo.com",
  production: "https://api.belvo.com"
};

type BelvoEnvironment = keyof typeof baseUrls;

function getBelvoConfig() {
  const secretId = process.env.BELVO_SECRET_ID;
  const secretPassword = process.env.BELVO_SECRET_PASSWORD;
  const env = (process.env.BELVO_ENV ?? "sandbox") as BelvoEnvironment;

  if (!secretId || !secretPassword) {
    throw new Error("Belvo credentials are not configured");
  }

  return {
    baseUrl: baseUrls[env] ?? baseUrls.sandbox,
    authorization: `Basic ${Buffer.from(`${secretId}:${secretPassword}`).toString("base64")}`
  };
}

export async function belvoFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const config = getBelvoConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: config.authorization,
      ...init.headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Belvo request failed: ${response.status} ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function createBelvoLink(accessMode = "single") {
  return belvoFetch<{ id: string; access_mode: string }>("/api/links/", {
    method: "POST",
    body: JSON.stringify({ access_mode: accessMode })
  });
}

export function getBelvoWidgetConfig(linkId: string) {
  return {
    callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/belvo/connect`,
    link: linkId
  };
}
