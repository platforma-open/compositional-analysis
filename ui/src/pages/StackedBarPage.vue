<script setup lang="ts">
import type { PredefinedGraphOption } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';
import '@milaboratories/graph-maker/styles';
import { PlBlockPage } from '@platforma-sdk/ui-vue';
import { computed } from 'vue';

import { useApp } from '../app';

const app = useApp();

const defaultOptions = computed((): PredefinedGraphOption<'discrete'>[] | undefined => {
  try {
    // Return undefined if data not ready yet
    if (!app.model.outputs.stackedBarPCols || !app.model.args.contrastFactor) {
      return undefined;
    }

    const stackedBarPCols = app.model.outputs.stackedBarPCols;

    // Find required columns
    const relativeAbundanceCol = stackedBarPCols.find((col) => col.spec.name === 'pl7.app/rna-seq/relativeAbundance');

    // Dynamically resolve which metadata column matches the selected contrast factor reference
    const contrastFactorCol = (() => {
      const ref = app.model.args.contrastFactor;
      if (!ref) return undefined;

      const col = stackedBarPCols.find((c) => {
        if (!c.columnId || typeof c.columnId !== 'string') return false;
        try {
          const colRef = JSON.parse(c.columnId);
          return colRef.name === ref.name && colRef.blockId === ref.blockId;
        } catch {
          return false;
        }
      });

      return (
        col
        ?? stackedBarPCols.find((c) => c.spec.name === 'pl7.app/metadata')
      );
    })();

    // Only return defaults if required columns are found and relativeAbundance has axes
    if (!relativeAbundanceCol || !contrastFactorCol || !relativeAbundanceCol.spec.axesSpec || relativeAbundanceCol.spec.axesSpec.length < 2) {
      return undefined;
    }

    const defaults: PredefinedGraphOption<'discrete'>[] = [
      {
        inputName: 'y',
        selectedSource: relativeAbundanceCol.spec,
      },
      {
        inputName: 'primaryGrouping',
        selectedSource: contrastFactorCol.spec,
      },
      {
        inputName: 'secondaryGrouping',
        // cellGroup axis from relativeAbundance column
        selectedSource: relativeAbundanceCol.spec.axesSpec[1],
      },
    ];

    return defaults;
  } catch (_error) {
    return undefined;
  }
});
</script>

<template>
  <PlBlockPage>
    <GraphMaker
      v-model="app.model.ui.graphStateStackedBar"
      chartType="discrete"
      :data-state-key="app.model.args.contrastFactor?.name"
      :p-frame="app.model.outputs.stackedBarPf"
      :default-options="defaultOptions"
    />
  </PlBlockPage>
</template>
