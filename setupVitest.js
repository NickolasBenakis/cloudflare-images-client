import { vi } from "vitest";
//setupVitest.js or similar file
import createFetchMock from "vitest-fetch-mock";

const fetchMocker = createFetchMock(vi);

// sets globalThis.fetch and globalThis.fetchMock to our mocked version
fetchMocker.enableMocks();
