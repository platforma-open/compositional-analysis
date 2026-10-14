import { platforma } from "@platforma-open/milaboratories.compositional-analysis.model";
import { defineAppV3 } from "@platforma-sdk/ui-vue";
import MainPage from "./pages/MainPage.vue";
import BarplotPage from "./pages/BarplotPage.vue";
import StackedBarPage from "./pages/StackedBarPage.vue";

export const sdkPlugin = defineAppV3(platforma, (app) => {
  return {
    progress: () => {
      return app.model.outputs.isRunning;
    },
    routes: {
      "/": () => MainPage,
      "/barplot": () => BarplotPage,
      "/stacked-bar": () => StackedBarPage,
    },
  };
});

export const useApp = sdkPlugin.useApp;
