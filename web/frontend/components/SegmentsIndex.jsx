import {
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Text,
  Select,
  Button,
  ButtonGroup,
  Modal,
  EmptySearchResult
} from '@shopify/polaris'
import React from 'react'
import { useState, useCallback } from 'react'
import { useAppQuery, useAuthenticatedFetch } from '../hooks'

export function SegmentsIndex () {
    const [confirmSync, setConfirmSync] = useState(false)
    const [confirmRefresh, setConfirmRefresh] = useState(false)

    // const segments = []
  const segments = [
    {
      id: 'label-casual',
      type: 'Tag',
      name: 'Casual',
      users: 55,
      strength: 90.2,
      status: 'new'
    },
    {
      id: 'label-topwear',
      type: 'Tag',
      name: 'Topwear',
      users: 52,
      strength: 89.1,
      status: 'new'
    },
    {
      id: 'label-dresses',
      type: 'Tag',
      name: 'Dresses',
      users: 32,
      strength: 84.5,
      status: 'new'
    },
    {
      id: 'label-formal',
      type: 'Tag',
      name: 'Formal',
      users: 23,
      strength: 79.9,
      status: 'new'
    },
    {
      id: 'asset-2143',
      type: 'Product',
      name: 'Basics Men Blue Striped Polo T-shirt',
      users: 34,
      strength: 89.3,
      status: 'new'
    },
    {
      id: 'asset-31358',
      type: 'Product',
      name: 'Locomotive Brown Printed T-Shirt',
      users: 26,
      strength: 72.5,
      status: 'new'
    },
    {
      id: 'asset-1995',
      type: 'Product',
      name: 'ADIDAS Mens Crew Red T-shirt',
      users: 12,
      strength: 6.1,
      status: 'new'
    }
  ]

  const handleSyncButton = useCallback(value => setConfirmSync(true), [])
  const handleSyncClose = useCallback(value => setConfirmSync(false), [])
  const handleSyncLearnMore = useCallback(value => {
    window.open('https://docs.actionhub.ai', '_blank')
  }, [])

  const handleRefreshButton = useCallback(value => setConfirmRefresh(true), [])
  const handleRefreshClose = useCallback(value => setConfirmRefresh(false), [])
  const handleRefreshLearnMore = useCallback(value => {
    window.open('https://docs.actionhub.ai', '_blank')
  }, [])

  const handleRefreshSegments = useCallback(value => {
    console.log(value)
  }, [])

  const handleSyncSegments = useCallback(value => {
    console.log(value)
  }, [])

//   const { data: program, isLoading, isRefetching } = useAppQuery({
//     url: `/api/segments/sync`,
//     reactQueryOptions: {
//       /* Disable refetching because the QRCodeForm component ignores changes to its props */
//       refetchOnReconnect: false
//     }
//   })

  const options = [
    { label: 'Labels', value: 'labels' },
    { label: 'Products', value: 'assets' }
  ]

  const resourceName = {
    singular: 'segment',
    plural: 'segments'
  }

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange
  } = useIndexResourceState(segments)

  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No segments yet'}
      description={"Hit the 'Refresh' button above to calculate new segments"}
      withIllustration
    />
  );

  const rowMarkup = segments.map(
    ({ id, type, name, users, strength, status }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>{id}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant='bodyMd' as='div'>
            {type} &gt; {name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant='bodyMd' as='span' alignment='end' numeric>
            {users}
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
           <Text variant="headingLg" as="h5">
            Select segments to sync
           </Text>
          </div>
          <div>
            <ButtonGroup>
              <Button onClick={handleRefreshButton}>Refresh</Button>
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
          itemCount={segments.length}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          emptyState={emptyStateMarkup}
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
                   Strength
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
          title='Confirm: Sync Selected Segments?'
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
          title='Confirm: Refresh Store Segments?'
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
              This action will reprocess user recommendations
              and refenerate all user segments. This process could take
              a few minutes to complete. 
            </Text>
          </Modal.Section>
        </Modal>
      </div>
    </>
  )
}
