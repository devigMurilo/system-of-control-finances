import { PluggyClient } from "pluggy-sdk";

const clientId = process.env.PLUGGY_CLIENT_ID;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error("Pluggy credentials are not configured");
}

export const pluggyClient = new PluggyClient({
  clientId,
  clientSecret,
});
