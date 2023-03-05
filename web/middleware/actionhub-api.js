/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

import express from 'express'

import shopify from '../shopify.js'
import { QRCodesDB } from '../qr-codes-db.js'
import {
  getQrCodeOr404,
  getShopUrlFromSession,
  parseQrCodeBody,
  formatQrCodeResponse
} from '../helpers/qr-codes.js'

// const host = "https://api.actionhub.ai/";
const host = 'http://127.0.0.1:8000/'
// TODO: get the real program stuff here
const actionHubKey = '5e0ff226-6043-4c4a-bbfb-8ea0d7968263'
const programId = 'fashion_campus'

const DISCOUNTS_QUERY = `
  query discounts($first: Int!) {
    codeDiscountNodes(first: $first) {
      edges {
        node {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
            ... on DiscountCodeBxgy {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
            ... on DiscountCodeFreeShipping {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

export default function applyQrCodeApiEndpoints (app) {
  app.use(express.json())

  app.get('/api/discounts', async (req, res) => {
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session
    })

    /* Fetch all available discounts to list in the QR code form */
    const discounts = await client.query({
      data: {
        query: DISCOUNTS_QUERY,
        variables: {
          first: 25
        }
      }
    })

    res.send(discounts.body.data)
  })

  app.post('/api/qrcodes', async (req, res) => {
    try {
      const id = await QRCodesDB.create({
        ...(await parseQrCodeBody(req)),

        /* Get the shop from the authorization header to prevent users from spoofing the data */
        shopDomain: await getShopUrlFromSession(req, res)
      })
      const response = await formatQrCodeResponse(req, res, [
        await QRCodesDB.read(id)
      ])
      res.status(201).send(response[0])
    } catch (error) {
      res.status(500).send(error.message)
    }
  })

  app.patch('/api/qrcodes/:id', async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res)

    if (qrcode) {
      try {
        await QRCodesDB.update(req.params.id, await parseQrCodeBody(req))
        const response = await formatQrCodeResponse(req, res, [
          await QRCodesDB.read(req.params.id)
        ])
        res.status(200).send(response[0])
      } catch (error) {
        res.status(500).send(error.message)
      }
    }
  })

  app.get('/api/qrcodes', async (req, res) => {
    try {
      const rawCodeData = await QRCodesDB.list(
        await getShopUrlFromSession(req, res)
      )

      const response = await formatQrCodeResponse(req, res, rawCodeData)
      res.status(200).send(response)
    } catch (error) {
      console.error(error)
      res.status(500).send(error.message)
    }
  })

  app.get('/api/qrcodes/:id', async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res)

    if (qrcode) {
      const formattedQrCode = await formatQrCodeResponse(req, res, [qrcode])
      res.status(200).send(formattedQrCode[0])
    }
  })

  app.delete('/api/qrcodes/:id', async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res)

    if (qrcode) {
      await QRCodesDB.delete(req.params.id)
      res.status(200).send()
    }
  })

  /*
  ActionHub api calls...
  */
  app.get('/api/segments/sync', async (req, res) => {
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
            name: 'ActionHub Order Actions',
            namespace: 'actionhub',
            key: 'order_actions',
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
    const resource = 'program'
    const url = host + resource
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
   const segment_basis = req.query?.segment_basis;
   const force_refresh = req.query?.force_refresh;
   const min_weight = req.query?.min_weight;

    const weightMap = {
      0.1: "low",
      0.4: "med",
      0.7: "high"
    }

    const headers = {
      'actionhub-key': actionHubKey,
      'program-id': programId
    }

    const params = new URLSearchParams({
      segment_basis: segment_basis,
      min_weight: min_weight,
      force_refresh: force_refresh
    })
    const response = await fetch(host + 'segments?' + params, {
      headers: headers
    })
    const data = await response.json()
    const segments = data['items'];

    for (let i = 0; i < segments?.length; i++) {
      segments[i]['id'] = segments[i].segment_basis + '-' + segments[i].segment_basis_id + '-' + weightMap[min_weight]
    }

    res.status(200).send(segments)
  })
}
