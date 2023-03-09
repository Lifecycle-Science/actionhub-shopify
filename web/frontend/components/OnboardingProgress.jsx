import { useState, useEffect } from 'react'
import {
  Box,
  LegacyCard,
  ProgressBar,
  Banner,
  Link
} from '@shopify/polaris'
import { useAppQuery } from '../hooks'
import { propagateErrors } from '@shopify/react-form';

export function OnboardingProgress (props) {
  const [isVisible, setIsVisible] = useState(false);
  const emptyToastProps = { content: null }
  const [toastProps, setToastProps] = useState(emptyToastProps)

  const {
    data: onboardingStep,
    isLoading,
    isRefetching,
    refetch
  } = useAppQuery({
    url: `/api/onboarding`,
    reactQueryOptions: {
      refetchOnReconnect: true
    }
  })

  useEffect(() => {
    if (typeof onboardingStep !== "undefined") {
      // TODO: check if "dismissed"
      setIsVisible(true)
      props.onOnboardingStep(onboardingStep)
    };
    if ((onboardingStep?.step_progress ?? 0) < 100) {
      if (!isRefetching && !isLoading) {
        console.log("checking onboarding state")
        setTimeout(refetch, 500)
      }
      else {
        console.log("onboarding state check in progress")
      }
    } else {
      console.log("onboarding checks complete")
    }
  }, [onboardingStep, isRefetching, isLoading])

  const bannerInstalling =
    (onboardingStep?.step_progress ?? 0) < 100 ? (
      <Banner
        status='info'
        title='ActionHub is preparing your program for first time use'
      >
        <p>
          This process will generate baseline recommendation models for your
          store. The process takes place in the background and typically
          completes within in few minutes, depending on the number of orders and
          customers in your shop. Feel free to navigate to another page and
          return later to check on progress.
        </p>
      </Banner>
    ) : null

  const bannerWarningNoProductsMarkup =
    onboardingStep?.step_id == 'warning_no_products' ? (
      <Banner status='warning' title='No products found'>
        <p>
          No products were found in your shop during the installation process.
          To fullfill its purpose, ActionHub needs products to recommend. As
          products are added to your shop they will also be added to ActionHub.
          <Link>Learn more about how products are used in ActionHub</Link>
        </p>
      </Banner>
    ) : null

  const bannerWarningNoOrdersMarkup =
    onboardingStep?.step_id == 'warning_no_orders' ? (
      <Banner status='warning' title='No orders found'>
        <p>
          No orders were found in your shop during the installation process.
          ActionHub uses order history as the basis for its recommendations. As
          orders are added to your shop they will also be added to ActionHub.
          <Link>Learn more about how orders are used in ActionHub</Link>
        </p>
      </Banner>
    ) : null

  const progressBarMarkup =
    (onboardingStep?.step_progress ?? 0) < 100 ? (
      <div>
        <p style={{ paddingBottom: '16px', paddingTop: '16px' }}>
          <i>
            <b>Current Step</b>: {isLoading ? '' : onboardingStep.step_message}
          </i>
        </p>
        <ProgressBar progress={onboardingStep?.step_progress} />
      </div>
    ) : (
      <p style={{ paddingBottom: '0', paddingTop: '16px' }}>
        <i>ActionHub installation complete</i>
      </p>
    )

    if (!isVisible) {
      return null
    }
  return (
    <>
      <Box width='100%' paddingBlockEnd='8'>
        <LegacyCard
          title={'ActionHub Setup Status'}
          sectioned
          primaryFooterAction={null}
          actions={[{ content: 'Learn More' }]}
        >
          {bannerInstalling}
          {bannerWarningNoOrdersMarkup}
          {bannerWarningNoProductsMarkup}
          {progressBarMarkup}
        </LegacyCard>
      </Box>
    </>
  )
}
