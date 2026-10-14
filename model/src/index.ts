import { kind } from "@platforma-open/milaboratories.compositional-analysis.kind";
import type {
  InferOutputsType,
  PColumnIdAndSpec,
  PFrameHandle,
  TreeNodeAccessor,
} from "@platforma-sdk/model";
import {
  BlockModelV3,
  createPlDataTableSheet,
  createPlDataTableV2,
  getUniquePartitionKeys,
  isPColumn,
  isPColumnSpec,
} from "@platforma-sdk/model";
import { blockDataModel } from "./dataModel";
import type { BlockArgs } from "./types";

export { blockDataModel } from "./dataModel";
export type { BlockArgs, BlockData } from "./types";

export const platforma = BlockModelV3.create({ dataModel: blockDataModel, kind })

  // The run gate. Throwing shows the reason in the UI. Replaces V1's
  // `.argsValid`. The projection strips the title and the view state and
  // returns the same keys V1 stored as args.
  .args<BlockArgs>((data): BlockArgs => {
    const {
      title: _title,
      graphStateStackedBar: _graphStateStackedBar,
      graphStateBarplot: _graphStateBarplot,
      tableState: _tableState,
      ...args
    } = data;

    if (args.clusterAnnotationRef === undefined) {
      throw new Error("Cell annotation is required");
    }
    if (args.covariateRefs.length === 0) {
      throw new Error("At least one covariate is required");
    }
    if (args.contrastFactor === undefined) {
      throw new Error("Contrast factor is required");
    }
    if (args.baseline === undefined || args.baseline.trim() === "") {
      throw new Error("Baseline condition is required");
    }

    return args;
  })

  // Inverse of the kind's init-params contract. `title` is left out: the UI
  // derives it from the cell annotation label.
  .templateParams((data) => ({
    clusterAnnotationRef: data.clusterAnnotationRef,
    covariateRefs: data.covariateRefs,
    contrastFactor: data.contrastFactor,
    baseline: data.baseline,
  }))

  .output("metadataOptions", (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec) && spec.name === "pl7.app/metadata"),
  )

  .output("clusterAnnotationOptions", (ctx) =>
    ctx.resultPool.getOptions(
      (spec) =>
        isPColumnSpec(spec) &&
        (spec.name === "pl7.app/rna-seq/leidencluster" || spec.name === "pl7.app/rna-seq/cellType"),
      { includeNativeLabel: true, addLabelAsSuffix: true },
    ),
  )

  .output("baselineOptions", (ctx) => {
    // `ctx.data`, not `ctx.args`: the args lambda throws until a baseline is
    // chosen, and these options are what the user chooses it from.
    if (!ctx.data.contrastFactor) return undefined;

    const data = ctx.resultPool.getDataByRef(ctx.data.contrastFactor)?.data;

    // @TODO need a convenient method in API
    const values = data?.getDataAsJson<Record<string, string>>()?.["data"];
    if (!values) return undefined;

    return [...new Set(Object.values(values))];
  })

  .output("replicateWarning", (ctx) => {
    const analysisMethod = ctx.outputs?.resolve("analysisMethod")?.getDataAsJson();
    if (analysisMethod === "foldChange") {
      return "Insufficient replicates for statistical testing. Analysis will show fold-changes only, without significance testing.";
    }
    return undefined;
  })

  // The table and its sheets are two outputs: PlAgDataTableV2 (via
  // usePlDataTableSettingsV2) takes the table status-wrapped and the sheets
  // as a plain value.
  .outputWithStatus("resultsPt", (ctx) => {
    const pCols = ctx.outputs?.resolve("resultsPf")?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    const analysisMethod = ctx.outputs?.resolve("analysisMethod")?.getDataAsJson();
    const filteredPCols = visibleResultColumns(pCols, analysisMethod);
    if (filteredPCols.length === 0) return undefined;

    return createPlDataTableV2(ctx, filteredPCols, ctx.data.tableState);
  })

  .output("resultsSheets", (ctx) => {
    const pCols = ctx.outputs?.resolve("resultsPf")?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    const analysisMethod = ctx.outputs?.resolve("analysisMethod")?.getDataAsJson();
    const anchor = visibleResultColumns(pCols, analysisMethod)[0];
    if (!anchor) return undefined;

    const r = getUniquePartitionKeys(anchor.data);
    if (!r) return undefined;

    return r.map((values, i) => createPlDataTableSheet(ctx, anchor.spec.axesSpec[i], values));
  })

  // `withStatus` on the two plot frames: GraphMaker's `p-frame` prop takes the
  // status-wrapped output.
  .outputWithStatus("boxplotPf", (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve("boxplotPf")?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Get all metadata columns that are compatible with the Sample axis
    const metadataCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter(
        (col) =>
          col.spec.name === "pl7.app/metadata" &&
          col.spec.axesSpec.some((axis) => axis.name === "pl7.app/sampleId"),
      );

    // Use createPFrame directly to limit to only these specific columns
    // (instead of createPFrameForGraphs which adds all compatible workspace columns)
    const allCols = [...pCols, ...metadataCols];
    return ctx.createPFrame(allCols);
  })

  .outputWithStatus("stackedBarPf", (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve("stackedBarPf")?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Get all metadata columns that are compatible with the Sample axis
    const metadataCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter(
        (col) =>
          col.spec.name === "pl7.app/metadata" &&
          col.spec.axesSpec.some((axis) => axis.name === "pl7.app/sampleId"),
      );

    // Use createPFrame directly to limit to only these specific columns
    // (instead of createPFrameForGraphs which adds all compatible workspace columns)
    const allCols = [...pCols, ...metadataCols];
    return ctx.createPFrame(allCols);
  })

  // Returns PColumn specs for barplot defaults
  .output("barplotPCols", (ctx) => {
    const pCols = ctx.outputs?.resolve("boxplotPf")?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Get all metadata columns that are compatible with the Sample axis
    const metadataCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter(
        (col) =>
          col.spec.name === "pl7.app/metadata" &&
          col.spec.axesSpec.some((axis) => axis.name === "pl7.app/sampleId"),
      );

    const allCols = [...pCols, ...metadataCols];
    return allCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        }) satisfies PColumnIdAndSpec,
    );
  })

  // Returns PColumn specs for stacked barplot defaults
  .output("stackedBarPCols", (ctx) => {
    const pCols = ctx.outputs?.resolve("stackedBarPf")?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Get all metadata columns that are compatible with the Sample axis
    const metadataCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn<TreeNodeAccessor>)
      .filter(
        (col) =>
          col.spec.name === "pl7.app/metadata" &&
          col.spec.axesSpec.some((axis) => axis.name === "pl7.app/sampleId"),
      );

    const allCols = [...pCols, ...metadataCols];
    return allCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        }) satisfies PColumnIdAndSpec,
    );
  })

  .output("isRunning", (ctx) => ctx.outputs?.getIsReadyOrError() === false)
  .output("sccodaOutput", (ctx) => ctx.outputs?.resolve("sccodaOutput")?.getLogHandle())

  .sections((_ctx) => [
    { type: "link", href: "/", label: "Main" },
    { type: "link", href: "/barplot", label: "Cell Group Abundance" },
    { type: "link", href: "/stacked-bar", label: "Cell Group Composition" },
  ])

  .title((ctx) => ctx.data.title ?? "Compositional Analysis")

  .done();

export type BlockOutputs = InferOutputsType<typeof platforma>;

// Internals

/**
 * With too few replicates the analysis falls back to plain fold changes, so the
 * scCODA columns are left out of the table.
 */
function visibleResultColumns<T extends { spec: { name: string } }>(
  pCols: T[],
  analysisMethod: unknown,
): T[] {
  if (analysisMethod !== "foldChange") return pCols;
  return pCols.filter(
    (col) =>
      col.spec.name !== "pl7.app/rna-seq/qvalue" &&
      col.spec.name !== "pl7.app/rna-seq/relativelog2foldchange",
  );
}
