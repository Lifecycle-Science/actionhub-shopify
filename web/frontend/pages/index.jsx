import { useNavigate, TitleBar, Loading } from '@shopify/app-bridge-react'
import {
  Card,
  EmptyState,
  Layout,
  Page,
  SkeletonBodyText,
  LegacyCard
} from '@shopify/polaris'
import { useAppQuery } from '../hooks'

import { ProgramCard } from '../components'
import { SegmentsIndex } from '../components'
import { OnboardingProgress } from '../components'

export default function HomePage () {
  /*
    Add an App Bridge useNavigate hook to set up the navigate function.
    This function modifies the top-level browser URL so that you can
    navigate within the embedded app and keep the browser in sync on reload.
  */
  const navigate = useNavigate()

  /* useAppQuery wraps react-query and the App Bridge authenticatedFetch function */
  const {
    data: QRCodes,
    isLoading,

    /*
    react-query provides stale-while-revalidate caching.
    By passing isRefetching to Index Tables we can show stale data and a loading state.
    Once the query refetches, IndexTable updates and the loading state is removed.
    This ensures a performant UX.
  */
    isRefetching
  } = useAppQuery({
    url: '/api/qrcodes'
  })

  /* Set the QR codes to use in the list */
  const qrCodesMarkup = QRCodes?.length ? (
    <QRCodeIndex QRCodes={QRCodes} loading={isRefetching} />
  ) : null

  /* loadingMarkup uses the loading component from AppBridge and components from Polaris  */
  const loadingMarkup = isLoading ? (
    <Card sectioned>
      <Loading />
      <SkeletonBodyText />
    </Card>
  ) : null

  /*
    Use Polaris Page and TitleBar components to create the page layout,
    and include the empty state contents set above.
  */
  return (
    <Page fullWidth>
      <TitleBar
        title='Growth Segments'
        // primaryAction={{
        //   content: "Refresh Segments",
        //   onAction: () => navigate("/qrcodes/new"),
        // }}
      />

      <OnboardingProgress />
      {/* <div style={{paddingTop: "24px"}}> */}
      <SegmentsIndex />
      {/* {loadingMarkup}
      {qrCodesMarkup} */}
          {/* </div> */}
    </Page>
  )
}
