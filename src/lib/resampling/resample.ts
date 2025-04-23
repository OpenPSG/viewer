// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

// Resampling function to change the number of samples in a signal.
// This function can either upsample or downsample the input array.
// It uses linear interpolation to fill in the gaps when upsampling.
export function resample(
  input: number[],
  n: number,
  upsample: boolean = true,
): number[] {
  const length = input.length;

  // If upsampling is disabled and target size is greater, return input
  if (!upsample && n >= length) return input;

  // If input is already the desired size, return as-is
  if (length === n) return [...input];

  // Handle case where n is 1: return middle value
  if (n === 1) {
    const mid = Math.floor((length - 1) / 2);
    return [input[mid]];
  }

  const result: number[] = [];
  const step = (length - 1) / (n - 1);

  for (let i = 0; i < n; i++) {
    const idx = i * step;
    const left = Math.floor(idx);
    const right = Math.ceil(idx);

    if (left === right) {
      result.push(input[left]);
    } else {
      const ratio = idx - left;
      const value = input[left] * (1 - ratio) + input[right] * ratio;
      result.push(value);
    }
  }

  return result;
}
