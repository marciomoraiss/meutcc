/// <reference types="@cloudflare/workers-types" />

type RuntimeBindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

declare global {
  // The Worker entry installs immutable binding handles for route modules.
  var __MEUTCC_BINDINGS__: RuntimeBindings | undefined;
}

export function setRuntimeBindings(bindings: RuntimeBindings) {
  globalThis.__MEUTCC_BINDINGS__ = bindings;
}

export function getRuntimeBindings(): RuntimeBindings {
  const bindings = globalThis.__MEUTCC_BINDINGS__;
  if (!bindings?.DB || !bindings?.BUCKET) {
    throw new Error("Os serviços de dados do MEUTCC ainda não estão disponíveis.");
  }
  return bindings;
}
