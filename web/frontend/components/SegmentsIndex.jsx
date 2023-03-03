import {
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Text,
  Select,
  Button,
  ButtonGroup,
  Modal
} from '@shopify/polaris'
import React from 'react'
import { useState, useCallback } from 'react'
import { useAppQuery, useAuthenticatedFetch } from '../hooks'

export function SegmentsIndex () {
  const [confirmSync, setConfirmSync] = useState(false)
  const [segmentType, setSegmentType] = useState(false)

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

  const [selected, setSelected] = useState('labels')

  const handleSelectChange = useCallback(value => setSelected(value), [])
  const handleSyncButton = useCallback(value => setConfirmSync(true), [])
  const handleSyncClose = useCallback(value => setConfirmSync(false), [])

  /* the big one */
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
          <Text variant='bodyMd' as='span'>
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
            <Select
              labelInline
              label='Segment Type:'
              options={options}
              onChange={handleSelectChange}
              value={selected}
            />
          </div>
          <div>
            <ButtonGroup>
              <Button>Refresh</Button>
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
                  Customer count
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
                  Segment Strength
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
          title='Confirm Sync Selected Segments?'
          primaryAction={{
            content: 'Do it!',
            onAction: handleSyncSegments
          }}
          secondaryActions={[
            {
              content: 'Learn more',
              onAction: handleSyncClose
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
    </>
  )
}
