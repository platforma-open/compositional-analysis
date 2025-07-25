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
    // Safety check for required outputs
    if (!app.model.outputs.stackedBarPCols || !app.model.args.contrastFactor) {
      console.log('StackedBarPage: Missing required outputs or contrastFactor');
      return undefined;
    }

    const stackedBarPCols = app.model.outputs.stackedBarPCols;
    console.log('StackedBarPage: Available columns:', stackedBarPCols.map((col) => ({ name: col.spec.name, axes: col.spec.axesSpec?.length })));

    // DETAILED DEBUGGING - Log ALL column details
    console.log('StackedBarPage: ALL COLUMNS DETAILED:');
    stackedBarPCols.forEach((col, index) => {
      console.log(`Column ${index}:`, {
        name: col.spec.name,
        domain: col.spec.domain,
        axesSpec: col.spec.axesSpec,
        axesCount: col.spec.axesSpec?.length,
        fullSpec: col.spec,
      });
    });

    // Safely find columns
    const relativeAbundanceCol = stackedBarPCols.find((col) => col.spec.name === 'pl7.app/rna-seq/relativeAbundance');

    // LOG RELATIVE ABUNDANCE COLUMN DETAILS
    if (relativeAbundanceCol) {
      console.log('StackedBarPage: RELATIVE ABUNDANCE COLUMN DETAILS:', {
        spec: relativeAbundanceCol.spec,
        axesSpec: relativeAbundanceCol.spec.axesSpec,
        axesCount: relativeAbundanceCol.spec.axesSpec?.length,
        axis0: relativeAbundanceCol.spec.axesSpec?.[0],
        axis1: relativeAbundanceCol.spec.axesSpec?.[1],
      });
    }

    // Dynamically resolve which metadata column matches the selected contrast factor reference
    const contrastFactorCol = (() => {
      if (!app.model.args.contrastFactor) return undefined;

      const refName = app.model.args.contrastFactor.name;
      const refHash = refName.split('.')[1]; // Extract hash from "metadata.GV3QZB5LVZYYGRJMHWSD3DNH"

      if (refHash) {
        // Find the metadata column that contains the reference hash in its JSON representation
        const foundCol = stackedBarPCols.find((col) => {
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
      return stackedBarPCols.find((col) => col.spec.name === 'pl7.app/metadata');
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
        selectedSource: relativeAbundanceCol.spec.axesSpec[1], // cellGroup axis from relativeAbundance column
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
      v-if="app.model.outputs.stackedBarPf"
      v-model="app.model.ui.graphStateStackedBar"
      chartType="discrete"
      :data-state-key="app.model.args.contrastFactor?.name"
      :p-frame="app.model.outputs.stackedBarPf"
      :default-options="defaultOptions"
    />
  </PlBlockPage>
</template>
