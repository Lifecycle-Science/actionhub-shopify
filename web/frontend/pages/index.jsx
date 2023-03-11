import { useNavigate, TitleBar, Loading } from '@shopify/app-bridge-react'
import { Page } from '@shopify/polaris'
import { useState } from 'react'

import { SegmentsIndex } from '../components'
import { OnboardingProgress } from '../components'

export default function HomePage () {
  /*
    Add an App Bridge useNavigate hook to set up the navigate function.
    This function modifies the top-level browser URL so that you can
    navigate within the embedded app and keep the browser in sync on reload.
  */
  const defaultOnboardingState = {
    step_id: 'loading',
    step_message: '',
    step_progress: 0
  }
  const [onboardingState, setOnboardingState] = useState(defaultOnboardingState)

  const handleOnboardingStep = currentStep => {
    setOnboardingState(currentStep)
  }

  const navigate = useNavigate()

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
      <OnboardingProgress onOnboardingStep={handleOnboardingStep} />
      <SegmentsIndex onboardingState={onboardingState} />
    </Page>
  )
}
