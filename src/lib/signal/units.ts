// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

// Canonical unit definitions for various signal types.
export enum SignalUnit {
  // Electrical potentials
  MICROVOLT = "µV",
  MILLIVOLT = "mV",
  VOLT = "V",

  // Volume
  LITERS = "L",
  MILLILITERS = "mL",

  // Pressure
  CM_H2O = "cmH2O",
  MM_HG = "mmHg",
  PA = "Pa",

  // Concentrations
  PERCENT = "%",

  // Rate
  HZ = "Hz",
  BPM = "bpm",

  // Temperature
  CELSIUS = "°C",
  FAHRENHEIT = "°F",
  KELVIN = "K",

  // Sound intensity
  DECIBEL = "dB",

  // Position
  DEGREES = "°",

  // Time
  SECONDS = "s",
  MILLISECONDS = "ms",
  MICROSECONDS = "µs",

  // Distance
  MILLIMETERS = "mm",
  CENTIMETERS = "cm",
  METERS = "m",
}

// Mapping of unit aliases to SignalUnit values.
const unitAliasMap: Record<string, SignalUnit> = {
  // Electrical potentials
  µv: SignalUnit.MICROVOLT,
  uv: SignalUnit.MICROVOLT,
  microvolt: SignalUnit.MICROVOLT,
  microvolts: SignalUnit.MICROVOLT,
  mv: SignalUnit.MILLIVOLT,
  millivolt: SignalUnit.MILLIVOLT,
  millivolts: SignalUnit.MILLIVOLT,
  v: SignalUnit.VOLT,
  volt: SignalUnit.VOLT,
  volts: SignalUnit.VOLT,

  // Volume
  l: SignalUnit.LITERS,
  liter: SignalUnit.LITERS,
  liters: SignalUnit.LITERS,
  litre: SignalUnit.LITERS,
  litres: SignalUnit.LITERS,
  ml: SignalUnit.MILLILITERS,
  milliliter: SignalUnit.MILLILITERS,
  milliliters: SignalUnit.MILLILITERS,
  millilitre: SignalUnit.MILLILITERS,
  millilitres: SignalUnit.MILLILITERS,

  // Pressure
  cmh2o: SignalUnit.CM_H2O,
  cm_h2o: SignalUnit.CM_H2O,
  centimeterofwater: SignalUnit.CM_H2O,
  centimeterofwatercolumn: SignalUnit.CM_H2O,
  mmhg: SignalUnit.MM_HG,
  mm_hg: SignalUnit.MM_HG,
  millimeterofmercury: SignalUnit.MM_HG,
  pa: SignalUnit.PA,
  pascal: SignalUnit.PA,
  pascals: SignalUnit.PA,

  // Concentrations
  "%": SignalUnit.PERCENT,
  percent: SignalUnit.PERCENT,
  percentage: SignalUnit.PERCENT,

  // Rate
  hz: SignalUnit.HZ,
  hertz: SignalUnit.HZ,
  bpm: SignalUnit.BPM,
  beatsperminute: SignalUnit.BPM,

  // Temperature
  "°c": SignalUnit.CELSIUS,
  c: SignalUnit.CELSIUS,
  celsius: SignalUnit.CELSIUS,
  centigrade: SignalUnit.CELSIUS,
  degc: SignalUnit.CELSIUS,
  "°f": SignalUnit.FAHRENHEIT,
  f: SignalUnit.FAHRENHEIT,
  fahrenheit: SignalUnit.FAHRENHEIT,
  k: SignalUnit.KELVIN,
  kelvin: SignalUnit.KELVIN,

  // Sound
  db: SignalUnit.DECIBEL,
  decibel: SignalUnit.DECIBEL,
  decibels: SignalUnit.DECIBEL,

  // Position
  "°": SignalUnit.DEGREES,
  degree: SignalUnit.DEGREES,
  degrees: SignalUnit.DEGREES,

  // Time
  s: SignalUnit.SECONDS,
  sec: SignalUnit.SECONDS,
  second: SignalUnit.SECONDS,
  seconds: SignalUnit.SECONDS,
  ms: SignalUnit.MILLISECONDS,
  millisecond: SignalUnit.MILLISECONDS,
  milliseconds: SignalUnit.MILLISECONDS,
  µs: SignalUnit.MICROSECONDS,
  us: SignalUnit.MICROSECONDS,
  microsecond: SignalUnit.MICROSECONDS,
  microseconds: SignalUnit.MICROSECONDS,

  // Distance
  mm: SignalUnit.MILLIMETERS,
  millimeter: SignalUnit.MILLIMETERS,
  millimeters: SignalUnit.MILLIMETERS,
  millimetre: SignalUnit.MILLIMETERS,
  millimetres: SignalUnit.MILLIMETERS,
  cm: SignalUnit.CENTIMETERS,
  centimeter: SignalUnit.CENTIMETERS,
  centimeters: SignalUnit.CENTIMETERS,
  centimetre: SignalUnit.CENTIMETERS,
  centimetres: SignalUnit.CENTIMETERS,
  m: SignalUnit.METERS,
  meter: SignalUnit.METERS,
  meters: SignalUnit.METERS,
  metre: SignalUnit.METERS,
  metres: SignalUnit.METERS,
};

