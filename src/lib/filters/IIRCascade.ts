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

import { FilterCoeffs, FilterParams, IIRCoeffs } from "./IIRCoeffs";
import { table, tiTable } from "./IIRFilterTables";

export type FilterBehavior =
  | "lowpass"
  | "highpass"
  | "bandpass"
  | "bandstop"
  | "allpass"
  | "peak"
  | "lowshelf"
  | "highshelf"
  | "lowpassMZ"
  | "highpassBT"
  | "lowpassBT";

export type FilterCharacteristic =
  | "butterworth"
  | "bessel"
  | "tschebyscheff05"
  | "tschebyscheff1"
  | "tschebyscheff2"
  | "tschebyscheff3"
  | "allpass";

interface CascadeParams extends FilterParams {
  order?: number;
  transform?: "matchedZ" | "bilinear";
  behavior: FilterBehavior;
  characteristic?: FilterCharacteristic;
  oneDb?: boolean;
}

// This function calculates the coefficients for a cascade of IIR biquad filters
// based on the provided parameters.
export function calcCoeffs(params: CascadeParams): FilterCoeffs[] {
  const filters: FilterCoeffs[] = [];

  const order = Math.min(params.order ?? 0, 12);

  for (let i = 0; i < order; i++) {
    let q: number;
    let f: number;
    let fd: number;

    if (params.transform === "matchedZ") {
      const filterParams: FilterParams = {
        Fs: params.Fs,
        Fc: params.Fc,
        preGain: params.preGain ?? false,
        as: tiTable[params.characteristic!].as[order - 1][i],
        bs: tiTable[params.characteristic!].bs[order - 1][i],
      };

      filters.push(IIRCoeffs.lowpassMZ(filterParams));
    } else {
      if (!params.characteristic) {
        throw new Error("Characteristic is required");
      }

      if (params.characteristic === "butterworth") {
        q = 0.5 / Math.sin((Math.PI / (order * 2)) * (i + 0.5));
        f = 1;
      } else {
        const characteristic = params.characteristic as keyof typeof table;
        q = table[characteristic].q[order - 1][i];
        f = params.oneDb
          ? table[characteristic].f1dB[order - 1][i]
          : table[characteristic].f3dB[order - 1][i];
      }

      fd = params.behavior === "highpass" ? params.Fc / f : params.Fc * f;

      if (
        (params.behavior === "bandpass" || params.behavior === "bandstop") &&
        params.characteristic === "bessel"
      ) {
        fd = (Math.sqrt(order) * fd) / order;
      }

      const filterParams: FilterParams = {
        Fs: params.Fs,
        Fc: fd,
        Q: q,
        BW: params.BW ?? 0,
        gain: params.gain ?? 0,
        preGain: params.preGain ?? false,
      };

      switch (params.behavior) {
        case "lowpass":
          filters.push(IIRCoeffs.lowpass(filterParams));
          break;
        case "highpass":
          filters.push(IIRCoeffs.highpass(filterParams));
          break;
        case "bandpass":
          filters.push(IIRCoeffs.bandpass(filterParams));
          break;
        case "bandstop":
          filters.push(IIRCoeffs.bandstop(filterParams));
          break;
        case "allpass":
          filters.push(IIRCoeffs.allpass(filterParams));
          break;
        case "peak":
          filters.push(IIRCoeffs.peak(filterParams));
          break;
        case "lowshelf":
          filters.push(IIRCoeffs.lowshelf(filterParams));
          break;
        case "highshelf":
          filters.push(IIRCoeffs.highshelf(filterParams));
          break;
        case "lowpassMZ":
          filters.push(IIRCoeffs.lowpassMZ(filterParams));
          break;
        case "highpassBT":
          filters.push(IIRCoeffs.highpassBT(filterParams));
          break;
        case "lowpassBT":
          filters.push(IIRCoeffs.lowpassBT(filterParams));
          break;
        default:
          throw new Error(`Unknown filter behavior: ${params.behavior}`);
      }
    }
  }

  return filters;
}
