/*
  This file interacts with the app's database and is used by the app's REST APIs.
*/

import shopify from "./shopify.js";
import pg from 'pg'

export const ActionHubDB = {
  db: null,
  ready: null,

  startOnboardingStatus: async function({
    shopName, stepId,
  }) {
    await this.ready;
    const query = `
      insert into shops.fact_onboarding_steps 
      (shop_name, step_id)
      values ($1, $2)
    `
    const values = [shopName, stepId]
    const results = await this.__query(query, values);
    return true;
  },

  endOnboardingStatus: async function({
    shopName, stepId,
  }) {
    await this.ready;
    const query = `
      update shops.fact_onboarding_steps 
      set ts_complete = current_timestamp
      where shop_name = $1
      and step_id = $2
    `
    const values = [shopName, stepId]
    const results = await this.__query(query, values);
    return true;
  },

  getOnboardingStatus: async function({
    shopName, onboardingStatus,
  }) {
    await this.ready;
    const query = `
      select f.step_id, d.step_message, d.step_progress
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

  getTime: async function() {
    await this.ready;
    const query = "SELECT NOW() as now";
    const results = await this.__query(query); 
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
