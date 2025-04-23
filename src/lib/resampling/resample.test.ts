// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import { describe, it, expect } from "vitest";
import { resample } from "./resample";

describe("resample", () => {
  it("returns input if length is less than or equal to n and upsample is disabled", () => {
    expect(resample([1, 2], 3, false)).toEqual([1, 2]);
    expect(resample([1, 2, 3], 3, false)).toEqual([1, 2, 3]);
  });

  it("correctly downsamples", () => {
    const input = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const expected = [0, 25, 50, 75, 100]; // Linearly interpolated
    const result = resample(input, 5);
    expect(result).toEqual(expected);
  });

  it("returns evenly spaced interpolated values", () => {
    const input = [0, 100];
    const expected = [0, 25, 50, 75, 100];
    const result = resample(input, 5);
    expect(result).toEqual(expected);
  });

  it("handles floating point steps correctly", () => {
    const input = [0, 2, 4, 6, 8, 10];
    const result = resample(input, 4);
    const expected = [0, 3.3333333333333335, 6.666666666666667, 10];
    expect(result).toEqual(expected);
  });

  it("works with only one output sample", () => {
    expect(resample([5, 10, 15, 20], 1)).toEqual([10]);
  });

  it("returns first and last elements at boundaries", () => {
    const input = [3, 6, 9, 12, 15];
    const result = resample(input, 3);
    expect(result[0]).toBe(3);
    expect(result[2]).toBe(15);
  });

  it("handles repeated values correctly", () => {
    const input = [5, 5, 5, 5];
    const result = resample(input, 3);
    const expected = [5, 5, 5]; // All interpolated values should still be 5
    expect(result).toEqual(expected);
  });

  it("interpolates with negative values", () => {
    const input = [-100, 0, 100];
    const result = resample(input, 5);
    const expected = [-100, -50, 0, 50, 100];
    expect(result).toEqual(expected);
  });

  it("handles short input with upsampling enabled", () => {
    const input = [10, 20];
    const result = resample(input, 5, true);
    const expected = [10, 12.5, 15, 17.5, 20];
    expect(result).toEqual(expected);
  });
});
