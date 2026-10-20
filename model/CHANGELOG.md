# @platforma-open/milaboratories.compositional-analysis.model

## 1.3.1

### Patch Changes

- a782cbf: Release every package through npm trusted publishing (OIDC) so each package's trusted publisher is used before it expires.

## 1.3.0

### Minor Changes

- f983494: Migrate the block onto the structurer (block-tools 2.16.13) with a full SDK upgrade: model and ui-vue 1.84.17, workflow-tengo 6.15.0, tengo-builder 4.1.11, test 1.84.18. Adopts the tool-managed layout, the slim facade, and the mandatory `kind/` package. Its init-params contract is `{ clusterAnnotationRef?, covariateRefs?, contrastFactor?, baseline? }`.

  Move the model to BlockModelV3, because the 1.84 SDK no longer ships the V1 `BlockModel`. Existing projects are upgraded once by `.upgradeLegacy`, and the args keep the V1 keys, so opening a project does not make it stale. Run stays blocked until the cell annotation, a covariate, the contrast factor and the baseline are chosen, and the UI now shows the reason.

  Give every data conversion an explicit 16 GiB / 1 CPU budget, and export the covariates once instead of twice. The exchange with the Python tools stays CSV, because the scCODA runenv ships no Parquet reader. Results are unchanged.

## 1.2.1

### Patch Changes

- 8c2c5c2: technical release
- 372dfdd: technical release
- 878db6e: technical release
- 723b20a: technical release

## 1.2.0

### Minor Changes

- f2217a7: Fixed outputs bug created by last update when not enough replicates present

## 1.1.1

### Patch Changes

- 970c3f3: Update SDK and python

## 1.1.0

### Minor Changes

- c444884: Block first version
