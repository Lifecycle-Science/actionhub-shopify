import { useState, useEffect, useCallback } from 'react'
import { Box, ProgressBar, Banner, Link } from '@shopify/polaris'
import { useAppQuery, useAuthenticatedFetch } from '../hooks'


export function OnboardingProgress (props) {
  const fetch = useAuthenticatedFetch()

  const [isVisible, setIsVisible] = useState(false)
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
    /*
      Put onboarding progress checks into 
      the console
    */
    if (typeof onboardingStep !== 'undefined') {
      console.log(onboardingStep.step_id)
      setIsVisible(onboardingStep.step_id !== "dismissed")
      props.onOnboardingStep(onboardingStep)
    }
    if ((onboardingStep?.step_progress ?? 0) < 100) {
      if (!isRefetching && !isLoading) {
        console.log('checking onboarding state')
        setTimeout(refetch, 500)
      } else {
        console.log('onboarding state check in progress')
      }
    } else {
      console.log('onboarding checks complete')
    }
  }, [onboardingStep, isRefetching, isLoading])

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

  const bannerInstallingMarkup =
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
        {progressBarMarkup}
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
        {progressBarMarkup}
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
        {progressBarMarkup}
      </Banner>
    ) : null

  const handleBannerDismiss = useCallback(value => {
    // No foreced refresh on filter changes
    setIsVisible(false)
    const method = 'POST'
    const response = fetch(`/api/onboarding/dismiss`, {
      method,
      body: null,
      headers: { "Content-Type": "application/json" },
    });

    console.log('dismiss')
  }, [])

  const bannerCompleteMarkup =
    onboardingStep?.step_id == 'complete' ? (
      <Banner
        status='success'
        title='Installation complete'
        action={{
          content: 'Dismiss',
          onAction: handleBannerDismiss,
        }}
        onDismiss={handleBannerDismiss}
        >
        <p>
          ActionHub has been step up and is ready to use.
          <Link>Learn more about using ActionHub</Link>
        </p>
      </Banner>
    ) : null

  if (!isVisible) {
    return null
  }
  return (
    <>
      <Box width='100%' paddingBlockEnd='8'>
        {bannerInstallingMarkup}
        {bannerWarningNoOrdersMarkup}
        {bannerWarningNoProductsMarkup}
        {bannerCompleteMarkup}
      </Box>
    </>
  )
}
