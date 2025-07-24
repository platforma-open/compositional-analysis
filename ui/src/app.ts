import { model } from '@platforma-open/milaboratories.compositional-analysis.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import MainPage from './pages/MainPage.vue';
import BoxplotPage from './pages/BoxplotPage.vue';
import StackedBarPage from './pages/StackedBarPage.vue';

export const sdkPlugin = defineApp(model, () => {
  return {
    routes: {
      '/': () => MainPage,
      '/barplot': () => BoxplotPage,
      '/stacked-bar': () => StackedBarPage,
    },
  };
});

export const useApp = sdkPlugin.useApp;
