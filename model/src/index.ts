import type { GraphMakerState } from '@milaboratories/graph-maker';
import type {
  InferOutputsType,
  PColumnIdAndSpec,
  PFrameHandle,
  PlDataTableStateV2,
  PlRef } from '@platforma-sdk/model';
import {
  BlockModel,
  createPlDataTableV2,
  createPlDataTableStateV2,
  createPlDataTableSheet,
  getUniquePartitionKeys,
  isPColumn,
  isPColumnSpec,
} from '@platforma-sdk/model';

export type UiState = {
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
    },
    graphStateBarplot: {
      title: 'Cell Group Abundance',
      template: 'bar',
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

  .output('resultsPt', (ctx) => {
    const pCols = ctx.outputs?.resolve('resultsPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    const anchor = pCols[0];
    if (!anchor) return undefined;

    const r = getUniquePartitionKeys(anchor.data);
    if (!r) return undefined;

    return {
      table: createPlDataTableV2(ctx, pCols, ctx.uiState?.tableState),
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

  .sections((_ctx) => ([
    { type: 'link', href: '/', label: 'Main' },
    { type: 'link', href: '/barplot', label: 'Cell Group Abundance' },
    { type: 'link', href: '/stacked-bar', label: 'Cell Group Composition' },
  ]))

  .title((ctx) =>
    ctx.args.title
      ? `Compositional Analysis - ${ctx.args.title}`
      : 'Compositional Analysis',
  )

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
