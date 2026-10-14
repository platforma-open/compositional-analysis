# @platforma-open/milaboratories.compositional-analysis.workflow

## 1.3.1

### Patch Changes

- f983494: Migrate the block onto the structurer (block-tools 2.16.13) with a full SDK upgrade: model and ui-vue 1.84.17, workflow-tengo 6.15.0, tengo-builder 4.1.11, test 1.84.18. Adopts the tool-managed layout, the slim facade, and the mandatory `kind/` package. Its init-params contract is `{ clusterAnnotationRef?, covariateRefs?, contrastFactor?, baseline? }`.

  Move the model to BlockModelV3, because the 1.84 SDK no longer ships the V1 `BlockModel`. Existing projects are upgraded once by `.upgradeLegacy`, and the args keep the V1 keys, so opening a project does not make it stale. Run stays blocked until the cell annotation, a covariate, the contrast factor and the baseline are chosen, and the UI now shows the reason.

  Give every data conversion an explicit 16 GiB / 1 CPU budget, and export the covariates once instead of twice. The exchange with the Python tools stays CSV, because the scCODA runenv ships no Parquet reader. Results are unchanged.

- Updated dependencies [f983494]
  - @platforma-open/milaboratories.compositional-analysis.sccoda@1.3.2
  - @platforma-open/milaboratories.compositional-analysis.replicates@1.1.3

## 1.3.0

### Minor Changes

- 0006597: Enable deduplication, add exports and update metadata

## 1.2.4

### Patch Changes

- c2844f3: Update to Parquet

## 1.2.3

### Patch Changes

- de0a744: contemplate import-scrna block inputs
- 8959c8e: Workj with import-scrna blocks

## 1.2.2

### Patch Changes

- 8c2c5c2: technical release
- 372dfdd: technical release
- 878db6e: technical release
- 723b20a: technical release
- Updated dependencies [8c2c5c2]
- Updated dependencies [372dfdd]
- Updated dependencies [878db6e]
- Updated dependencies [723b20a]
  - @platforma-open/milaboratories.compositional-analysis.replicates@1.1.2
  - @platforma-open/milaboratories.compositional-analysis.sccoda@1.3.1

## 1.2.1

### Patch Changes

- Updated dependencies [f2217a7]
  - @platforma-open/milaboratories.compositional-analysis.sccoda@1.3.0

## 1.2.0

### Minor Changes

- ea22f1e: Improved results interpretation when scCODA is run.

### Patch Changes

- Updated dependencies [ea22f1e]
  - @platforma-open/milaboratories.compositional-analysis.sccoda@1.2.0

## 1.1.1

### Patch Changes

- Updated dependencies [970c3f3]
  - @platforma-open/milaboratories.compositional-analysis.replicates@1.1.1
  - @platforma-open/milaboratories.compositional-analysis.sccoda@1.1.1

## 1.1.0

### Minor Changes

- c444884: Block first version

### Patch Changes

- Updated dependencies [c444884]
  - @platforma-open/milaboratories.compositional-analysis.replicates@1.1.0
  - @platforma-open/milaboratories.compositional-analysis.sccoda@1.1.0
