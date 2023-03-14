import 'dotenv/config';
import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";

import { PostgreSQLSessionStorage } from '@shopify/shopify-app-session-storage-postgresql';

let { restResources } = await import(
  `@shopify/shopify-api/rest/admin/${LATEST_API_VERSION}`
);

const shopify = shopifyApp({
  api: {
    restResources,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: PostgreSQLSessionStorage.withCredentials(
    process.env.AWS_AURORA_DB_HOST,
    process.env.AWS_AURORA_DB_DATABASE,
    process.env.AWS_AURORA_DB_USERNAME,
    process.env.AWS_AURORA_DB_PASSWORD
  ),
});

export default shopify;