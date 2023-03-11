import express from 'express'
import shopify from '../shopify.js'
import { ActionHubDB } from '../actionhub-db.js'
import { fork } from 'child_process'
import { ActionHubAPI } from '../actionhub-api.js'

export default function applyActionHubAppEndpoints (app) {
  ActionHubDB.init()

  app.use(express.json())

  app.get('/api/program', async (req, res) => {
    /*
      get program details
    */
    const shopName = res.locals.shopify.session.shop
    await ActionHubAPI.init(shopName)
    const data = ActionHubAPI.getProgram()
    res.status(200).send(data)
  })

  app.get('/api/segments', async (req, res) => {
    /*
      get the segments from ActionHub
    */
    const shopName = res.locals.shopify.session.shop
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

    // get the ActionHub API response
    await ActionHubAPI.init(shopName)
    const data = await ActionHubAPI.getSegments(
      segment_basis,
      min_weight,
      force_refresh
    )
    const segments = data['items']

    for (let i = 0; i < segments?.length; i++) {
      segments[i]['id'] =
        segments[i].action_type +
        '-' +
        segments[i].segment_basis +
        '-' +
        segments[i].segment_basis_id +
        '-' +
        weightMap[min_weight]
    }

    res.status(200).send(segments)
  })

  app.get('/api/segments/sync', async (req, res) => {
    /* something goes here */
  })

  app.post('/api/onboarding/dismiss', async (req, res) => {
    /*
     Set onboarding state to dismess so it is no longer shown 
    */
    console.log('disniss!!!')
    const shopName = res.locals.shopify.session.shop
    await ActionHubAPI.init(shopName)
    const result = await ActionHubDB.startOnboardingStatus(shopName, 'dismissed')
    res.status(200).send(result)
  })

  app.get('/api/onboarding', async (req, res) => {
    /*
      This function responds with onboarding status messages.
      If there are no messages, it will kick off the onboarding process.
    */
    // Get current status
    const shopName = res.locals.shopify.session.shop
    const result = await ActionHubDB.getOnboardingStatus({
      shopName
    })

    if (!result) {
      // No onboarding yet so let's get started
      // Log the starting
      const result = await ActionHubDB.startOnboardingStatus(shopName, 'start')

      // Kick off the child process
      const child = fork('helpers/onboarding.js', [], {
        env: {
          SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
          SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
          SCOPES: process.env.SCOPES,
          HOST: shopName
        }
      })
      child.on('exit', (code, signal) => {
        console.log(
          `child process exited with code ${code} and signal ${signal}`
        )
      })
      child.on('error', code => {
        console.log(`child process exited with error ${code}`)
      })
      // Handle mesages back from the process
      child.on('message', message => {
        if (message.hasOwnProperty('programId')) {
          console.log(`setting programId: ${message.programId}`)
          global.ACTIONHUB_API_SHOP_PROGRAM_ID = message.programId
        }
        if (message.hasOwnProperty('actionHubKey')) {
          console.log(`setting actionHubKey: ${message.actionHubKey}`)
          global.ACTIONHUB_API_SHOP_KEY = message.actionHubKey
        } else {
          console.log(`message from child process: ${JSON.stringify(message)}`)
        }
      })

      // Let 'em know we started
      const msg = {
        step_id: 'start',
        step_message: 'Starting installation',
        step_progress: 0
      }
      const data = JSON.stringify(msg)
      res.status(200).send(data)
    } else {
      /*
       Onboarding already started, might even be done.
       */
      const data = JSON.stringify(result)
      res.status(200).send(data)
    }
  })
}
