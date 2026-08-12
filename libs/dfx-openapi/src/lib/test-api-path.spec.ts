/* eslint-disable */

describe('test-api-path placeholder', () => {
  it('placeholder', () => {
    expect(true).toBeTruthy();
  });
});

export enum AgreementCloseReason {
  UserRequest = 'USER_REQUEST',
  ProviderDecision = 'PROVIDER_DECISION',
}

export interface paths {
  '/v1/team': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get all teams, if global admin return all teams, else user specific teams
     * @description <b>Required auth:</b> ROLE_ADMIN | TEAM_MEMBER
     */
    get: operations['getAll_1'];
    /**
     * Update team
     * @description <b>Required auth:</b> ROLE_ADMIN | TEAM_ADMIN
     */
    put: operations['update_1'];
    /**
     * Add team
     * @description <b>Required auth:</b> ROLE_ADMIN
     */
    post: operations['create_1'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/team/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get team
     * @description <b>Required auth:</b> ROLE_ADMIN | TEAM_MEMBER
     */
    get: operations['get_1'];
    put?: never;
    post?: never;
    /**
     * Delete team
     * @description <b>Required auth:</b> ROLE_ADMIN | TEAM_ADMIN
     */
    delete: operations['delete_1'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/session/{sessionId}/document': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['uploadDocument'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/task/{taskId}/agreement/{agreementId}/close': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['closeAgreement'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/message': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['createPlainTextMessage'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/task/{taskId}/agreement/{agreementId}/close-with-string-reason': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['closeAgreementWithStringReason'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
type webhooks = Record<string, never>;
interface components {
  schemas: {
    IdResponse: {
      id: string;
    };
    UpdateTeamDto: {
      id: string;
      name: string;
    };
    TeamResponse: {
      id: string;
      name: string;
      /** Format: date-time */
      deleted?: string;
    };
    CreateTeamDto: {
      name: string;
    };
    PaginatedResponseTeamResponse: {
      /** Format: int64 */
      numberOfItems: number;
      /** Format: int32 */
      numberOfPages: number;
      data: components['schemas']['TeamResponse'][];
    };
    UploadDocumentBody: {
      /**
       * Format: binary
       * @description Document file
       */
      file: string;
    };
    /** @description Reason for closing an agreement */
    AgreementCloseReason: AgreementCloseReason;
    /** @description Reason for closing an agreement */
    AgreementCloseStringReason: 'USER_REQUEST' | 'PROVIDER_DECISION';
  };
  responses: never;
  parameters: {
    /** @description Session ID */
    SessionId: string;
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
}
type $defs = Record<string, never>;
interface operations {
  getAll_1: {
    parameters: {
      query?: {
        /** @description Zero-based page index (0..N) */
        page?: number;
        /** @description The size of the page to be returned */
        size?: number;
        /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
        sort?: string[];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          '*/*': components['schemas']['PaginatedResponseTeamResponse'];
        };
      };
    };
  };
  update_1: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateTeamDto'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          '*/*': components['schemas']['TeamResponse'];
        };
      };
    };
  };
  create_1: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateTeamDto'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          '*/*': components['schemas']['TeamResponse'];
        };
      };
    };
  };
  get_1: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          '*/*': components['schemas']['TeamResponse'];
        };
      };
    };
  };
  delete_1: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  uploadDocument: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Session ID */
        sessionId: components['parameters']['SessionId'];
      };
      cookie?: never;
    };
    requestBody?: {
      content: {
        'multipart/form-data': components['schemas']['UploadDocumentBody'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  closeAgreement: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Task ID */
        taskId: string;
        /** @description Agreement ID */
        agreementId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AgreementCloseReason'];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  createPlainTextMessage: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'text/plain': string;
      };
    };
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  closeAgreementWithStringReason: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Task ID */
        taskId: string;
        /** @description Agreement ID */
        agreementId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AgreementCloseStringReason'];
      };
    };
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
