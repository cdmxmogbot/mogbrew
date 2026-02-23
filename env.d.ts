/// <reference path="./worker-configuration.d.ts" />

declare module 'cloudflare:workers' {
  namespace Cloudflare {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface Env extends CloudflareEnv {}
  }
}
