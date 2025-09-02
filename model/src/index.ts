import type { GraphMakerState } from '@milaboratories/graph-maker';
import type {
  InferOutputsType,
  PColumnIdAndSpec,
  PFrameHandle,
  PlDataTableStateV2,
  PlRef,
} from '@platforma-sdk/model';
import {
  BlockModel,
  createPlDataTableSheet,
  createPlDataTableStateV2,
  createPlDataTableV2,
  getUniquePartitionKeys,
  isPColumn,
  isPColumnSpec,
} from '@platforma-sdk/model';

export type UiState = {
  title?: string;
  graphStateStackedBar: GraphMakerState;
  graphStateBarplot: GraphMakerState;
  tableState: PlDataTableStateV2;
};

export type BlockArgs = {
  covariateRefs: PlRef[];
  clusterAnnotationRef?: PlRef;
  contrastFactor?: PlRef;
  baseline?: string;
  title?: string;
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    covariateRefs: [],
  })

  .argsValid((ctx) => {
    // Check if all required fields are provided
    if (!ctx.args.clusterAnnotationRef) {
      return false;
    }

    if (!ctx.args.covariateRefs || ctx.args.covariateRefs.length === 0) {
      return false;
    }

    if (!ctx.args.contrastFactor) {
      return false;
    }

    if (!ctx.args.baseline || ctx.args.baseline.trim() === '') {
      return false;
    }

    return true;
  })

  .withUiState<UiState>({
    graphStateStackedBar: {
      title: 'Cell Group Composition',
      template: 'stackedBar',
      currentTab: null,
    },
    graphStateBarplot: {
      title: 'Cell Group Abundance',
      template: 'bar',
      currentTab: null,
    },
    tableState: createPlDataTableStateV2(),
  })

  .output('metadataOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec) && spec.name === 'pl7.app/metadata'),
  )

  .output('clusterAnnotationOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec)
      && (spec.name === 'pl7.app/rna-seq/leidencluster' || spec.name === 'pl7.app/rna-seq/cellType')
    , { includeNativeLabel: true, addLabelAsSuffix: true }),
  )

  .output('baselineOptions', (ctx) => {
    if (!ctx.args.contrastFactor) return undefined;

    const data = ctx.resultPool.getDataByRef(ctx.args.contrastFactor)?.data;

    // @TODO need a convenient method in API
    const values = data?.getDataAsJson<Record<string, string>>()?.['data'];
    if (!values) return undefined;

    return [...new Set(Object.values(values))];
  })

  .output('replicateWarning', (ctx) => {
    const analysisMethod = ctx.outputs?.resolve('analysisMethod')?.getDataAsJson();
    if (analysisMethod === 'foldChange') {
      return 'Insufficient replicates for statistical testing. Analysis will show fold-changes only, without significance testing.';
    }
    return undefined;
  })

  .output('resultsPt', (ctx) => {
    // Get the original PFrame from workflow
    const pCols = ctx.outputs?.resolve('resultsPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Filter out q-value column if analysis method is foldChange (insufficient replicates)
    const analysisMethod = ctx.outputs?.resolve('analysisMethod')?.getDataAsJson();

    // Filter the input columns before passing to createPlDataTableV2
    const filteredPCols = analysisMethod === 'foldChange'
      ? pCols.filter((col) => col.spec.name !== 'pl7.app/rna-seq/qvalue')
      : pCols;

    if (filteredPCols.length === 0) return undefined;

    const anchor = filteredPCols[0];
    if (!anchor) return undefined;

    const r = getUniquePartitionKeys(anchor.data);
    if (!r) return undefined;

    return {
      table: createPlDataTableV2(ctx, filteredPCols, ctx.uiState?.tableState),
      sheets: r.map((values, i) => createPlDataTableSheet(ctx, anchor.spec.axesSpec[i], values)),
    };
  })

  .output('boxplotPf', (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve('boxplotPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Get all metadata columns that are compatible with the Sample axis
    const metadataCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn)
      .filter((col) =>
        col.spec.name === 'pl7.app/metadata'
        && col.spec.axesSpec.some((axis) => axis.name === 'pl7.app/sampleId'),
      );

    // Use createPFrame directly to limit to only these specific columns
    // (instead of createPFrameForGraphs which adds all compatible workspace columns)
    const allCols = [...pCols, ...metadataCols];
    return ctx.createPFrame(allCols);
  })

  .output('stackedBarPf', (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve('stackedBarPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Get all metadata columns that are compatible with the Sample axis
    const metadataCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn)
      .filter((col) =>
        col.spec.name === 'pl7.app/metadata'
        && col.spec.axesSpec.some((axis) => axis.name === 'pl7.app/sampleId'),
      );

    // Use createPFrame directly to limit to only these specific columns
    // (instead of createPFrameForGraphs which adds all compatible workspace columns)
    const allCols = [...pCols, ...metadataCols];
    return ctx.createPFrame(allCols);
  })

  // Returns PColumn specs for barplot defaults
  .output('barplotPCols', (ctx) => {
    const pCols = ctx.outputs?.resolve('boxplotPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Get all metadata columns that are compatible with the Sample axis
    const metadataCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn)
      .filter((col) =>
        col.spec.name === 'pl7.app/metadata'
        && col.spec.axesSpec.some((axis) => axis.name === 'pl7.app/sampleId'),
      );

    const allCols = [...pCols, ...metadataCols];
    return allCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  // Returns PColumn specs for stacked barplot defaults
  .output('stackedBarPCols', (ctx) => {
    const pCols = ctx.outputs?.resolve('stackedBarPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    // Get all metadata columns that are compatible with the Sample axis
    const metadataCols = ctx.resultPool
      .getData()
      .entries.map((c) => c.obj)
      .filter(isPColumn)
      .filter((col) =>
        col.spec.name === 'pl7.app/metadata'
        && col.spec.axesSpec.some((axis) => axis.name === 'pl7.app/sampleId'),
      );

    const allCols = [...pCols, ...metadataCols];
    return allCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)
  .output('sccodaOutput', (ctx) => ctx.outputs?.resolve('sccodaOutput')?.getLogHandle())

  .sections((_ctx) => ([
    { type: 'link', href: '/', label: 'Main' },
    { type: 'link', href: '/barplot', label: 'Cell Group Abundance' },
    { type: 'link', href: '/stacked-bar', label: 'Cell Group Composition' },
  ]))

  .title((ctx) => ctx.uiState.title ?? 'Compositional Analysis')

  .done(2);

export type BlockOutputs = InferOutputsType<typeof model>;
