import Shopify from 'shopify-api-node'
import { ActionHubDB } from '../actionhub-db.js'
import { ActionHubAPI } from '../actionhub-api.js'
import { ConvertSegmentDisplayIdToQuery } from './segments.js'

// i don't think i need this...
let programId = ''
let actionHubKey = ''

const shopName = process.env.HOST
process.send('starting segment sync...')
process.send(shopName)

await ActionHubDB.init()
const accessToken = await ActionHubDB.getShopifyAccessToken({ shopName })
const shopify = new Shopify({
  shopName: shopName,
  accessToken: accessToken
})
await ActionHubAPI.init(shopName)

let segments = []

/*
  STEP 1
*/
async function collectCustomersRecords () {
  // log to log_segment_sync_status
  const stepProgressMin = 0 // out of 100 for overall sync progress
  const stepProgressMax = 20 // out of 100 for overall sync progress
  const result = await ActionHubDB.setSegmentSyncStatus(
    shopName,
    'collecting',
    'Collecting segment customers',
    stepProgressMax
  )

  let customersSegments = {}
  for (let i in segments) {
    let segmentId = segments[i]
    let segmentElements = ConvertSegmentDisplayIdToQuery(segmentId)
    let asset_ids = ''
    let labels = ''

    // Set the asset ids and labels according to segment basis
    if (segmentElements.segment_basis == 'asset') {
      asset_ids = segmentElements.segment_basis_id
      labels = ''
    } else {
      labels = segmentElements.segment_basis_id
      asset_ids = ''
    }

    // Get the customer list
    let result = await ActionHubAPI.getSegment(
      segmentElements.action_type,
      segmentElements.min_weight,
      asset_ids,
      labels,
      'growth',
      true
    )
    let segmentsCustomers = result.split('\n')

    console.log(
      segmentElements.segment_basis,
      segmentElements.action_type,
      segmentElements.min_weight,
      asset_ids,
      labels
    )
    console.log(segmentsCustomers)

    for (let ii in segmentsCustomers) {
      let customerId = segmentsCustomers[ii]
      if (typeof customersSegments[customerId] !== 'undefined') {
        customersSegments[customerId] += ',' + segmentId
      } else {
        customersSegments[customerId] = segmentId
      }
    }
  }

  await updateCustomerRecords(customersSegments)
  process.exit()
}

/*
  STEP 2
*/
async function updateCustomerRecords (customersSegments) {
  // log to log_segment_sync_status
  const stepProgressMin = 20 // out of 100 for overall sync progress
  const stepProgressMax = 90 // out of 100 for overall sync progress
  const result = await ActionHubDB.setSegmentSyncStatus(
    shopName,
    'labeling',
    'Labeling customers for segment queries',
    stepProgressMin
  )

  const query = `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          key
          namespace
          value
          createdAt
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }`

  let customerCount = 0
  let metafields = []
  const customerIds = Object.keys(customersSegments)
  for (let customerId of customerIds) {
    let customerSegmentIds = customersSegments[customerId]
    console.log(customerSegmentIds)
    metafields.push({
      key: 'segments',
      namespace: 'actionhub',
      ownerId: `gid://shopify/Customer/${customerId}`,
      type: 'list.single_line_text_field',
      value: JSON.stringify(customerSegmentIds.split(','))
    })
    if (metafields.length == 25) {
      // Update customers
      const response = await shopify.graphql(query, { metafields: metafields })
      metafields = []
      // Log the current step status
      customerCount += 25
      let stepProgress = ((customerCount/customersSegments.length)*(stepProgressMax-stepProgressMin))+stepProgressMin
      const result = await ActionHubDB.setSegmentSyncStatus(
        shopName,
        'labeling',
        `${customerCount} of ${customersSegments.length} customers labeled for segment queries`,
        stepProgress
      )
    }
  }
  if (metafields.length > 0) {
    const response = await shopify.graphql(query, { metafields: metafields })
  }

  // log to log_segment_sync_statys
  //
  await saveSyncedSegments()
  return true
}

/*
  STEP 3
*/
async function saveSyncedSegments () {
  // log to log_segment_sync_status
  const stepProgressMax = 90 // out of 100 for overall sync progress
  let result = await ActionHubDB.setSegmentSyncStatus(
    shopName,
    'saving',
    'Saving segment state',
    stepProgressMax
  )

  result = await ActionHubDB.saveSyncedSegments(shopName, segments)

  // We're done!
  const segment_count = segments.length
  const done = await ActionHubDB.setSegmentSyncStatus(
    shopName,
    'done',
    `Done syncing ${segment_count} segment queries`,
    100
  )
  return true
}

process.on('message', message => {
  segments = message
  collectCustomersRecords()
})
