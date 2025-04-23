/* Originally from: https://github.com/markert/fili.js
 *
 * Copyright (c) 2014 Florian Markert
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export interface ExtendedFrequencyResponse {
  magnitude?: number;
  phase: number;
  dBmagnitude?: number;
  unwrappedPhase?: number;
  groupDelay?: number;
  phaseDelay?: number;
}

// Evaluate the unwrapped phase and calculate group and phase delays
export function evaluatePhase(res: ExtendedFrequencyResponse[]): void {
  const pi = Math.PI;
  const twoPi = 2 * pi;
  const phaseArr: number[] = res.map((r) => r.phase);

  res[0].unwrappedPhase = res[0].phase;
  res[0].groupDelay = 0;

  for (let i = 1; i < res.length; i++) {
    const diff = phaseArr[i] - phaseArr[i - 1];

    if (diff > pi) {
      for (let j = i; j < phaseArr.length; j++) {
        phaseArr[j] -= twoPi;
      }
    } else if (diff < -pi) {
      for (let j = i; j < phaseArr.length; j++) {
        phaseArr[j] += twoPi;
      }
    }

    res[i].unwrappedPhase = Math.abs(phaseArr[i]);
    res[i].phaseDelay = res[i].unwrappedPhase! / (i / res.length);
    res[i].groupDelay = Math.abs(
      (res[i].unwrappedPhase! - res[i - 1].unwrappedPhase!) / (pi / res.length),
    );
  }

  if (res.length > 2) {
    res[0].phaseDelay = res[1].phaseDelay;
    res[0].groupDelay = res[1].groupDelay;
    res[1].phaseDelay = res[2].phaseDelay;
    res[1].groupDelay = res[2].groupDelay;
  }
}

// Apply a sequence of filters forward to an input signal
export function runMultiFilter<T>(
  input: number[],
  filter: T[],
  doStep: (sample: number, filter: T[]) => number,
  overwrite = false,
): number[] {
  const output = overwrite ? input : new Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = doStep(input[i], filter);
  }
  return output;
}

// Apply a sequence of filters backward to an input signal (reverse-time processing)
export function runMultiFilterReverse<T>(
  input: number[],
  filter: T[],
  doStep: (sample: number, filter: T[]) => number,
  overwrite = false,
): number[] {
  const output = overwrite ? input : new Array(input.length);
  for (let i = input.length - 1; i >= 0; i--) {
    output[i] = doStep(input[i], filter);
  }
  return output;
}
