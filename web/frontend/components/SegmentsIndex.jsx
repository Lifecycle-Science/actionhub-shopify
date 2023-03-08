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
import { useAppQuery } from '../hooks'

export function SegmentsIndex () {
  const [confirmSync, setConfirmSync] = useState(false)
  const [confirmRefresh, setConfirmRefresh] = useState(false)
  const [segmentBasis, setSegmentBasis] = useState('labels')
  const [minWeight, setMinWeight] = useState(0.1)
  const [forceRefresh, setForceRefresh] = useState(false)

  const params = new URLSearchParams({
    segment_basis: segmentBasis,
    min_weight: minWeight,
    force_refresh: forceRefresh
  })

  const { data: segments, isLoading, isRefetching } = useAppQuery({
    url: `/api/segments?` + params,
    reactQueryOptions: {
      refetchOnReconnect: false
    }
  })


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
    setForceRefresh(true);
    setConfirmRefresh(false);
  }, [])

  const handleSyncSegments = useCallback(value => {
    console.log(value)
  }, [])

  const handleSegmentBasisChange = useCallback(value => {
    setForceRefresh(false);
    setSegmentBasis(value);
    }, [])
  const handleMinWeightChange = useCallback(value => {
    setForceRefresh(false);
    setMinWeight(value)}
    , [])

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

  const basisOptions = [
    { label: 'Tags', value: 'labels' },
    { label: 'Products', value: 'assets' }
  ]
  const minWEightOptions = [
    { label: 'Low+', value: '0.1' },
    { label: 'Med+', value: '0.4' },
    { label: 'High', value: '0.7' }
  ]
  const weightMap = { // for display purposes
    0.1: "low",
    0.4: "med",
    0.7: "high"
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

  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No segments yet'}
      description={"Hit the 'Refresh Segments' button above to calculate new segments"}
      withIllustration
    />
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
            {action_type} ({weightMap[minWeight]}) 
            &gt; {basisMap[segment_basis]} &gt; {name}
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
              This action will reprocess user recommendations and refenerate all
              user segments. This process could take a few minutes to complete.
            </Text>
          </Modal.Section>
        </Modal>
      </div>
    </>
  )
}
