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

import { FilterCoeffs } from "./IIRCoeffs";
import {
  runMultiFilter,
  runMultiFilterReverse,
  evaluatePhase,
  ExtendedFrequencyResponse,
} from "./utils";
import { Complex } from "./Complex";

interface ComplexBiquad {
  b0: Complex;
  b1: Complex;
  b2: Complex;
  a1: Complex;
  a2: Complex;
  k: Complex;
  z: [number, number];
}

interface CoeffSummary {
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

interface ResponseParams {
  Fs: number;
  Fr: number;
}

interface Peak {
  sample: number;
  value: number;
}

interface ResponseExtrema {
  out: number[];
  max?: Peak;
  min?: Peak;
}

export class IIRFilter {
  private cf: ComplexBiquad[] = [];
  private cc: CoeffSummary[] = [];
  private readonly cone = new Complex(1, 0);

  constructor(private readonly filter: FilterCoeffs[]) {
    for (const stage of filter) {
      this.cf.push({
        b0: new Complex(stage.b[0]),
        b1: new Complex(stage.b[1]),
        b2: new Complex(stage.b[2]),
        a1: new Complex(stage.a[0]),
        a2: new Complex(stage.a[1]),
        k: new Complex(stage.k ?? 1),
        z: [0, 0],
      });

      this.cc.push({
        b1: stage.b[1] / stage.b[0],
        b2: stage.b[2] / stage.b[0],
        a1: stage.a[0],
        a2: stage.a[1],
      });
    }
  }

  private runStage(s: ComplexBiquad, input: number): number {
    const temp = input * s.k.re - s.a1.re * s.z[0] - s.a2.re * s.z[1];
    const output = s.b0.re * temp + s.b1.re * s.z[0] + s.b2.re * s.z[1];
    s.z[1] = s.z[0];
    s.z[0] = temp;
    return output;
  }

  private doStep(input: number, coeffs: ComplexBiquad[]): number {
    return coeffs.reduce((out, stage) => this.runStage(stage, out), input);
  }

  private biquadResponse(
    params: ResponseParams,
    s: ComplexBiquad,
  ): ExtendedFrequencyResponse {
    const theta = (-2 * Math.PI * params.Fr) / params.Fs;
    const z = new Complex(Math.cos(theta), Math.sin(theta));

    const numerator = s.k.mul(s.b0.add(z.mul(s.b1.add(s.b2.mul(z)))));

    const denominator = this.cone.add(z.mul(s.a1.add(s.a2.mul(z))));

    const h = numerator.div(denominator);
    const mag = h.magnitude();

    return {
      magnitude: mag,
      phase: h.phase(),
      dBmagnitude: 20 * Math.log10(mag),
    };
  }

  private calcResponse(params: ResponseParams): ExtendedFrequencyResponse {
    let magnitude = 1;
    let phase = 0;

    for (const stage of this.cf) {
      const r = this.biquadResponse(params, stage);
      magnitude *= r.magnitude!;
      phase += r.phase;
    }

    return {
      magnitude,
      phase,
      dBmagnitude: 20 * Math.log10(magnitude),
    };
  }

  private reinitStages(): ComplexBiquad[] {
    return this.filter.map((stage) => ({
      b0: new Complex(stage.b[0]),
      b1: new Complex(stage.b[1]),
      b2: new Complex(stage.b[2]),
      a1: new Complex(stage.a[0]),
      a2: new Complex(stage.a[1]),
      k: new Complex(stage.k ?? 1),
      z: [0, 0],
    }));
  }

  private calcInputResponse(input: number[]): number[] {
    return runMultiFilter(input, this.reinitStages(), this.doStep.bind(this));
  }

  private predefinedResponse(def: (n: number) => number, length: number) {
    const input = Array.from({ length }, (_, i) => def(i));
    const out = this.calcInputResponse(input);
    const result: ResponseExtrema = { out };

    for (let i = 1; i < out.length - 1; i++) {
      if (!result.max && out[i] > out[i + 1]) {
        result.max = { sample: i, value: out[i] };
      }
      if (result.max && !result.min && out[i] < out[i + 1]) {
        result.min = { sample: i, value: out[i] };
        break;
      }
    }

    return result;
  }

  private getComplRes(n1: number, n2: number) {
    const disc = (n1 / 2) ** 2 - n2;
    const re = -n1 / 2;
    if (disc < 0) {
      const im = Math.sqrt(-disc);
      return [new Complex(re, im), new Complex(re, -im)];
    } else {
      const sqrtDisc = Math.sqrt(disc);
      return [new Complex(re + sqrtDisc), new Complex(re - sqrtDisc)];
    }
  }

  private getPZ() {
    return this.cc.map((c) => ({
      z: this.getComplRes(c.b1, c.b2),
      p: this.getComplRes(c.a1, c.a2),
    }));
  }

  public singleStep(input: number): number {
    return this.doStep(input, this.cf);
  }

  public multiStep(input: number[], overwrite = false): number[] {
    return runMultiFilter(input, this.cf, this.doStep.bind(this), overwrite);
  }

  public filtfilt(input: number[], overwrite = false): number[] {
    return runMultiFilterReverse(
      runMultiFilter(input, this.cf, this.doStep.bind(this), overwrite),
      this.cf,
      this.doStep.bind(this),
      true,
    );
  }

  public simulate(input: number[]): number[] {
    return this.calcInputResponse(input);
  }

  public stepResponse(length: number) {
    return this.predefinedResponse(() => 1, length);
  }

  public impulseResponse(length: number) {
    return this.predefinedResponse((i) => (i === 0 ? 1 : 0), length);
  }

  public responsePoint(params: ResponseParams): ExtendedFrequencyResponse {
    return this.calcResponse(params);
  }

  public response(resolution = 100): ExtendedFrequencyResponse[] {
    const results = Array.from({ length: resolution }, (_, i) =>
      this.calcResponse({ Fs: resolution * 2, Fr: i }),
    );
    evaluatePhase(results);
    return results;
  }

  public polesZeros() {
    return this.getPZ();
  }

  public reinit() {
    this.cf.forEach((stage) => (stage.z = [0, 0]));
  }
}
