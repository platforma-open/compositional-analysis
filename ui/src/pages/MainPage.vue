<script setup lang="ts">
import '@milaboratories/graph-maker/styles';
import type { PlRef } from '@platforma-sdk/model';
import { plRefsEqual } from '@platforma-sdk/model';
import { PlAgDataTableV2, PlAlert, PlBlockPage, PlBtnGhost, PlDropdown, PlDropdownMulti, PlDropdownRef, PlLogView, PlMaskIcon24, PlSlideModal, usePlDataTableSettingsV2 } from '@platforma-sdk/ui-vue';
import { useApp } from '../app';
import { computed, reactive, ref } from 'vue';

const app = useApp();

const sccodaLogOpen = ref(false);

const tableSettings = usePlDataTableSettingsV2({
  model: () => app.model.outputs.resultsPt?.table,
  sheets: () => app.model.outputs.resultsPt?.sheets,
});

const data = reactive<{
  settingsOpen: boolean;
}>({
  settingsOpen: app.model.args.clusterAnnotationRef === undefined,
});

// Update page title by cluster annotation
function setClusterAnnotation(clusterAnnotationRef?: PlRef) {
  app.model.args.clusterAnnotationRef = clusterAnnotationRef;
  if (clusterAnnotationRef) {
    const annotationLabel = app.model.outputs.clusterAnnotationOptions?.find((o) => plRefsEqual(o.ref, clusterAnnotationRef))?.label;
    if (annotationLabel)
      app.model.ui.title = 'Compositional Analysis - ' + annotationLabel;
  } else {
    app.model.ui.title = undefined;
  }
}

const covariateOptions = computed(() => {
  return app.model.outputs.metadataOptions?.map((v) => ({
    value: v.ref,
    label: v.label,
  })) ?? [];
});

const contrastFactorOptions = computed(() => {
  return app.model.args.covariateRefs.map((ref) => ({
    value: ref,
    label: covariateOptions.value.find((m) => m.value.name === ref.name)?.label ?? '',
  }));
});

const baselineOptions = computed(() => {
  return app.model.outputs.baselineOptions?.map((v) => ({
    value: v,
    label: v,
  }));
});

</script>

<template>
  <PlBlockPage>
    <template #title>Compositional Analysis</template>
    <template #append>
      <PlBtnGhost @click.stop="() => sccodaLogOpen = true">
        Logs
        <template #append>
          <PlMaskIcon24 name="progress" />
        </template>
      </PlBtnGhost>
      <PlBtnGhost @click.stop="() => data.settingsOpen = true">
        Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>
    <PlAgDataTableV2
      v-model="app.model.ui.tableState"
      :settings="tableSettings"
      show-export-button
    />
    <PlSlideModal v-model="data.settingsOpen">
      <template #title>Settings</template>
      <PlDropdownRef
        :model-value="app.model.args.clusterAnnotationRef"
        :options="app.model.outputs.clusterAnnotationOptions"
        label="Cell annotation"
        required
        :validate="(value: unknown) => value === undefined ? 'Cell annotation is required' : undefined"
        clearable
        @update:model-value="setClusterAnnotation"
      >
        <template #tooltip>
          <div>
            <strong>Cell type or cluster annotation</strong><br/>
            Select the cell type or cluster annotation data. This defines the cellular populations to analyze for compositional differences.
          </div>
        </template>
      </PlDropdownRef>

      <PlDropdownMulti
        v-model="app.model.args.covariateRefs"
        :options="covariateOptions"
        label="Covariates"
        required
        :validate="(value: unknown) => !value || (Array.isArray(value) && value.length === 0) ? 'At least one covariate is required' : undefined"
      >
        <template #tooltip>
          <div>
            <strong>Metadata variables</strong><br/>
            Select metadata variables that may influence cell composition (e.g., experimental conditions, time points, treatments, patient characteristics).
          </div>
        </template>
      </PlDropdownMulti>

      <PlDropdown
        v-model="app.model.args.contrastFactor"
        :options="contrastFactorOptions"
        label="Contrast factor"
        required
        :validate="(value: unknown) => value === undefined ? 'Contrast factor is required' : undefined"
        :disabled="contrastFactorOptions.length === 0"
      >
        <template #tooltip>
          <div>
            <strong>Main experimental variable</strong><br/>
            Choose the main experimental variable to compare (e.g., treatment vs control, disease vs healthy). This will be tested for compositional differences.
          </div>
        </template>
      </PlDropdown>

      <PlDropdown
        v-model="app.model.args.baseline"
        :options="baselineOptions"
        label="Baseline condition"
        required
        :validate="(value: unknown) => value === undefined ? 'Baseline condition is required' : undefined"
        :disabled="!baselineOptions || baselineOptions.length === 0"
      >
        <template #tooltip>
          <div>
            <strong>Reference condition</strong><br/>
            Select the reference condition for comparison (e.g., 'control', 'untreated', 'healthy'). Compositional changes will be reported relative to this baseline.
          </div>
        </template>
      </PlDropdown>
      <!-- Warning for replicates analysis method -->
      <PlAlert v-if="app.model.outputs.replicateWarning" type="warn">
        {{ app.model.outputs.replicateWarning }}
      </PlAlert>
    </PlSlideModal>
    <PlSlideModal v-model="sccodaLogOpen" width="80%">
      <template #title>scCODA Log</template>
      <PlLogView :log-handle="app.model.outputs.sccodaOutput"/>
    </PlSlideModal>
  </PlBlockPage>
</template>
