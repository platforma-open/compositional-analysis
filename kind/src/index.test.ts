import { describe, expect, it } from "vitest";
import { kind } from "./index";

const parse = (params: unknown) => kind.parseInitializationParams(params);

/** Refs exactly as `resultPool.getOptions` mints them for the dropdowns. */
const CLUSTERS_REF = {
  __isRef: true,
  blockId: "leiden-clustering-1",
  name: "pl7.app/rna-seq/leidencluster",
} as const;
const CONDITION_REF = {
  __isRef: true,
  blockId: "samples-and-data-1",
  name: "pl7.app/metadata",
} as const;

describe("the params envelope", () => {
  it.each([
    ["null", null],
    ["a number", 5],
    ["an array", ["baseline"]],
    ["a string", "baseline=control"],
  ])("rejects %s", (_label, value) => {
    expect(() => parse(value)).toThrow();
  });

  it("accepts an empty object — a block created with nothing seeded", () => {
    expect(parse({})).toEqual({});
  });

  it("drops keys the contract does not name", () => {
    expect(parse({ baseline: "control", title: "Compositional Analysis - X" })).toEqual({
      baseline: "control",
    });
  });

  it("returns a full set of params unchanged", () => {
    const params = {
      clusterAnnotationRef: CLUSTERS_REF,
      covariateRefs: [CONDITION_REF],
      contrastFactor: CONDITION_REF,
      baseline: "control",
    };
    expect(parse(params)).toEqual(params);
  });
});

describe("refs", () => {
  it.each([
    ["an object missing the ref marker", { blockId: "b1", name: "pl7.app/metadata" }],
    ["a bare column name", "pl7.app/metadata"],
    ["null", null],
  ])("rejects %s", (_label, ref) => {
    expect(() => parse({ clusterAnnotationRef: ref })).toThrow("'clusterAnnotationRef' must be");
    expect(() => parse({ contrastFactor: ref })).toThrow("'contrastFactor' must be");
    expect(() => parse({ covariateRefs: [ref] })).toThrow("'covariateRefs' must be");
  });
});

describe("baseline", () => {
  it("rejects a baseline that is not a string", () => {
    expect(() => parse({ baseline: ["control"] })).toThrow("'baseline' must be");
  });
});
