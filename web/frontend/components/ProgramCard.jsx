import { useState } from "react";
import {
  LegacyCard,
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
      <LegacyCard
        title={"Merchant Program: " + program?.program_name}
        sectioned
        primaryFooterAction={null}
      >

          <p>
            [Some details about the program go here]
          </p>
        <p>
          program id: {isLoading ? "-" : program.program_id}
          </p>
      </LegacyCard>
    </>
  );
}
