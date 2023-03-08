// import shopify from "../shopify.js";
import { ActionHubDB } from '../actionhub-db.js'
import Shopify from 'shopify-api-node'

// create_program
// create_metafields
// import_products
// import_orders
// generate_globals
// generate_actions
// complete

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
  process.send('starting "create_program"')
  await ActionHubDB.startOnboardingStatus(shopName, 'create_program')

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

  await ActionHubDB.startOnboardingStatus(shopName, 'create_program')
  await createMetafields()
  Promise.resolve()
}

async function createMetafields () {
  /*
    Create the metafields that will hold the ActionHub segments
  */
  process.send('starting "create_metafields"')
  await ActionHubDB.startOnboardingStatus(shopName, 'create_metafields')
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

  await ActionHubDB.endOnboardingStatus(shopName, 'create_metafields')
  await imoprtProducts()
  Promise.resolve()
}

async function imoprtProducts () {
  /*
    Create assets in ActionHub from shop products.
    Products include tags.
  */
  process.send('starting "import_products"')
  await ActionHubDB.startOnboardingStatus(shopName, 'import_products')

  // read the products from Shopify
  const products = await shopify.product.list();
  const assets = [];
  for (const product of products) {
    const assetId = product.id;
    const assetName = product.title;
    const tags = product.tags.split(',')
    const asset = {
      asset_id: assetId,
      asset_name: assetName,
      labels: tags
    }
    assets.push(asset)
  }

  // write the assets to ActionHub API
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

  await ActionHubDB.endOnboardingStatus(shopName, 'import_products')
  await importOrders()
  Promise.resolve()
}

async function importOrders () {
  process.send('starting "import_orders"')
  await ActionHubDB.startOnboardingStatus(shopName, 'import_orders')

  // read the products from Shopify
  const products = await shopify.product.list();
  const assets = [];
  for (const product of products) {
    const assetId = product.id;
    const assetName = product.title;
    const tags = product.tags.split(',')
    const asset = {
      asset_id: assetId,
      asset_name: assetName,
      labels: tags
    }
    assets.push(asset)
  }

  await ActionHubDB.endOnboardingStatus(shopName, 'import_orders')
  await generateGlobals()
  Promise.resolve()
}

async function generateGlobals () {
  process.send('starting "generate_globals"')
  await ActionHubDB.startOnboardingStatus(shopName, 'generate_globals')

  await ActionHubDB.endOnboardingStatus(shopName, 'generate_globals')
  await generateActions()
  Promise.resolve()
}

async function generateActions () {
  process.send('starting "generate_actions"')
  await ActionHubDB.startOnboardingStatus(shopName, 'generate_actions')

  await ActionHubDB.endOnboardingStatus(shopName, 'generate_actions')
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
