// import shopify from "../shopify.js";
import { ActionHubDB } from '../actionhub-db.js'
import Shopify from 'shopify-api-node'

const OnboardingStep = {
  CreateProgram: 'create_program',
  CreateMetaFields: 'create_metafields',
  ImportProducts: 'import_products',
  ImportOrders: 'import_orders',
  GenerateGlobals: 'generate_global',
  GenerateActions: 'generate_actions',
  Complete: 'complete',
  WarningNoProducts: 'warning_no_products',
  WarningNoOrders: 'warning_no_orders'
}

// create_program
// create_metafields

let programId = ''
let actionHubKey = ''

const shopName = process.env.HOST
process.send('starting onboarding...')
process.send(shopName)

await ActionHubDB.init()
const accessToken = await ActionHubDB.getShopifyAccessToken({ shopName })
const shopify = new Shopify({
  shopName: shopName,
  accessToken: accessToken
})

await createProgram()

async function createProgram () {
  /*
    Create a new program on the ActionHub platform.
  */
  // Log status
  process.send('starting ' + OnboardingStep.CreateProgram)
  await ActionHubDB.startOnboardingStatus(
    shopName,
    OnboardingStep.CreateProgram
  )

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

    const resource = 'programs'
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
  /*
    Notify the parent so they can put in to global variables
  */
  process.send({
    programId: programId,
    actionHubKey: actionHubKey
  })

  // Log status
  await ActionHubDB.startOnboardingStatus(
    shopName,
    OnboardingStep.CreateProgram
  )
  // Next step
  await createMetafields()
  Promise.resolve()
}

async function createMetafields () {
  /*
    Create the metafields that will hold the ActionHub segments
  */
  // Log status
  process.send('starting ' + OnboardingStep.CreateMetaFields)
  await ActionHubDB.startOnboardingStatus(
    shopName,
    OnboardingStep.CreateMetaFields
  )

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
  // TODO: do something with the response for error chceking

  // Log status
  await ActionHubDB.endOnboardingStatus(
    shopName,
    OnboardingStep.CreateMetaFields
  )
  // Next step
  await imoprtProducts()
  Promise.resolve()
}

async function imoprtProducts () {
  /*
    Create assets in ActionHub from shop products.
    Products include tags.
  */
  // Log status
  process.send('starting ' + OnboardingStep.ImportProducts)
  await ActionHubDB.startOnboardingStatus(
    shopName,
    OnboardingStep.ImportProducts
  )

  // read the products from Shopify
  const products = await shopify.product.list()
  if (products.length == 0) {
    // Can't go on if there are no products
    await ActionHubDB.startOnboardingStatus(
      shopName,
      OnboardingStep.WarningNoProducts
    )
    Promise.resolve();
    return false;
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
  const resource = 'assets'
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

  const result = await response.json()
  // TODO: do something with the result for error chceking

  // Log status
  await ActionHubDB.endOnboardingStatus(shopName, OnboardingStep.ImportProducts)
  // Next step
  await importOrders()
  Promise.resolve()
}

async function importOrders () {
  /*
    Import orders from Shopify and post to ActionHub as events
  */
  // Log status
  process.send('starting ' + OnboardingStep.ImportOrders)
  await ActionHubDB.startOnboardingStatus(shopName, OnboardingStep.ImportOrders)

  // Read the orders from Shopify
  const orders = await shopify.order.list()
  if (orders.length == 0) {
    // Can't go on if there are no orders
    await ActionHubDB.startOnboardingStatus(
      shopName,
      OnboardingStep.WarningNoOrders
    )
    Promise.resolve();
    return false;
  }

  // HERE NEXT...

  console.log(JSON.stringify(orders))
  for (const order of orders) {
    console.log(JSON.stringify(order))
  }

  // const assets = [];
  // for (const product of products) {
  //   const assetId = product.id;
  //   const assetName = product.title;
  //   const tags = product.tags.split(',')
  //   const asset = {
  //     asset_id: assetId,
  //     asset_name: assetName,
  //     labels: tags
  //   }
  //   assets.push(asset)
  // }

  // Log status
  await ActionHubDB.endOnboardingStatus(shopName, OnboardingStep.ImportOrders)
  // Next step
  await generateGlobals()
  Promise.resolve()
}

async function generateGlobals () {
  // Log status
  process.send('starting "generate_globals"')
  await ActionHubDB.startOnboardingStatus(shopName, 'generate_globals')

  // Log status
  await ActionHubDB.endOnboardingStatus(shopName, 'generate_globals')
  // Next step
  await generateActions()
  Promise.resolve()
}

async function generateActions () {
  // Log status
  process.send('starting "generate_actions"')
  await ActionHubDB.startOnboardingStatus(shopName, 'generate_actions')

  // Log status
  await ActionHubDB.endOnboardingStatus(shopName, 'generate_actions')
  await ActionHubDB.endOnboardingStatus(shopName, OnboardingStep.Complete)
  // Done!
  Promise.resolve()
}

process.on('message', message => {
  //process.send({text:'shop name!!'});
  // await ActionHubDB.init();
  //session = message.session;
  //process.send({text:'shop name!!'});
  //await createProgram();
  // process.exit();
  // create_program
  // create_metafields
  // import_products
  // import_orders
  // generate_globals
  // generate_actions
  // complete
})

// process.exit()
