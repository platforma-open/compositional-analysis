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
    if (!app.model.outputs.barplotPCols || !app.model.args.contrastFactor) {
      return undefined;
    }

    const barplotPCols = app.model.outputs.barplotPCols;

    // Find required columns
    const abundanceCol = barplotPCols.find((col) => col.spec.name === 'pl7.app/rna-seq/abundance');

    // Dynamically resolve which metadata column matches the selected contrast factor reference
    const contrastFactorCol = (() => {
      const ref = app.model.args.contrastFactor;
      if (!ref) return undefined;

      const col = barplotPCols.find((c) => {
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
        ?? barplotPCols.find((c) => c.spec.name === 'pl7.app/metadata')
      );
    })();

    // Only return defaults if required columns are found and abundance has axes
    if (!abundanceCol || !contrastFactorCol || !abundanceCol.spec.axesSpec || abundanceCol.spec.axesSpec.length < 2) {
      return undefined;
    }

    const defaults: PredefinedGraphOption<'discrete'>[] = [
      {
        inputName: 'y',
        selectedSource: abundanceCol.spec,
      },
      {
        inputName: 'primaryGrouping',
        selectedSource: contrastFactorCol.spec,
      },
      {
        inputName: 'secondaryGrouping',
        selectedSource: abundanceCol.spec.axesSpec[1], // cellGroup axis from abundance column
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
      v-model="app.model.ui.graphStateBarplot"
      chartType="discrete"
      :data-state-key="app.model.args.contrastFactor?.name"
      :p-frame="app.model.outputs.boxplotPf"
      :default-options="defaultOptions"
    />
  </PlBlockPage>
</template>
