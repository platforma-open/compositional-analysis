import { assertParamsObject, defineBlockKind } from "@platforma-sdk/block-kind";
import type { PlRef } from "@platforma-sdk/model";
import { isPlRef } from "@platforma-sdk/model";
import { name, version } from "../package.json" with { type: "json" };

/**
 * This block's init-params contract — the settings a user picks by hand: the
 * cell annotation, the covariates, the contrast factor and its baseline group.
 *
 * `title` is absent. The UI sets it from the label of the chosen annotation, so
 * there is nothing for a template to carry.
 *
 * Every field is optional. A block with no annotation chosen is ordinary state
 * the UI reaches — it is what a freshly created block looks like — and the
 * projection hands that state back untouched, so a required field would make
 * this block export a file its own kind refuses.
 */
export type BlockParams = {
  clusterAnnotationRef?: PlRef;
  covariateRefs?: PlRef[];
  contrastFactor?: PlRef;
  baseline?: string;
};

// Identity (`name`/`version`) comes from this package's own `package.json`, so
// the on-wire `{name}@{version}` reference can never drift from what npm
// publishes; the bundler inlines the JSON import.
export const kind = defineBlockKind<BlockParams>({
  name,
  version,
  parseInitializationParams,
});

// Internals

/** The same contract at runtime, for params arriving from a template file rather than typed code. */
function parseInitializationParams(value: unknown): BlockParams {
  assertParamsObject(value);

  const { clusterAnnotationRef, covariateRefs, contrastFactor, baseline } = value;

  if (clusterAnnotationRef !== undefined && !isPlRef(clusterAnnotationRef)) {
    throw new Error(refMessage("clusterAnnotationRef"));
  }
  if (
    covariateRefs !== undefined &&
    !(Array.isArray(covariateRefs) && covariateRefs.every(isPlRef))
  ) {
    throw new Error("'covariateRefs' must be a list of references to upstream columns.");
  }
  if (contrastFactor !== undefined && !isPlRef(contrastFactor)) {
    throw new Error(refMessage("contrastFactor"));
  }
  if (baseline !== undefined && typeof baseline !== "string") {
    throw new Error("'baseline' must be a group name.");
  }

  return { clusterAnnotationRef, covariateRefs, contrastFactor, baseline };
}

function refMessage(field: string): string {
  return `'${field}' must be a reference to an upstream column, written as { __isRef: true, blockId, name }.`;
}
