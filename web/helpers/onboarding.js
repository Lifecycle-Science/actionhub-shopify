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

const actionhub_headers = {
  'actionhub-key': actionHubKey,
  'program-id': programId
}

const shopName = process.env.HOST
process.send('starting onboarding...')
process.send(shopName)

await ActionHubDB.init()
const accessToken = await ActionHubDB.getShopifyAccessToken({shopName})
const shopify = new Shopify({
  shopName: shopName,
  accessToken: accessToken
})

await createProgram()

async function createProgram () {
  process.send('starting "create_program"')
  await ActionHubDB.startOnboardingStatus(shopName, "create_program")
  // if program exists
  // get program id and api key

  // if program does not aleady exists...
  // create program
  // get program id and api key

  await ActionHubDB.startOnboardingStatus(shopName, "create_program")
  await createMetafields()
  Promise.resolve()
}

async function createMetafields () {
  /*
    Create the metafields that will hold the ActionHub segments
  */
  await ActionHubDB.startOnboardingStatus(shopName, "create_metafields")
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

  await ActionHubDB.endOnboardingStatus(shopName, "create_metafields")
  await imoprtProducts()
  Promise.resolve()
}

async function imoprtProducts () {
  process.send('starting "import_products"')

  await importOrders()
  Promise.resolve()
}

async function importOrders () {
  process.send('starting "import_orders"')

  await generateGlobals()
  Promise.resolve()
}

async function generateGlobals () {
  process.send('starting "generate_globals"')

  await generateActions()
  Promise.resolve()
}

async function generateActions () {
  process.send('starting "generate_actions"')

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
