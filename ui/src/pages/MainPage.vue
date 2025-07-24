<script setup lang="ts">
import '@milaboratories/graph-maker/styles';
import { PlAgDataTableV2, PlBlockPage, PlBtnGhost, PlDropdown, PlDropdownMulti, PlDropdownRef, PlMaskIcon24, PlSlideModal, usePlDataTableSettingsV2 } from '@platforma-sdk/ui-vue';
import { useApp } from '../app';
import { computed, reactive } from 'vue';
import type { PlRef } from '@platforma-sdk/model';
import { plRefsEqual } from '@platforma-sdk/model';

const app = useApp();

const tableSettings = usePlDataTableSettingsV2({
  model: () => app.model.outputs.resultsPt?.table,
  sheets: () => app.model.outputs.resultsPt?.sheets,
});

const data = reactive<{
  settingsOpen: boolean;
}>({
  settingsOpen: app.model.args.countsRef === undefined,
});

function setInput(inputRef?: PlRef) {
  app.model.args.countsRef = inputRef;
  if (inputRef)
    app.model.args.title = app.model.outputs.countsOptions?.find((o) => plRefsEqual(o.ref, inputRef))?.label;
  else
    app.model.args.title = undefined;
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
    <template #title>Cluster Markers</template>
    <template #append>
      <!-- PlAgDataTableToolsPanel controls showing  Export column and filter-->
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
      show-columns-panel
      show-export-button
    />
    <PlSlideModal v-model="data.settingsOpen">
      <template #title>Settings</template>
      <PlDropdownRef
        v-model="app.model.args.countsRef" :options="app.model.outputs.countsOptions"
        label="Select dataset"
        clearable @update:model-value="setInput"
      />
      <PlDropdownRef
        v-model="app.model.args.clusterAnnotationRef" :options="app.model.outputs.clusterAnnotationOptions"
        label="Cell annotation"
      />
      <PlDropdownMulti v-model="app.model.args.covariateRefs" :options="covariateOptions" label="Covariates" />
      <PlDropdown v-model="app.model.args.contrastFactor" :options="contrastFactorOptions" label="Contrast factor" />
      <PlDropdown v-model="app.model.args.baseline" :options="baselineOptions" label="Baseline" />
    </PlSlideModal>
  </PlBlockPage>
</template>
