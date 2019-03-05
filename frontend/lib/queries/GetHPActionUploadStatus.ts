// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { HPUploadStatus } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetHPActionUploadStatus
// ====================================================

export interface GetHPActionUploadStatus_session {
  /**
   * The URL of the most recently-generated HP Action PDF for the current user.
   */
  latestHpActionPdfUrl: string | null;
  /**
   * The status of the HP Action upload (document assembly) process for a user.
   */
  hpActionUploadStatus: HPUploadStatus;
}

export interface GetHPActionUploadStatus {
  session: GetHPActionUploadStatus_session;
}

export const GetHPActionUploadStatus = {
  // The following query was taken from GetHPActionUploadStatus.graphql.
  graphQL: `query GetHPActionUploadStatus {
    session {
        latestHpActionPdfUrl,
        hpActionUploadStatus
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, ): Promise<GetHPActionUploadStatus> {
    return fetchGraphQL(GetHPActionUploadStatus.graphQL);
  }
};

export const fetchGetHPActionUploadStatus = GetHPActionUploadStatus.fetch;