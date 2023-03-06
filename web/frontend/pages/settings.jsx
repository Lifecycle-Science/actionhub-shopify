import {
  Page,
  AlphaStack,
  AlphaCard,
  Columns,
  Box,
  Text,
  TextField,
  Divider,
  Form, ContextualSaveBar
} from '@shopify/polaris'

import { TitleBar } from '@shopify/app-bridge-react'

import { ProgramCard } from '../components'
import { OnboardingProgress } from '../components'

export default function ProgramSettings () {
  const breadcrumbs = [{ content: 'Program', url: '/' }]

  return (
    // This example is for guidance purposes. Copying it will come with caveats.
    <Page
      divider
      primaryAction={{ content: 'View on your store', disabled: true }}
      secondaryActions={[
        {
          content: 'Duplicate',
          accessibilityLabel: 'Secondary action label',
          onAction: () => alert('Duplicate action')
        }
      ]}
    >
      <OnboardingProgress />
      <AlphaStack gap='8' align='center'>
        <Columns columns={{ xs: '1fr', md: '2fr 4fr' }}>
          <Box
            as='section'
            paddingInlineStart={{ xs: 4, sm: 0 }}
            paddingInlineEnd={{ xs: 2, sm: 0 }}
          >
            <AlphaStack gap='4'>
              <Text as='h3' variant='headingMd'>
                InterJambs
              </Text>
              <Text as='p' variant='bodyMd'>
                Interjambs are the rounded protruding bits of your puzzlie piece
              </Text>
            </AlphaStack>
          </Box>
          <AlphaCard roundedAbove='sm'>
            <AlphaStack gap='4' fullWidth>
              <TextField label='Interjamb style' />
              <TextField label='Interjamb ratio' />
            </AlphaStack>
          </AlphaCard>
        </Columns>
        <Box width='100%'>
        <Divider borderStyle="divider" />
        </Box>
        <Columns columns={{ xs: '1fr', md: '2fr 4fr' }}>
          <Box
            as='section'
            paddingInlineStart={{ xs: 2, sm: 0 }}
            paddingInlineEnd={{ xs: 2, sm: 0 }}
          >
            <AlphaStack gap='4'>
              <Text as='h3' variant='headingMd'>
                Dimensions
              </Text>
              <Text as='p' variant='bodyMd'>
                Interjambs are the rounded protruding bits of your puzzlie piece
              </Text>
            </AlphaStack>
          </Box>
          <AlphaCard roundedAbove='sm'>
            <AlphaStack gap='4' fullWidth>
              <TextField label='Horizontal' />
              <TextField label='Interjamb ratio' />
            </AlphaStack>
          </AlphaCard>
        </Columns>
      </AlphaStack>
    </Page>
  )
}
