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
      if (!app.model.args.contrastFactor) return undefined;

      const refName = app.model.args.contrastFactor.name;
      const refHash = refName.split('.')[1]; // Extract hash from "metadata.GV3QZB5LVZYYGRJMHWSD3DNH"

      if (refHash) {
        // Find the metadata column that contains the reference hash in its JSON representation
        const foundCol = barplotPCols.find((col) => {
          if (col.spec.name !== 'pl7.app/metadata') return false;

          // Check if this column's JSON contains the reference hash
          const colStr = JSON.stringify(col);
          return colStr.includes(refHash) || colStr.includes(refName);
        });

        if (foundCol) {
          return foundCol;
        }
      }

      // Fallback to first metadata column if no match found
      return barplotPCols.find((col) => col.spec.name === 'pl7.app/metadata');
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
