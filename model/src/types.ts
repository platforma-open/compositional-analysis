import type { GraphMakerState } from "@milaboratories/graph-maker";
import type { PlDataTableStateV2, PlRef } from "@platforma-sdk/model";

/**
 * Workflow-facing args — every user-committed analysis decision. The keys are
 * the ones V1 stored, so an existing project does not go stale the moment it is
 * opened on this version.
 *
 * V1 also declared `title` here, but the UI never wrote it: the title lived in
 * the UI state. It is left out, so the projected args stay byte-identical.
 */
export type BlockArgs = {
  covariateRefs: PlRef[];
  clusterAnnotationRef?: PlRef;
  contrastFactor?: PlRef;
  baseline?: string;
};

/** The V1 args, as they are on disk. Read only by `.upgradeLegacy`. */
export type LegacyArgs = BlockArgs & {
  title?: string;
};

/** The V1 view state, as it is on disk. Read only by `.upgradeLegacy`. */
export type LegacyUiState = {
  title?: string;
  graphStateStackedBar: GraphMakerState;
  graphStateBarplot: GraphMakerState;
  tableState: PlDataTableStateV2;
};

/**
 * Unified V3 data — the args above plus the title and the table and plot view
 * state.
 *
 * Every settings-panel field is an analysis decision the user commits and then
 * presses Run for, so none of them belongs in `prerunArgs`. No V1 field was
 * bent to dodge the staleness gate, so the V1 split is already the split V3
 * wants.
 */
export type BlockData = BlockArgs & {
  title?: string;
  graphStateStackedBar: GraphMakerState;
  graphStateBarplot: GraphMakerState;
  tableState: PlDataTableStateV2;
};
