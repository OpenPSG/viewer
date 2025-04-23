import { describe, it, expect } from "vitest";
import { SignalUnit, parseSignalUnit, convertSignalUnit } from "./units";

describe("parseSignalUnit", () => {
  it("parses known unit aliases correctly", () => {
    expect(parseSignalUnit("µv")).toBe(SignalUnit.MICROVOLT);
    expect(parseSignalUnit("millilitres")).toBe(SignalUnit.MILLILITERS);
    expect(parseSignalUnit("Centigrade")).toBe(SignalUnit.CELSIUS);
    expect(parseSignalUnit("MMHG")).toBe(SignalUnit.MM_HG);
    expect(parseSignalUnit("   meters  ")).toBe(SignalUnit.METERS);
    expect(parseSignalUnit("us")).toBe(SignalUnit.MICROSECONDS);
  });

  it("returns null for unknown units", () => {
    expect(parseSignalUnit("banana")).toBeNull();
    expect(parseSignalUnit("watts")).toBeNull();
    expect(parseSignalUnit("")).toBeNull();
  });
});

describe("convertSignalUnit", () => {
  it("converts voltages correctly", () => {
    expect(convertSignalUnit(1, SignalUnit.VOLT, SignalUnit.MILLIVOLT)).toBe(
      1000,
    );
    expect(convertSignalUnit(1000, SignalUnit.MILLIVOLT, SignalUnit.VOLT)).toBe(
      1,
    );
    expect(convertSignalUnit(1, SignalUnit.VOLT, SignalUnit.MICROVOLT)).toBe(
      1_000_000,
    );
  });

  it("converts volumes correctly", () => {
    expect(
      convertSignalUnit(1, SignalUnit.LITERS, SignalUnit.MILLILITERS),
    ).toBe(1000);
    expect(
      convertSignalUnit(2000, SignalUnit.MILLILITERS, SignalUnit.LITERS),
    ).toBe(2);
  });

  it("converts pressures correctly", () => {
    expect(
      convertSignalUnit(1, SignalUnit.CM_H2O, SignalUnit.MM_HG),
    ).toBeCloseTo(0.73556, 5);
    expect(
      convertSignalUnit(1, SignalUnit.MM_HG, SignalUnit.CM_H2O),
    ).toBeCloseTo(1.35951, 5);
  });

  it("converts rate correctly", () => {
    expect(convertSignalUnit(1, SignalUnit.HZ, SignalUnit.BPM)).toBe(60);
    expect(convertSignalUnit(120, SignalUnit.BPM, SignalUnit.HZ)).toBe(2);
  });

  it("converts temperature correctly", () => {
    expect(
      convertSignalUnit(0, SignalUnit.CELSIUS, SignalUnit.FAHRENHEIT),
    ).toBe(32);
    expect(
      convertSignalUnit(32, SignalUnit.FAHRENHEIT, SignalUnit.CELSIUS),
    ).toBe(0);
    expect(convertSignalUnit(0, SignalUnit.CELSIUS, SignalUnit.KELVIN)).toBe(
      273.15,
    );
  });

  it("converts time correctly", () => {
    expect(
      convertSignalUnit(1, SignalUnit.SECONDS, SignalUnit.MILLISECONDS),
    ).toBe(1000);
    expect(
      convertSignalUnit(1, SignalUnit.MILLISECONDS, SignalUnit.MICROSECONDS),
    ).toBe(1000);
    expect(
      convertSignalUnit(1_000_000, SignalUnit.MICROSECONDS, SignalUnit.SECONDS),
    ).toBe(1);
  });

  it("converts distances correctly", () => {
    expect(
      convertSignalUnit(1, SignalUnit.METERS, SignalUnit.CENTIMETERS),
    ).toBe(100);
    expect(
      convertSignalUnit(1, SignalUnit.CENTIMETERS, SignalUnit.MILLIMETERS),
    ).toBe(10);
    expect(
      convertSignalUnit(1000, SignalUnit.MILLIMETERS, SignalUnit.METERS),
    ).toBe(1);
  });

  it("throws error for incompatible conversions", () => {
    expect(() =>
      convertSignalUnit(1, SignalUnit.VOLT, SignalUnit.LITERS),
    ).toThrow();
    expect(() =>
      convertSignalUnit(1, SignalUnit.CELSIUS, SignalUnit.SECONDS),
    ).toThrow();
  });

  it("returns the same value when units are identical", () => {
    expect(convertSignalUnit(42, SignalUnit.HZ, SignalUnit.HZ)).toBe(42);
  });
});
