// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import { EDFSignal } from "@/lib/edf/edftypes";
import { calcCoeffs } from "@/lib/filters/IIRCascade";
import { FilterCoeffs } from "@/lib/filters/IIRCoeffs";
import { SignalUnit, parseSignalUnit, convertSignalUnit } from "./units";

// Common categories for signals used in PSG (Polysomnography).
export enum SignalType {
  EEG, // Electroencephalogram (brain activity)
  EOG, // Electrooculogram (eye movements)
  EMG, // Electromyogram (muscle activity)
  ECG, // Electrocardiogram (heart activity)
  AIRFLOW, // Airflow (breathing)
  SPO2, // Blood oxygen saturation
  SPCO2, // Blood carbon dioxide saturation
  HR, // Heart rate
  PRESSURE, // Pressure (e.g., in a CPAP device, or nasal cannula)
  POSITION, // Body position (e.g., supine, prone, lateral)
  TEMPERATURE, // Temperature (e.g., rectal temperature)
  SNORE, // Snoring (auditory or microphone-based)
  BELT, // Abdominal or thoracic belt (respiratory effort)
  UNKNOWN, // Unknown or unclassified signal
}

// Colors for each signal type.
const SIGNAL_TYPE_COLORS: Record<SignalType, string> = {
  [SignalType.EEG]: "#655c59",
  [SignalType.EOG]: "#76b7b2",
  [SignalType.EMG]: "#f28e2b",
  [SignalType.ECG]: "#59a14e",
  [SignalType.AIRFLOW]: "#4e79a7",
  [SignalType.SPO2]: "#76b7b2",
  [SignalType.SPCO2]: "#59a14e",
  [SignalType.HR]: "#ff9da7",
  [SignalType.PRESSURE]: "#b07aa2",
  [SignalType.POSITION]: "#9c755f",
  [SignalType.SNORE]: "#bab0ac",
  [SignalType.TEMPERATURE]: "#f28e2b",
  [SignalType.BELT]: "#76b7b2",
  [SignalType.UNKNOWN]: "#bab0ac",
};

// Signal sensitivities, always in mm per unit.
const SIGNAL_SENSITIVITIES: Record<
  SignalType,
  { value: number; zero: number; unit: SignalUnit }
> = {
  [SignalType.EEG]: { value: 7, zero: 0, unit: SignalUnit.MICROVOLT }, // µV/mm
  [SignalType.EOG]: { value: 10, zero: 0, unit: SignalUnit.MICROVOLT }, // µV/mm
  [SignalType.EMG]: { value: 10, zero: 0, unit: SignalUnit.MICROVOLT }, // µV/mm
  [SignalType.ECG]: { value: 10, zero: 0, unit: SignalUnit.MILLIVOLT }, // mV/mm
  [SignalType.AIRFLOW]: { value: 0.1, zero: 0, unit: SignalUnit.LITERS }, // L/s per mm
  [SignalType.SPO2]: { value: 0.5, zero: 0, unit: SignalUnit.PERCENT }, // %/mm
  [SignalType.SPCO2]: { value: 0.5, zero: 0, unit: SignalUnit.PERCENT }, // %/mm
  [SignalType.HR]: { value: 2, zero: 0, unit: SignalUnit.BPM }, // bpm/mm
  [SignalType.PRESSURE]: { value: 0.5, zero: 0, unit: SignalUnit.CM_H2O }, // cmH2O/mm
  [SignalType.POSITION]: { value: 30, zero: 0, unit: SignalUnit.DEGREES }, // deg/mm
  [SignalType.TEMPERATURE]: { value: 10, zero: 35, unit: SignalUnit.CELSIUS }, // °C/mm
  [SignalType.SNORE]: { value: 1, zero: 0, unit: SignalUnit.DECIBEL }, // dB/mm
  [SignalType.BELT]: { value: 5, zero: 0, unit: SignalUnit.MILLIMETERS }, // mm/mm
  [SignalType.UNKNOWN]: { value: 1, zero: 0, unit: SignalUnit.MICROVOLT }, // fallback
};

