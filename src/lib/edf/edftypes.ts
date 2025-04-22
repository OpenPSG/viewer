// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

export type EDFVersion = "0";

export interface EDFHeader {
  version: EDFVersion;
  patientId: string;
  recordingId: string;
  startTime: Date;
  headerBytes: number;
  reserved: string;
  dataRecords: number;
  recordDuration: number;
  signalCount: number;
  signals: EDFSignal[];
}

export interface EDFSignal {
  label: string;
  transducerType: string;
  physicalDimension: string;
  physicalMin: number;
  physicalMax: number;
  digitalMin: number;
  digitalMax: number;
  prefiltering: string;
  samplesPerRecord: number;
  reserved: string;
}

export interface EDFAnnotation {
  onset: number;
  duration?: number;
  annotation: string;
}
