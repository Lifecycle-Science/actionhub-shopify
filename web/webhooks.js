import { DeliveryMethod } from "@shopify/shopify-api";
import { ActionHubDB } from "./actionhub-db.js";


/*
These webhooks are in additon the webhooks contained in the gdpr.js file

For topic details see: 
https://shopify.dev/docs/api/admin-rest/2023-01/resources/webhook#event-topics
*/

export default {
  /**
   * Occurs whenever a shop has uninstalled the app.
   */
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      // see docs for payload description
      const payload = JSON.parse(body);
      ActionHubDB.logWebhookCall(topic, shop, payload, webhookId)

      // TODO: delete app stuff
    },
  },

  /**
   * Occurs whenever an order is created.
   */
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      // see docs for payload description
      const payload = JSON.parse(body);
      ActionHubDB.logWebhookCall(topic, shop, payload, webhookId)
      // TODO: log the event (and recalc actions)
    },
  },

  /**
   * Occurs whenever a product is created.
   */
   PRODUCTS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      // see docs for payload description
      const payload = JSON.parse(body);
      ActionHubDB.logWebhookCall(topic, shop, payload, webhookId)
      // TODO: create the asset and labels
    },
  },

  /**
   * Occurs whenever a product is updated.
   */
   PRODUCTS_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      // see docs for payload description
      const payload = JSON.parse(body);
      ActionHubDB.logWebhookCall(topic, shop, payload, webhookId)
      // TODO: update the asset name and labels
    },
  },

};

