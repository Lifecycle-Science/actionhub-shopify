/*
  This file interacts with the app's database
*/
import shopify from "./shopify.js";
import pg from 'pg'

export const ActionHubDB = {
  db: null,
  ready: null,

  getShopifyAccessToken: async function({
    shopName
  }) {
    await this.ready;
    const query = `
      select "accessToken" as access_token 
      from public.shopify_sessions
      where shop = $1
    `
    const results = await this.__query(query, [shopName]);
    return results.rows[0].access_token;
  },

  getActionHubProgram: async function({shopName}) {
    await this.ready;
    const query = `
      select shop_name, program_id, actionhub_key, permissions
      from shops.dim_shops
      where shop_name = $1
    `
    const results = await this.__query(query, [shopName]);
    return results.rows[0];
  },

  createActionHubShop: async function({
    shopName, programId, actionHubKey, permissions
  }) {
    const query = `
    insert into shops.dim_shops (
      shop_name, program_id, actionhub_key, permissions
    )
    values ($1, $2, $3, $4);
    `
    const values = [shopName, programId, actionHubKey, permissions];
    const results = await this.__query(query, values);
    return true;
  },

  startOnboardingStatus: async function(
    shopName, stepId, detail=''
  ) {
    await this.ready;
    const query = `
      insert into shops.fact_onboarding_steps 
      (shop_name, step_id, detail)
      values ($1, $2, $3)
    `
    const values = [shopName, stepId, detail]
    const results = await this.__query(query, values);
    return true;
  },

  endOnboardingStatus: async function(
    shopName, stepId, detail=''
  ) {
    await this.ready;
    const query = `
      update shops.fact_onboarding_steps 
      set ts_complete = current_timestamp, detail = $1
      where shop_name = $2
      and step_id = $3
    `
    const values = [detail, shopName, stepId]
    const results = await this.__query(query, values);
    return true;
  },

  getOnboardingStatus: async function({
    shopName, onboardingStatus,
  }) {
    await this.ready;
    const query = `
      select f.step_id, d.step_message, d.step_progress, f.detail
      from shops.fact_onboarding_steps f
        inner join shops.dim_onboarding_steps d
          ON d.step_id = f.step_id
      where f.shop_name = $1
      order by ts_started DESC
    `
    const values = [shopName]
    const results = await this.__query(query, values);
    const data = results.rows[0]
    return data;
  },

  __query: async function (sql, params=[]) {
    await this.ready;
    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, result) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  },

  init: async function() {
    this.db = this.db ?? new pg.Client({
      user: process.env.AWS_AURORA_DB_USERNAME,
      host: process.env.AWS_AURORA_DB_HOST,
      database: process.env.AWS_AURORA_DB_DATABASE,
      password: process.env.AWS_AURORA_DB_PASSWORD,
      port: 5432,
    });
    await this.db.connect();
    this.ready = Promise.resolve()
  },

  end: async function() {
    await this.db.end()
  }
}
