import { kind } from "@platforma-open/milaboratories.compositional-analysis.kind";
import { createPlDataTableStateV2, DataModelBuilder } from "@platforma-sdk/model";
import type { BlockData, LegacyArgs, LegacyUiState } from "./types";

export const blockDataModel = new DataModelBuilder({ kind })
  .from<BlockData>("v1")
  // V1 kept these in two buckets and V3 keeps one. The title comes from the UI
  // state, where the UI wrote it; the unused args copy is dropped.
  .upgradeLegacy<LegacyArgs, LegacyUiState>(({ args, uiState }) => {
    const { title: _unusedArgsTitle, ...blockArgs } = args;
    return {
      ...blockArgs,
      title: uiState.title,
      graphStateStackedBar: uiState.graphStateStackedBar,
      graphStateBarplot: uiState.graphStateBarplot,
      tableState: uiState.tableState,
    };
  })
  .init(({ params }) => ({
    covariateRefs: params?.covariateRefs ?? [],
    clusterAnnotationRef: params?.clusterAnnotationRef,
    contrastFactor: params?.contrastFactor,
    baseline: params?.baseline,

    graphStateStackedBar: {
      title: "Cell Group Composition",
      template: "stackedBar",
      currentTab: null,
    },
    graphStateBarplot: {
      title: "Cell Group Abundance",
      template: "bar",
      currentTab: null,
    },
    tableState: createPlDataTableStateV2(),
  }));
