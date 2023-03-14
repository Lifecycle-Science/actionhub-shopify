import { ActionHubDB } from '../actionhub-db.js'
import Shopify from 'shopify-api-node'

/*
 These enum values match the step_id(s) in the 
 onboarding database
*/
const OnboardingStep = {
  CreateProgram: 'create_program',
  CreateMetaFields: 'create_metafields',
  ImportProducts: 'import_products',
  ImportOrders: 'import_orders',
  GenerateGlobals: 'generate_globals',
  GenerateActions: 'generate_actions',
  Complete: 'complete',
  WarningNoProducts: 'warning_no_products',
  WarningNoOrders: 'warning_no_orders',
  ErrorOrders: `error_orders`,
  ErrorAssets: `error_assets`
}

let programId = ''
let actionHubKey = ''

const shopName = process.env.HOST
process.send('starting onboarding:' + shopName)

let accessToken = ''
try {
  accessToken = await ActionHubDB.getShopifyAccessToken({ shopName })
} catch (error) {
  console.log(error)
  process.exit()
}
const shopify = new Shopify({
  shopName: shopName,
  accessToken: accessToken
})

await createProgram()

/*
  STEP 1
*/
async function createProgram () {
  /*
    Create a new program on the ActionHub platform.
  */
  // Log status
  await ActionHubDB.setOnboardingStatus(shopName, OnboardingStep.CreateProgram)

  const program = await ActionHubDB.getActionHubProgram({ shopName })
  if (!program) {
    // create program using actionhub api
    let new_program = {
      program_name: shopName,
      high_engagement_threshold: 3,
      event_relevance_decay: 365,
      action_weight_floor: 0,
      description: 'Shopify shop: ' + shopName
    }
    console.log(JSON.stringify(new_program))

    /*
      This is the only function that should require the ADMIN credentials
    */
    const resource = '/programs'
    const url = process.env.ACTIONHUB_API_HOST + resource
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'actionhub-key': process.env.ACTIONHUB_API_ADMIN_KEY,
        'program-id': process.env.ACTIONHUB_API_ADMIN_PROGRAM_ID
      },
      body: JSON.stringify(new_program)
    })

    // create program record in shops db
    // populate program_id and api_key
    const data = await response.json()

    programId = data.program_id
    actionHubKey = data.api_key
    const permissions = process.env.SCOPES

    await ActionHubDB.createActionHubShop({
      shopName,
      programId,
      actionHubKey,
      permissions
    })
  } else {
    // use the program details we got
    console.log(program)
    programId = program.program_id
    actionHubKey = program.actionhub_key
  }
  // Next step
  await createMetafields()
  return true
}

