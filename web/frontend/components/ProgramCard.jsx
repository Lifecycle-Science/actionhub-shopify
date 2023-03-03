import { useState } from "react";
import {
  Card,
  Heading,
  TextContainer,
  DisplayText,
  TextStyle,
} from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function ProgramCard() {
  const emptyToastProps = { content: null };
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const fetch = useAuthenticatedFetch();

  const {
    data: program,
    isLoading,
    isRefetching,
  } = useAppQuery({
    url: `/api/program`,
    reactQueryOptions: {
      /* Disable refetching because the QRCodeForm component ignores changes to its props */
      refetchOnReconnect: false,
    },
  });

  return (
    <>
      <Card
        title="Program Details"
        sectioned
        primaryFooterAction={null}
      >
        <TextContainer spacing="loose">
          <p>
            Sample products are created with a default title and price. You can
            remove them at any time.
          </p>
          <Heading element="h4">
            
            <DisplayText size="medium">
              <TextStyle variation="strong">
              </TextStyle>
            </DisplayText>
          </Heading>

          {isLoading ? "-" : program.program_id}


        </TextContainer>
      </Card>
    </>
  );
}
