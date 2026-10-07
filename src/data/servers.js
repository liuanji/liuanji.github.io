/// <reference types="vite/client" />

// Base URL of the gpu-status Cloudflare Worker that relays the GPU servers' status
// (see servermonitor/worker/README.md), e.g. 'https://gpu-status.<subdomain>.workers.dev'.
// Until it is set, /top says that server status is not available yet.
const deployedUrl = '';

// VITE_GPU_STATUS_URL overrides it for local development, e.g. a `wrangler dev` Worker.
export const gpuStatusUrl = (import.meta.env.VITE_GPU_STATUS_URL || deployedUrl).replace(/\/$/, '');
