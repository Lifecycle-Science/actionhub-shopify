import { authenticatedFetch } from '@shopify/app-bridge/utilities'
import {
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Text,
  Select,
  Button,
  ButtonGroup,
  Modal,
  EmptyState
} from '@shopify/polaris'
import React, { useEffect } from 'react'
import { useState, useCallback } from 'react'
import { useAppQuery, useAuthenticatedFetch } from '../hooks'

export function SegmentsIndex (props) {
  // query attributes
  const [segmentBasis, setSegmentBasis] = useState('labels')
  const [minWeight, setMinWeight] = useState(0.1)
  const [forceRefresh, setForceRefresh] = useState(false)
  // modal states
  const [confirmSync, setConfirmSync] = useState(false)
  const [confirmRefresh, setConfirmRefresh] = useState(false)
  // Use onboarding state to inform messaging about empty state
  const [onboardingState, setOnboardingState] = useState(props.onboardingState)

  const fetch = useAuthenticatedFetch()

  useEffect(() => {
    if (props.onboardingState.step_id == 'complete') {
      /*
        We'll refresh the first segment on each return visit
        until the shop dismisses the notification.
      */
      setForceRefresh(true)
    }
    setOnboardingState(props.onboardingState)
  }, [props.onboardingState])

  /*
    All the interaction event handlers...
  */
  // fiter option changes
  const handleSegmentBasisChange = useCallback(value => {
    // No foreced refresh on filter changes
    setForceRefresh(false)
    setSegmentBasis(value)
  }, [])
  const handleMinWeightChange = useCallback(value => {
    // No foreced refresh on filter changes
    setForceRefresh(false)
    setMinWeight(value)
  }, [])

  // Refresh (run the segments again)
  // Wrapped in modal actions
  const handleRefreshButton = useCallback(value => setConfirmRefresh(true), [])
  const handleRefreshSegments = useCallback(value => {
    setForceRefresh(true)
    setConfirmRefresh(false)
  }, [])
  const handleRefreshClose = useCallback(value => setConfirmRefresh(false), [])

  // Documentation content
  const handleSyncLearnMore = useCallback(value => {
    window.open('https://docs.actionhub.ai', '_blank')
  }, [])
  const handleRefreshLearnMore = useCallback(value => {
    window.open('https://docs.actionhub.ai', '_blank')
  }, [])
 
  /*
    The call to the back end starts here...
  */
  const params = new URLSearchParams({
    segment_basis: segmentBasis,
    min_weight: minWeight,
    force_refresh: forceRefresh
  })

  const { data: segments, isLoading, isRefetching } = useAppQuery({
    url: `/api/segments?${params}`,
    reactQueryOptions: {
      refetchOnReconnect: false
    }
  })

  /*
    Displat data and picklists stuff
  */
  const options = [
    { label: 'Labels', value: 'labels' },
    { label: 'Products', value: 'assets' }
  ]
  const resourceName = {
    singular: 'segment',
    plural: 'segments'
  }
  const basisOptions = [
    { label: 'Tags', value: 'labels' },
    { label: 'Products', value: 'assets' }
  ]
  const minWEightOptions = [
    { label: 'Low+', value: '0.1' },
    { label: 'Med+', value: '0.4' },
    { label: 'High', value: '0.7' }
  ]
  const weightMap = {
    // for display purposes
    0.1: 'low',
    0.4: 'med',
    0.7: 'high'
  }
  const basisMap = {
    label: 'Tag',
    asset: 'Product'
  }

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange
  } = useIndexResourceState(segments)

    // This is the Big One...
  // Wrapped in modal actions
  const handleSyncButton = useCallback(value => setConfirmSync(true), [])
  const handleSyncSegments = useCallback(value => {
      // No foreced refresh on filter changes
      const method = 'POST'
      const body = {segments: selectedResources}
      console.log(selectedResources);
      fetch(`/api/segments/sync`, {
        method,
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        console.log(data)
      })
    }, [selectedResources])

  const handleSyncClose = useCallback(value => setConfirmSync(false), [])


  const emptyStateMessage = onboardingState => {
    /*
        Lots of reasons why there might not be segments.
        Most have to do with some part of the onboarding process.
    */
    let heading = ''
    let msg = ''
    let image = ''
    const fileHost =
      'https://lifecycle-science-public-files.s3.us-west-2.amazonaws.com'

    if (onboardingState.step_id == 'warning_no_products') {
      // No products
      heading = 'No segments available'
      msg = `ActionHub could not find products in your shop. 
            Products are required for generating recommendation segments.`
      image = fileHost + '/images/shopify-empty-state-2.jpg'
    } else if (onboardingState.step_id == 'warning_no_orders') {
      // No orders
      heading = 'No segments available'
      msg = `ActionHub could not find orders in your shop. 
            Orders are required for generating recommendation segments.`
      image = fileHost + '/images/shopify-empty-state-2.jpg'
    } else if (onboardingState.step_id.startsWith('error')) {
      // Error occurred during omboarding
      heading = 'Error during integration'
      msg = `ActionHub encountered an error during integrtaion. 
            Segments count not be generated.`
      image = fileHost + '/images/shopify-empty-state-2.jpg'
    } else if (onboardingState.step_progress < 100) {
      // Onboarding in progress
      heading = 'Installation in progress'
      msg = `ActionHub is setting up and running models. 
              Segments should be available soon.`
      image = fileHost + '/images/shopify-loading-state-1.gif'
    } else if (isLoading) {
      // Results loading
      heading = 'Searching for segments'
      msg = 'ActionHub is looking for your segments.'
      image = fileHost + '/images/shopify-loading-state-1.gif'
    } else {
      // No segments
      heading = 'No segments available'
      msg = `ActionHub could not find segments in your shop. 
            You can manually recalulate segments using the Refresh Segments button.`
      image = fileHost + '/images/shopify-empty-state-2.jpg'
    }

    return { msg: msg, image: image, heading: heading }
  }

  const emptyStateMarkup = (
    <EmptyState
      heading={emptyStateMessage(props.onboardingState).heading}
      image={emptyStateMessage(props.onboardingState).image}
    >
      <p>{emptyStateMessage(props.onboardingState).msg}</p>
    </EmptyState>
  )

  const rowMarkup = segments?.map(
    (
      { id, action_type, segment_basis, name, user_count, strength, status },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>{id}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant='bodyMd' as='div'>
            {action_type} ({weightMap[minWeight]}) &gt;{' '}
            {basisMap[segment_basis]} &gt; {name.trim()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant='bodyMd' as='span' alignment='end' numeric>
            {parseInt(user_count).toLocaleString()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant='bodyMd' as='span' alignment='end' numeric>
            {strength}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{status}</IndexTable.Cell>
      </IndexTable.Row>
    )
  )

  return (
    <>
      <LegacyCard>
        <div style={{ padding: '12px', display: 'flex' }}>
          <div style={{ paddingRight: '24px', flex: 1 }}>
            <Text variant='headingLg' as='h5'>
              Select segments to sync
            </Text>
          </div>
          <div style={{ paddingRight: '12px' }}>
            <Select
              labelInline
              label='Segment type'
              options={basisOptions}
              value={segmentBasis}
              onChange={handleSegmentBasisChange}
            />
          </div>
          <div style={{ paddingRight: '12px' }}>
            <Select
              labelInline
              label='Relevance'
              options={minWEightOptions}
              value={minWeight}
              onChange={handleMinWeightChange}
            />
          </div>
          <div>
            <ButtonGroup>
              <Button onClick={handleRefreshButton}>Refresh Segments</Button>
              <Button
                disabled={selectedResources.length == 0}
                primary
                onClick={handleSyncButton}
              >
                Sync Selected
              </Button>
            </ButtonGroup>
          </div>
        </div>
        <IndexTable
          resourceName={resourceName}
          itemCount={isLoading ? 0 : segments.length}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          emptyState={emptyStateMarkup}
          loading={isLoading}
          headings={[
            { id: 'id', title: 'Segment Id' },
            { id: 'name', title: 'Segment Name' },
            {
              id: 'users',
              title: (
                <Text
                  as='span'
                  variant='bodySm'
                  fontWeight='medium'
                  alignment='end'
                >
                  Customers
                </Text>
              )
            },
            {
              id: 'strength',
              title: (
                <Text
                  as='span'
                  variant='bodySm'
                  fontWeight='medium'
                  alignment='end'
                >
                  Avg. Relevance
                </Text>
              )
            },
            { title: 'status' }
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>

      <div style={{ height: '500px' }}>
        <Modal
          open={confirmSync}
          onClose={handleSyncClose}
          title='Confirm: Sync selected segments?'
          primaryAction={{
            content: 'Do it!',
            onAction: handleSyncSegments
          }}
          secondaryActions={[
            {
              content: 'Learn more',
              onAction: handleSyncLearnMore
            }
          ]}
        >
          <Modal.Section>
            <Text>
              ActionHub will create the following customer segments for use in
              your marketing channels: <b>{selectedResources.join(', ')}</b>
            </Text>
          </Modal.Section>
        </Modal>
      </div>

      <div style={{ height: '500px' }}>
        <Modal
          open={confirmRefresh}
          onClose={handleRefreshClose}
          title='Confirm: Refresh customer segments?'
          primaryAction={{
            content: 'Do it!',
            onAction: handleRefreshSegments
          }}
          secondaryActions={[
            {
              content: 'Learn more',
              onAction: handleRefreshLearnMore
            }
          ]}
        >
          <Modal.Section>
            <Text>
              This action will reprocess user recommendations and refenerate all
              user segments. This process could take a few minutes to complete.
            </Text>
          </Modal.Section>
        </Modal>
      </div>
    </>
  )
}
