/*
  This file interacts with the app's database
*/
import shopify from './shopify.js'
import pg from 'pg'
import format from 'pg-format'

export const ActionHubDB = {
  db: null,
  ready: null,

  getShopifyAccessToken: async function ({ shopName }) {
    await this.ready
    const query = `
      select "accessToken" as access_token 
      from public.shopify_sessions
      where shop = $1
    `
    const results = await this.__query(query, [shopName])
    return results.rows[0].access_token
  },

  getActionHubProgram: async function ({ shopName }) {
    await this.ready
    const query = `
      select shop_name, program_id, actionhub_key, permissions
      from shops.dim_shops
      where shop_name = $1
    `
    const results = await this.__query(query, [shopName])
    return results.rows[0]
  },

  createActionHubShop: async function ({
    shopName,
    programId,
    actionHubKey,
    permissions
  }) {
    const query = `
    insert into shops.dim_shops (
      shop_name, program_id, actionhub_key, permissions
    )
    values ($1, $2, $3, $4);
    `
    const values = [shopName, programId, actionHubKey, permissions]
    const results = await this.__query(query, values)
    return true
  },

  /*
    SEGMENT SYNC METHODS
  */

  setSegmentSyncStatus: async function (
    shopName,
    syncStatus,
    details,
    progress
  ) {
    await this.ready
    const query = `
      insert into shops.log_segment_sync_status 
      (shop_name, sync_status, details, progress)
      values
      ($1, $2, $3, $4)
    `
    const values = [shopName, syncStatus, details, progress]
    const results = await this.__query(query, values)
    return true
  },

  getSegmentSyncStatus: async function (shopName) {
    await this.ready
    const query = `
      select shop_name, sync_status, details, progress, ts_logged
      from shops.log_segment_sync_status
      where shop_name = $1
      order by ts_logged DESC
      limit 1
    `
    const values = [shopName]
    const results = await this.__query(query, values)
    const data = results.rows[0]
    return data
  },

  saveSyncedSegments: async function (shopName, segments) {
    await this.ready

    // Delete exising segments
    let query = `
      delete from shops.fact_segments_synced 
      where shop_name = $1
    `
    let values = [shopName]
    let results = await this.__query(query, values)

    // Insert new segments
    values = []
    for (let i in segments) {
      values.push([shopName, segments[i]])
    }
    console.log("values")
    console.log(values)

    query = format(
      'insert into shops.fact_segments_synced  (shop_name, segment_display_id) values %L',
      values)
    console.log(query)
    results = await this.__query(query)
    return true
  },

  getSyncedSegments: async function (shopName) {
    await this.ready
    const query = `
      select shop_name, segment_display_id, ts_synced
      from shops.fact_segments_synced
      where shop_name = $1
      order by segment_display_id
    `
    const values = [shopName]
    const results = await this.__query(query, values)
    return results.rows
  },

  /*
    ONBOARDING METHODS
  */

  setOnboardingStatus: async function (shopName, stepId, detail = '') {
    await this.ready
    const query = `
      insert into shops.fact_onboarding_steps 
      (shop_name, step_id, detail)
      values ($1, $2, $3)
    `
    const values = [shopName, stepId, detail]
    const results = await this.__query(query, values)
    return true
  },

  getOnboardingStatus: async function ({ shopName, onboardingStatus }) {
    await this.ready
    const query = `
      select f.step_id, d.step_message, d.step_progress, f.detail
      from shops.fact_onboarding_steps f
        inner join shops.dim_onboarding_steps d
          ON d.step_id = f.step_id
      where f.shop_name = $1
      order by ts_started DESC
      limit 1
    `
    const values = [shopName]
    const results = await this.__query(query, values)
    const data = results.rows[0]
    return data
  },

  /*
    GENERIC METHODS
  */

  __query: async function (sql, params = []) {
    await this.ready
    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, result) => {
        if (err) {
          console.log(err)
          reject(err)
          return
        }
        resolve(result)
      })
    })
  },

  init: async function () {
    this.db =
      this.db ??
      new pg.Client({
        user: process.env.AWS_AURORA_DB_USERNAME,
        host: process.env.AWS_AURORA_DB_HOST,
        database: process.env.AWS_AURORA_DB_DATABASE,
        password: process.env.AWS_AURORA_DB_PASSWORD,
        port: 5432
      })
    await this.db.connect()
    this.ready = Promise.resolve()
  },

  end: async function () {
    await this.db.end()
  }
}
