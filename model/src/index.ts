import type { GraphMakerState } from '@milaboratories/graph-maker';
import type {
  InferOutputsType,
  PFrameHandle,
  PlDataTableState,
  PlRef } from '@platforma-sdk/model';
import {
  BlockModel,
  createPFrameForGraphs,
  createPlDataTable,
  createPlDataTableSheet,
  getUniquePartitionKeys,
  // isPColumn,
  isPColumnSpec,
} from '@platforma-sdk/model';

export type UiState = {
  graphStateStackedBar: GraphMakerState;
  graphStateBarplot: GraphMakerState;
  tableState: PlDataTableState;
};

export type BlockArgs = {
  countsRef?: PlRef;
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

  .withUiState<UiState>({

    graphStateStackedBar: {
      title: 'UMAP',
      template: 'dots',
    },
    graphStateBarplot: {
      title: 'tSNE',
      template: 'dots',
    },
    tableState: {
      gridState: {},
      pTableParams: {
        sorting: [],
        filters: [],
      },
    },
  })

  .output('countsOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec)
      && spec.name === 'pl7.app/rna-seq/countMatrix' && spec.domain?.['pl7.app/rna-seq/normalized'] === 'false'
    , { includeNativeLabel: true, addLabelAsSuffix: true }),
  )

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
      table: createPlDataTable(ctx, pCols, ctx.uiState?.tableState),
      sheets: r.map((values, i) => createPlDataTableSheet(ctx, anchor.spec.axesSpec[i], values)),
    };
  })

  .output('boxplotPf', (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve('boxplotPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }
    return createPFrameForGraphs(ctx, pCols);
  })

  .output('stackedBarPf', (ctx): PFrameHandle | undefined => {
    const pCols = ctx.outputs?.resolve('boxplotPf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }
    return createPFrameForGraphs(ctx, pCols);
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .sections((_ctx) => ([
    { type: 'link', href: '/', label: 'Main' },
  ]))

  .title((ctx) =>
    ctx.args.title
      ? `Compositional Analysis - ${ctx.args.title}`
      : 'Compositional Analysis',
  )

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