/*
STEP 2
*/
async function createMetafields () {
  /*
    Create the metafields that will hold the ActionHub segments
  */
  // Log status
  await ActionHubDB.setOnboardingStatus(
    shopName,
    OnboardingStep.CreateMetaFields
  )

  // Send the GraphQL query...
  const query = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
        }
        userErrors {
          field
          message
          code
        }
      }
    } `
  const variables = {
    definition: {
      name: 'ActionHub Segments',
      namespace: 'actionhub',
      key: 'segments',
      description: 'ActionHub Segments',
      type: 'list.single_line_text_field',
      ownerType: 'CUSTOMER'
    }
  }
  const response = await shopify.graphql(query, variables)

  // Next step
  await imoprtProducts()
  return true
}

/*
STEP 3
*/
async function imoprtProducts () {
  /*
    Create assets in ActionHub from shop products.
    Products include tags.
  */
  // Log status
  await ActionHubDB.setOnboardingStatus(shopName, OnboardingStep.ImportProducts)

  // read the products from Shopify
  const products = await shopify.product.list()
  if (products.length == 0) {
    // Can't go on if there are no products
    await ActionHubDB.setOnboardingStatus(
      shopName,
      OnboardingStep.WarningNoProducts
    )
    Promise.resolve()
    return false
  }

  // Build the body for posting to ActionHub
  const assets = []
  for (const product of products) {
    const assetId = product.id
    const assetName = product.title
    const tags = product.tags.split(',')
    const asset = {
      asset_id: assetId,
      asset_name: assetName,
      labels: tags
    }
    assets.push(asset)
  }

  // Write the assets to ActionHub API
  const new_assets = {
    assets: assets
  }
  const resource = '/assets'
  const url = process.env.ACTIONHUB_API_HOST + resource
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'actionhub-key': actionHubKey,
      'program-id': programId
    },
    body: JSON.stringify(new_assets)
  })
  if (response.status !== 200) {
    // Log the error
    const data = await response.json()
    await ActionHubDB.setOnboardingStatus(
      shopName,
      OnboardingStep.ErrorAssets,
      data.detail
    )
    return false
  }

  // Next step
  await importOrders()
  return true
}

/*
STEP 4
*/
async function importOrders () {
  /*
    Import orders from Shopify and post to ActionHub as events
  */
  // Log status
  await ActionHubDB.setOnboardingStatus(shopName, OnboardingStep.ImportOrders)

  // Read the orders from Shopify
  const orders = await shopify.order.list()
  if (orders.length == 0) {
    // Can't go on if there are no orders
    await ActionHubDB.setOnboardingStatus(
      shopName,
      OnboardingStep.WarningNoOrders
    )
    return false
  }

  // Build out the events from the orders
  let events = []
  for (const order of orders) {
    for (const item in order.line_items) {
      const event = {
        user_id: order.customer.id,
        event_timestamp: order.created_at,
        event_type: 'buy',
        asset_id: order.line_items[item].product_id,
        labels: order.tags.split(',')
      }
      events.push(event)
    }
    const query = `
    {
      order(id: "gid://shopify/Order/${order.id}") {
        id
        customerJourneySummary {
          firstVisit {
            landingPage 
            referrerUrl 
            source 
            sourceType
            occurredAt 
          }
          lastVisit {
            landingPage 
            referrerUrl 
            source 
            sourceType
            occurredAt 
          }
          ready 
        }
      }
    }`
    const response = await shopify.graphql(query)
    if (response.order.customerJourneySummary.firstVisit) {
      // Get last visit as event
      console.log(response.order.customerJourneySummary.firstVisit)
      const journey = response.order.customerJourneySummary
      const event = {
        user_id: order.customer.id,
        event_timestamp: journey.firstVisit.occurredAt,
        event_type: 'visit',
        asset_id: journey.firstVisit.landingPage,
        labels: order.tags.split(',')
      }
      events.push(event)
    }
    if (response.order.customerJourneySummary.lastVisit) {
      // Get last visit as event
      console.log(response.order.customerJourneySummary.lastVisit)
      const journey = response.order.customerJourneySummary
      const event = {
        user_id: order.customer.id,
        event_timestamp: journey.lastVisit.occurredAt,
        event_type: 'visit',
        asset_id: journey.lastVisit.landingPage,
        labels: order.tags.split(',')
      }
      events.push(event)
    }
    if (events.length >= 100) {
      const result = await __postEvents(events)
      if (!result) {
        return false
      }
      // Clear for next round
      events = []
    }
  }

  if (events.length > 0) {
    const result = await __postEvents(events)
    if (!result) {
      return false
    }
  }

  // Next step
  await generateGraphs()
  // Done! Log it!
  process.exit()
}

/*
  STEP 5/6
*/
function generateGraphs () {
  // Log status (not waiting)
  ActionHubDB.setOnboardingStatus(shopName, OnboardingStep.GenerateGlobals)

  // Gonna make some API calls
  const headers = {
    'Content-Type': 'application/json',
    'actionhub-key': actionHubKey,
    'program-id': programId
  }

  return new Promise((resolve, reject) => {
    // Start the rebase (not waiting)
    const url = process.env.ACTIONHUB_API_HOST + '/program/rebase'
    console.log(url)
    fetch(url, {
      method: 'PUT',
      headers: headers
    })
      .then(response => response.json())
      .then(rebase_data => {
        console.log(rebase_data)
        // Rebase started, now check status
        let programStatus = 'none'
        let intervalId = setInterval(function () {
          // Check API for the updates
          fetch(process.env.ACTIONHUB_API_HOST + '/program/status', {
            method: 'GET',
            headers: headers
          })
            .then(response => response.json())
            .then(data => {
              console.log("status: " + data?.status_id)
              if (data?.status_id !== programStatus) {
                if (
                  data?.status_id.startsWith('program_user_graph') &&
                  !programStatus.startsWith('program_user_graph')
                ) {
                  ActionHubDB.setOnboardingStatus(
                    shopName,
                    OnboardingStep.GenerateActions
                  )
                }
                programStatus = data.status_id
              }

              if (data?.status_id == 'program_user_graph_complete') {
                console.log("finishing...")
                ActionHubDB.setOnboardingStatus(
                  shopName,
                  OnboardingStep.Complete
                ).then(() => {
                  console.log("DONE!!!")
                  clearInterval(intervalId)
                  resolve(data)  
                })
              }
            })
        }, 1000)
      })
  })
}

process.on('message', message => {})

async function __postEvents (events) {
  // Prepare for the API calls
  const params = new URLSearchParams({
    queue_updates: false,
    process_user_actions: false
  })
  const resource = '/events?'
  const url = process.env.ACTIONHUB_API_HOST + resource + params

  // POST the events
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'actionhub-key': actionHubKey,
      'program-id': programId
    },
    // body: JSON.stringify({events: events})
    body: JSON.stringify({ events: events })
  })
  if (response.status !== 200) {
    // Log the error
    const data = await response.json()
    await ActionHubDB.setOnboardingStatus(
      shopName,
      OnboardingStep.ErrorOrders,
      data.detail
    )
    return false
  }
  return true
}
