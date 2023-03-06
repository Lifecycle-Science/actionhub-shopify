import { useState } from 'react'
import {
  Divider,
  Box,
  LegacyCard,
  ProgressBar,
  Banner,
  Link
} from '@shopify/polaris'
import { Toast } from '@shopify/app-bridge-react'
import { useAppQuery, useAuthenticatedFetch } from '../hooks'

export function OnboardingProgress () {
  const emptyToastProps = { content: null }
  const [toastProps, setToastProps] = useState(emptyToastProps)
  const fetch = useAuthenticatedFetch()

  const currentStep = '(6 of 7) Generating models...'

  // const {
  //   data: program,
  //   isLoading,
  //   isRefetching,
  // } = useAppQuery({
  //   url: `/api/program`,
  //   reactQueryOptions: {
  //     /* Disable refetching because the QRCodeForm component ignores changes to its props */
  //     refetchOnReconnect: false,
  //   },
  // });

  return (
    <>
      <Box width='100%' paddingBlockStart='8' paddingBlockEnd='8'>
        <LegacyCard
          title={'ActionHub setup status'}
          sectioned
          primaryFooterAction={null}
          actions={[{ content: 'Learn More' }]}
        >
          <Banner
            status='info'
            title='ActionHub is preparing your program for first time use'
          >
            <p>
              This process will generate baseline recommendation models for your
              store. The process takes place in the background and typically
              completes within in few minutes, depending on the number of orders
              and customers in your shop. Feel free to navigate to another page
              and return later to check on progress.
            </p>
          </Banner>
          <p style={{ paddingBottom: '16px', paddingTop: '16px' }}>
            <i>
              <b>Current Step</b>: {currentStep}
            </i>
          </p>
          <ProgressBar progress={75} />
        </LegacyCard>
      </Box>
    </>
  )
}
