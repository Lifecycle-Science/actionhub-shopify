import express from 'express'
import shopify from '../shopify.js'
import { ActionHubDB } from '../actionhub-db.js'

// TODO: get the real program stuff here
const actionHubKey = '5e0ff226-6043-4c4a-bbfb-8ea0d7968263'
const programId = 'fashion_campus'

export default function applyActionHubEndpoints (app) {
  ActionHubDB.init();

  app.use(express.json())

  app.get('/api/onboarding', async (req, res) => {
    const shopName = res.locals.shopify.session.shop;
    const stepId = 'creating_program'
    const result = await ActionHubDB.getOnboardingStatus({
      shopName
    });
    const data = JSON.stringify(result)
    res.status(200).send(data)
  })

  app.post('/api/onboarding', async (req, res) => {
    const shopName = res.locals.shopify.session.shop;
    // TODO: get this step dynamically
    const stepId = 'creating_program'
    const result = await ActionHubDB.setOnboardingStatus({
      shopName, stepId
    });
    res.status(200).send(result)
  })


  app.get('/api/segments/sync', async (req, res) => {
    /*
      create customer sesgment metafields
    */
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session
    })
    const METADATA_QUERY = {
      data: {
        query: `
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
      } `,
        variables: {
          definition: {
            name: 'ActionHub Segments',
            namespace: 'actionhub',
            key: 'segments',
            description:
              '[DO NOT EDIT - required for ActionHub] A list of recommended product order actions.',
            type: 'list.single_line_text_field',
            ownerType: 'CUSTOMER'
          }
        }
      }
    }
    const response = await client.query(METADATA_QUERY)
    console.log(response.headers, response.body)
  })

  app.get('/api/program', async (req, res) => {
    /*
      get program details
    */
    const resource = 'program'
    const url = process.env.ACTIONHUB_API_HOST + resource
    console.log(url)
    const response = await fetch(url, {
      headers: {
        'actionhub-key': actionHubKey,
        'program-id': programId
      }
    })
    const data = await response.json()
    res.status(200).send(data)
  })

  app.get('/api/segments', async (req, res) => {
    /*
      get the
    */
    const segment_basis = req.query?.segment_basis
    const force_refresh = req.query?.force_refresh
    const min_weight = req.query?.min_weight

    const weightMap = {
      0.1: 'low',
      0.4: 'med',
      0.7: 'high'
    }
    const basisMap = {
      label: 'Tag',
      asset: 'Product'
    }

    const headers = {
      'actionhub-key': actionHubKey,
      'program-id': programId
    }

    const resource = 'segments?'
    const params = new URLSearchParams({
      segment_basis: segment_basis,
      min_weight: min_weight,
      force_refresh: force_refresh
    })
    console.log(process.env)
    const url = process.env.ACTIONHUB_API_HOST + resource + params
    console.log(url)
    const response = await fetch(url, {
      headers: headers
    })
    const data = await response.json()
    const segments = data['items']

    for (let i = 0; i < segments?.length; i++) {
      segments[i]['id'] =
      segments[i].action_type + '-' +
        segments[i].segment_basis +
        '-' +
        segments[i].segment_basis_id +
        '-' +
        weightMap[min_weight]
    }

    res.status(200).send(segments)
  })
}
