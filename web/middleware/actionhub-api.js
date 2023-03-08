import express from 'express'
import shopify from '../shopify.js'
import { ActionHubDB } from '../actionhub-db.js'
import { fork } from 'child_process';

// TODO: get the real program stuff here
const actionHubKey = '5e0ff226-6043-4c4a-bbfb-8ea0d7968263'
const programId = 'fashion_campus'

export default function applyActionHubEndpoints (app) {
  ActionHubDB.init()

  app.use(express.json())

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
      const result = await ActionHubDB.startOnboardingStatus(
        shopName, "start"
      )
        
      // Kick off the child process
      const child = fork('helpers/onboarding.js', [], {
        env: {
          SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
          SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
          SCOPES: process.env.SCOPES,
          HOST: shopName
        }
      });
      child.on('exit', (code, signal) => {
        console.log(`child process exited with code ${code} and signal ${signal}`);
      });
      child.on('error', (code) => {
        console.log(`child process exited with error ${code}`);
      });

      // Handle mesages back from the process 
      child.on('message', (message) => {
        if (message.hasOwnProperty("programId")) {
          global.ACTIONHUB_API_SHOP_PROGRAM_ID = message.programId;
          console.log(`setting programId: ${message.programId}`);
        }
        if (message.hasOwnProperty("actionHubKey")) {
          global.ACTIONHUB_API_SHOP_KEY = message.actionHubKey;
          console.log(`setting actionHubKey: ${message.actionHubKey}`);
        }
        else {
          console.log(`message from child process: ${JSON.stringify(message)}`);
        }
      });

      // Let 'em know we started
      const msg = {
        step_id: "start",
        step_message: "Starting installation",
        step_progress: 0
      }
      const data = JSON.stringify(msg)   
      res.status(200).send(data)
    }
    else {
      // Onboarding already started
      console.log(shopName + ' onboarding already started')
      const data = JSON.stringify(result)   
      res.status(200).send(data)
    }
  })

  app.post('/api/onboarding', async (req, res) => {
    const shopName = res.locals.shopify.session.shop
    // TODO: get this step dynamically
    const stepId = 'creating_program'
    const result = await ActionHubDB.setOnboardingStatus({
      shopName,
      stepId
    })
    res.status(200).send(result)
  })

  app.get('/api/segments/sync', async (req, res) => {
    /* something goes here */
  })

  app.get('/api/program', async (req, res) => {
    /*
      get program details
    */
    const resource = 'program'
    const url = process.env.ACTIONHUB_API_HOST + resource
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
    const url = process.env.ACTIONHUB_API_HOST + resource + params
    const response = await fetch(url, {
      headers: headers
    })
    const data = await response.json()

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
}