// Attempt to parse a unit string into a SignalUnit enum value.
export function parseSignalUnit(unit: string): SignalUnit | null {
  const normalizedUnit = unit.trim().toLowerCase();
  return unitAliasMap[normalizedUnit] ?? null;
}

// Convert between units of the same dimension.
export function convertSignalUnit(
  value: number,
  fromUnit: SignalUnit,
  toUnit: SignalUnit,
): number {
  if (fromUnit === toUnit) return value;

  switch (fromUnit) {
    // Electrical potentials
    case SignalUnit.VOLT:
      switch (toUnit) {
        case SignalUnit.MICROVOLT:
          return value * 1_000_000;
        case SignalUnit.MILLIVOLT:
          return value * 1000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.MICROVOLT:
      switch (toUnit) {
        case SignalUnit.VOLT:
          return value / 1_000_000;
        case SignalUnit.MILLIVOLT:
          return value / 1000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.MILLIVOLT:
      switch (toUnit) {
        case SignalUnit.VOLT:
          return value / 1000;
        case SignalUnit.MICROVOLT:
          return value * 1000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    // Volume
    case SignalUnit.LITERS:
      switch (toUnit) {
        case SignalUnit.MILLILITERS:
          return value * 1000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.MILLILITERS:
      switch (toUnit) {
        case SignalUnit.LITERS:
          return value / 1000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    // Pressure
    case SignalUnit.CM_H2O:
      switch (toUnit) {
        case SignalUnit.MM_HG:
          return value * 0.73556;
        case SignalUnit.PA:
          return value * 98.0665;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.MM_HG:
      switch (toUnit) {
        case SignalUnit.CM_H2O:
          return value / 0.73556;
        case SignalUnit.PA:
          return value * 133.322;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.PA:
      switch (toUnit) {
        case SignalUnit.CM_H2O:
          return value / 98.0665;
        case SignalUnit.MM_HG:
          return value / 133.322;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    // Rate
    case SignalUnit.HZ:
      switch (toUnit) {
        case SignalUnit.BPM:
          return value * 60;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.BPM:
      switch (toUnit) {
        case SignalUnit.HZ:
          return value / 60;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    // Temperature
    case SignalUnit.CELSIUS:
      switch (toUnit) {
        case SignalUnit.FAHRENHEIT:
          return (value * 9) / 5 + 32;
        case SignalUnit.KELVIN:
          return value + 273.15;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.FAHRENHEIT:
      switch (toUnit) {
        case SignalUnit.CELSIUS:
          return ((value - 32) * 5) / 9;
        case SignalUnit.KELVIN:
          return ((value - 32) * 5) / 9 + 273.15;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.KELVIN:
      switch (toUnit) {
        case SignalUnit.CELSIUS:
          return value - 273.15;
        case SignalUnit.FAHRENHEIT:
          return ((value - 273.15) * 9) / 5 + 32;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    // Time
    case SignalUnit.SECONDS:
      switch (toUnit) {
        case SignalUnit.MILLISECONDS:
          return value * 1000;
        case SignalUnit.MICROSECONDS:
          return value * 1_000_000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.MILLISECONDS:
      switch (toUnit) {
        case SignalUnit.SECONDS:
          return value / 1000;
        case SignalUnit.MICROSECONDS:
          return value * 1000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.MICROSECONDS:
      switch (toUnit) {
        case SignalUnit.SECONDS:
          return value / 1_000_000;
        case SignalUnit.MILLISECONDS:
          return value / 1000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    // Distance
    case SignalUnit.METERS:
      switch (toUnit) {
        case SignalUnit.CENTIMETERS:
          return value * 100;
        case SignalUnit.MILLIMETERS:
          return value * 1000;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.CENTIMETERS:
      switch (toUnit) {
        case SignalUnit.METERS:
          return value / 100;
        case SignalUnit.MILLIMETERS:
          return value * 10;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    case SignalUnit.MILLIMETERS:
      switch (toUnit) {
        case SignalUnit.METERS:
          return value / 1000;
        case SignalUnit.CENTIMETERS:
          return value / 10;
        default:
          throw new Error(
            `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
          );
      }
    default:
      throw new Error(
        `Incompatible unit conversion from ${fromUnit} to ${toUnit}`,
      );
  }
}
