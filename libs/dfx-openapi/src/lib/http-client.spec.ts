/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols
import { HttpClient, HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OpenAPIHttpClient, createOpenAPIHttpClient } from './http-client';
import { AgreementCloseReason, paths } from './test-api-path.spec';

describe('OpenAPIHttpClient type tests', () => {
  let api: OpenAPIHttpClient<paths>;
  let httpTesting: HttpTestingController;
  beforeEach(() => {
    void TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    api = createOpenAPIHttpClient<paths>(TestBed.inject(HttpClient), {
      baseUrl: 'http://localhost',
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('check get type with query params', () => {
    api
      .request('get', '/v1/team', {
        params: {
          query: {
            page: 1,
            size: 1,
            sort: ['name', 'desc'],
          },
        },
      })
      .subscribe((response) => {
        const numberOfItems = response.numberOfItems;
        const numberOfPages = response.numberOfPages;
      });
    api
      .get('/v1/team', {
        params: {
          query: {
            page: 1,
            size: 1,
            sort: ['name', 'desc'],
          },
        },
      })
      .subscribe((response) => {
        const numberOfItems = response.numberOfItems;
        const numberOfPages = response.numberOfPages;
      });

    expect(true).toBeTruthy();
  });

  it('check get single type with path param', () => {
    api
      .get('/v1/team/{id}', {
        params: {
          path: {
            id: 'test',
          },
        },
      })
      .subscribe((response) => {
        const id = response.id;
        const name = response.name;
      });

    expect(true).toBeTruthy();
  });

  it('check post', () => {
    api
      .post('/v1/team', {
        body: {
          name: 'test',
        },
      })
      .subscribe((response) => {
        const id = response.id;
        const name = response.name;
      });

    const request = httpTesting.expectOne('http://localhost/v1/team');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'test' });
    request.flush({ id: 'team-id', name: 'test' });
  });

  it('does not widen object bodies to strings', () => {
    api.post('/v1/team', {
      // @ts-expect-error Object-only request bodies must remain structured.
      body: JSON.stringify({ name: 'test' }),
    });

    expect(true).toBeTruthy();
  });

  it('check put', () => {
    api
      .put('/v1/team', {
        body: {
          id: '1234',
          name: 'test',
        },
      })
      .subscribe((response) => {
        const id = response.id;
        const name = response.name;
      });

    const request = httpTesting.expectOne('http://localhost/v1/team');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ id: '1234', name: 'test' });
    request.flush({ id: '1234', name: 'test' });
  });

  it('check delete', () => {
    api
      .delete('/v1/team/{id}', {
        params: {
          path: {
            id: 'test',
          },
        },
      })
      .subscribe();

    const request = httpTesting.expectOne('http://localhost/v1/team/test');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null);
  });

  it('check optional multipart/form-data post body', () => {
    const formData = new FormData();
    formData.append('file', new Blob(), 'document.pdf');

    api.post('/v1/session/{sessionId}/document', {
      params: {
        path: {
          sessionId: 'test',
        },
      },
      body: formData,
    });

    expect(true).toBeTruthy();
  });

  it('serializes a JSON enum body and sets its content type', () => {
    api
      .post('/v1/task/{taskId}/agreement/{agreementId}/close', {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        params: {
          path: {
            taskId: 'task-id',
            agreementId: 'agreement-id',
          },
        },
        body: JSON.stringify(AgreementCloseReason.UserRequest),
      })
      .subscribe();

    const request = httpTesting.expectOne('http://localhost/v1/task/task-id/agreement/agreement-id/close');
    expect(request.request.body).toBe(JSON.stringify(AgreementCloseReason.UserRequest));
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('serializes a JSON string-literal union body and sets its content type', () => {
    api
      .post('/v1/task/{taskId}/agreement/{agreementId}/close-with-string-reason', {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        params: {
          path: {
            taskId: 'task-id',
            agreementId: 'agreement-id',
          },
        },
        body: JSON.stringify('USER_REQUEST'),
      })
      .subscribe();

    const request = httpTesting.expectOne('http://localhost/v1/task/task-id/agreement/agreement-id/close-with-string-reason');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(JSON.stringify('USER_REQUEST'));
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('preserves a text/plain string body and its content type', () => {
    api
      .post('/v1/message', {
        headers: new HttpHeaders({ 'Content-Type': 'text/plain' }),
        body: 'plain text message',
      })
      .subscribe();

    const request = httpTesting.expectOne('http://localhost/v1/message');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe('plain text message');
    expect(request.request.headers.get('Content-Type')).toBe('text/plain');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