// Get the signal type from its EDF signal header
// TODO: this needs a lot of real world tuning.
export function getSignalType(signal: EDFSignal): SignalType {
  const normalize = (text: string) => text.trim().toLowerCase();

  const containsAny = (text: string, keywords: string[]) =>
    keywords.some((k) => text.includes(k));

  const label = normalize(signal.label);
  const transducer = normalize(signal.transducerType);
  const unit = normalize(signal.physicalDimension);

  // EEG
  if (containsAny(label, ["eeg"]) || containsAny(transducer, ["eeg"])) {
    return SignalType.EEG;
  }

  // EOG
  if (containsAny(label, ["eog"]) || containsAny(transducer, ["eog"])) {
    return SignalType.EOG;
  }

  // EMG
  if (containsAny(label, ["emg"]) || containsAny(transducer, ["emg"])) {
    return SignalType.EMG;
  }

  // ECG
  if (
    containsAny(label, ["ecg", "ekg"]) ||
    containsAny(transducer, ["ecg", "ekg"])
  ) {
    return SignalType.ECG;
  }

  // Airflow
  if (
    (containsAny(label, ["flow", "airflow"]) ||
      containsAny(transducer, ["nasal", "thermistor", "airflow"])) &&
    containsAny(unit, ["l/s", "ml/s", "l/min", "ml/min"])
  ) {
    return SignalType.AIRFLOW;
  }

  // SpO2
  if (
    containsAny(label, ["spo2", "oximetry"]) ||
    containsAny(transducer, ["spo2", "pulse ox"]) ||
    unit === "%"
  ) {
    return SignalType.SPO2;
  }

  // SpCO2
  if (
    containsAny(label, ["co2", "spco2"]) ||
    containsAny(transducer, ["capnograph", "co2"]) ||
    unit.includes("mmhg")
  ) {
    return SignalType.SPCO2;
  }

  // Heart Rate
  if (
    containsAny(label, ["hr", "heart rate"]) ||
    containsAny(transducer, ["heart rate", "pulse"]) ||
    unit === "bpm"
  ) {
    return SignalType.HR;
  }

  // Pressure
  if (
    containsAny(label, ["pressure"]) ||
    containsAny(transducer, ["cpap", "pressure"]) ||
    containsAny(unit, ["cmh2o", "mmhg"])
  ) {
    return SignalType.PRESSURE;
  }

  // Position
  if (
    containsAny(label, ["position", "pos"]) ||
    containsAny(transducer, ["position", "body pos"])
  ) {
    return SignalType.POSITION;
  }

  // Temperature
  if (
    containsAny(label, ["temp", "temperature"]) ||
    containsAny(transducer, ["thermistor", "temperature"]) ||
    containsAny(unit, ["°c", "celsius"])
  ) {
    return SignalType.TEMPERATURE;
  }

  // Snore
  if (
    containsAny(label, ["snore"]) ||
    containsAny(transducer, ["snore", "microphone"]) ||
    unit === "dB"
  ) {
    return SignalType.SNORE;
  }

  // Belt (respiratory effort)
  if (
    containsAny(label, ["belt", "thoracic", "abdominal", "effort"]) ||
    containsAny(transducer, ["belt", "strain gauge"])
  ) {
    return SignalType.BELT;
  }

  return SignalType.UNKNOWN;
}

export function getColorForSignalType(signalType: SignalType): string {
  return (
    SIGNAL_TYPE_COLORS[signalType] || SIGNAL_TYPE_COLORS[SignalType.UNKNOWN]
  );
}

export function getYAxisRangeForSignal(
  signalType: SignalType,
  physicalDimension: string,
  displayHeightMM = 50,
): [number, number] {
  let sensitivity = SIGNAL_SENSITIVITIES[signalType];
  if (!sensitivity) {
    sensitivity = SIGNAL_SENSITIVITIES[SignalType.UNKNOWN];
  }

  let unit = parseSignalUnit(physicalDimension);
  if (!unit) {
    unit = sensitivity.unit;
  }

  const zero = convertSignalUnit(sensitivity.zero, sensitivity.unit, unit);

  const sensitivityPerMM = convertSignalUnit(
    sensitivity.value,
    sensitivity.unit,
    unit,
  );
  const rangeHalf = (sensitivityPerMM * displayHeightMM) / 2;

  return [zero - rangeHalf, zero + rangeHalf];
}

export function getFiltersForSignal(
  signalType: SignalType,
  sampleRate: number,
): FilterCoeffs[] {
  // TODO: tune these filters a bunch!
  const highpass = function (Fc: number): FilterCoeffs[] {
    return calcCoeffs({
      Fs: sampleRate,
      Fc: Fc,
      behavior: "highpass",
      characteristic: "butterworth",
      order: 2,
    });
  };

  const lowpassIfNeeded = function (Fc: number): FilterCoeffs[] {
    if (Fc >= sampleRate / 2) return [];
    return calcCoeffs({
      Fs: sampleRate,
      Fc: Fc,
      behavior: "lowpass",
      characteristic: "butterworth",
      order: 2,
    });
  };

  // From the AASM sleep scoring manual.
  const filters: FilterCoeffs[] = [];
  switch (signalType) {
    case (SignalType.EEG, SignalType.EOG):
      highpass(0.3).forEach((coeff) => filters.push(coeff));
      lowpassIfNeeded(35).forEach((coeff) => filters.push(coeff));
      break;
    case SignalType.EMG:
      highpass(10).forEach((coeff) => filters.push(coeff));
      lowpassIfNeeded(100).forEach((coeff) => filters.push(coeff));
      break;
    case SignalType.ECG:
      highpass(0.3).forEach((coeff) => filters.push(coeff));
      lowpassIfNeeded(70).forEach((coeff) => filters.push(coeff));
      break;
    case (SignalType.AIRFLOW, SignalType.BELT):
      highpass(0.1).forEach((coeff) => filters.push(coeff));
      lowpassIfNeeded(15).forEach((coeff) => filters.push(coeff));
      break;
    case SignalType.PRESSURE:
      highpass(0.03).forEach((coeff) => filters.push(coeff));
      lowpassIfNeeded(100).forEach((coeff) => filters.push(coeff));
      break;
    case SignalType.SNORE:
      highpass(10).forEach((coeff) => filters.push(coeff));
      lowpassIfNeeded(100).forEach((coeff) => filters.push(coeff));
      break;
    default:
      // TODO: add more filters for other signal types.
      break;
  }

  return filters;
}
