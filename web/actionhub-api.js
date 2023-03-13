/*
  This file interactions with the ActionHub API
*/
import { ActionHubDB } from './actionhub-db.js'

export const ActionHubAPI = {
  program: null,
  ready: null,
  headers: null,

  host: process.env.ACTIONHUB_API_HOST,

  getProgram: async function () {
    await this.ready
    const resource = '/program'
    const url = this.host + resource
    const response = await fetch(url, {
      headers: this.headers
    })
    return await response.json()
  },

  getSegments: async function (segment_basis, min_weight, force_refresh) {
    /*
      get segments
    */
    await this.ready
    const resource = '/segments?'
    const params = new URLSearchParams({
      segment_basis: segment_basis,
      min_weight: min_weight,
      force_refresh: force_refresh
    })
    const url = this.host + resource + params
    const response = await fetch(url, {
      headers: this.headers
    })
    return await response.json()
  },

  getSegment: async function (
    action_types,
    min_weight,
    asset_ids,
    labels,
    segment_type = 'growth',
    force_refresh = false
  ) {
    await this.ready
    const resource = '/segment?'
    const params = new URLSearchParams({
      action_types: action_types,
      min_weight: min_weight,
      asset_ids: asset_ids,
      labels: labels,
      segment_type: segment_type,
      force_refresh: force_refresh
    })
    const url = this.host + resource + params
    console.log(url)
    const response = await fetch(url, {
      headers: this.headers
    })
    return await response.text()
  },

  init: async function (shopName) {
    if (!this.program) {
      this.program = await ActionHubDB.getActionHubProgram({ shopName })
      this.headers = {
        'actionhub-key': this.program.actionhub_key,
        'program-id': this.program.program_id
      }
      this.ready = Promise.resolve()
    }
  }
}
