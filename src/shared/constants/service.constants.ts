/**
 * This service's path segment behind the API Gateway (rename when forking,
 * e.g. `tenancy`). Health and Swagger are served under
 * `/api/v1/<SERVICE_PATH>/health` and `/api/v1/<SERVICE_PATH>/swagger`, so the
 * gateway can route them to the right service.
 */
export const SERVICE_PATH = 'sample';
