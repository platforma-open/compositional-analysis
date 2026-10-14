---
'@platforma-open/milaboratories.compositional-analysis.model': minor
'@platforma-open/milaboratories.compositional-analysis.ui': minor
'@platforma-open/milaboratories.compositional-analysis': minor
'@platforma-open/milaboratories.compositional-analysis.workflow': patch
'@platforma-open/milaboratories.compositional-analysis.sccoda': patch
'@platforma-open/milaboratories.compositional-analysis.replicates': patch
---

Migrate the block onto the structurer (block-tools 2.16.13) with a full SDK upgrade: model and ui-vue 1.84.17, workflow-tengo 6.15.0, tengo-builder 4.1.11, test 1.84.18. Adopts the tool-managed layout, the slim facade, and the mandatory `kind/` package. Its init-params contract is `{ clusterAnnotationRef?, covariateRefs?, contrastFactor?, baseline? }`.

Move the model to BlockModelV3, because the 1.84 SDK no longer ships the V1 `BlockModel`. Existing projects are upgraded once by `.upgradeLegacy`, and the args keep the V1 keys, so opening a project does not make it stale. Run stays blocked until the cell annotation, a covariate, the contrast factor and the baseline are chosen, and the UI now shows the reason.

Give every data conversion an explicit 16 GiB / 1 CPU budget, and export the covariates once instead of twice. The exchange with the Python tools stays CSV, because the scCODA runenv ships no Parquet reader. Results are unchanged.
