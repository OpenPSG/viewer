// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect, beforeAll } from "vitest";
import { EDFHeader, EDFAnnotation } from "./edftypes";
import { EDFReader } from "./edfreader";

let header: EDFHeader;
let samples: number[];
let annotations: EDFAnnotation[] = [];

beforeAll(() => {
  const buffer = readFileSync(
    join(__dirname, "testdata/test_generator_2.edf"),
  ).buffer;
  const reader = new EDFReader(buffer);
  header = reader.readHeader();
  const signalIndex = header.signals.findIndex((signal) =>
    signal.label.includes("sine 8.5 Hz"),
  );
  samples = reader.readSignal(header, signalIndex, 0);
  annotations = reader.readAnnotations(header);
});

describe("EDFReader", () => {
  it("reads the header correctly", () => {
    expect(header.version).toBe("0");
    expect(header.patientId).toBe("X X X X");
    expect(header.recordingId).toBe("Startdate 10-DEC-2009 X X test_generator");
    expect(header.startTime.toDateString()).toBe(new Date(2009, 11, 10, 12, 44, 2).toDateString());
    expect(header.headerBytes).toBe(3328);
    expect(header.reserved).toBe("EDF+C");
    expect(header.dataRecords).toBe(600);
    expect(header.recordDuration).toBe(1);
    expect(header.signalCount).toBe(12);

    const expectedSignals = [
      "squarewave",
      "ramp",
      "pulse",
      "ECG",
      "noise",
      "sine 1 Hz",
      "sine 8 Hz",
      "sine 8.5 Hz",
      "sine 15 Hz",
      "sine 17 Hz",
      "sine 50 Hz",
      "EDF Annotations",
    ];

    expectedSignals.forEach((label, index) => {
      const signal = header.signals[index];
      expect(signal.label).toBe(label);
      expect(signal.transducerType).toBe("");
      expect(signal.prefiltering).toBe("");
      expect(signal.digitalMin).toBe(-32768);
      expect(signal.digitalMax).toBe(32767);
      expect(signal.reserved).toBe("");

      if (label === "EDF Annotations") {
        expect(signal.physicalMin).toBe(-1);
        expect(signal.physicalMax).toBe(1);
        expect(signal.physicalDimension).toBe("");
        expect(signal.samplesPerRecord).toBe(51);
      } else {
        expect(signal.physicalMin).toBe(-1000);
        expect(signal.physicalMax).toBe(1000);
        expect(signal.physicalDimension).toBe("uV");
        expect(signal.samplesPerRecord).toBe(200);
      }
    });
  });

  it("reads one record worth of samples", () => {
    expect(samples.length).toBe(200);
  });

  it("verifies the first 5 samples", () => {
    expect(samples[0]).toBeCloseTo(26.38, 2);
    expect(samples[1]).toBeCloseTo(50.92, 2);
    expect(samples[2]).toBeCloseTo(71.82, 2);
    expect(samples[3]).toBeCloseTo(87.63, 2);
    expect(samples[4]).toBeCloseTo(97.25, 2);
  });

  it("verifies the last 5 samples", () => {
    expect(samples[195]).toBeCloseTo(87.63, 2);
    expect(samples[196]).toBeCloseTo(71.82, 2);
    expect(samples[197]).toBeCloseTo(50.92, 2);
    expect(samples[198]).toBeCloseTo(26.38, 2);
    expect(samples[199]).toBeCloseTo(0.0152, 2);
  });

  it("reads annotations correctly", () => {
    expect(annotations.length).toBe(2);

    expect(annotations[0].onset).toBe(0);
    expect(annotations[0].annotation).toBe("RECORD START");

    expect(annotations[1].onset).toBe(600);
    expect(annotations[1].annotation).toBe("REC STOP");
  });
});
