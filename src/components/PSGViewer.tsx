// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import React, { useEffect, useRef, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { EDFHeader } from "../lib/edf/edftypes";

interface PSGViewerProps {
  header: EDFHeader;
  signals: number[][];
}

// TODO: extract this to a separate file as a proper enum and a whole bunch of
// fuzzy matchers. Also we need a sensitivity control knob.
const standardSensitivities: Record<string, number> = {
  EEG: 7, // µV/mm
  EOG_EMG: 10, // µV/mm
  ECG: 10, // mV/mm (will be converted to µV if necessary)
  RESPIRATION: 0.2, // L/s per mm
  SPO2: 1, // %/mm
  PRESSURE: 0.5, // cmH2O per mm
  OTHER: 10, // fallback sensitivity
};

const getYAxisRangeFromSensitivity = (
  signalType: string,
  unit: string,
  displayHeightMM = 50,
): [number, number] => {
  let sensitivity =
    standardSensitivities[signalType] ?? standardSensitivities["OTHER"];
  if (unit.toLowerCase().includes("mv") && signalType === "ECG") {
    sensitivity *= 1000; // Convert mV to µV
  }
  const rangeHalf = (sensitivity * displayHeightMM) / 2;
  return [-rangeHalf, rangeHalf];
};

// TODO: sit down and think hard about nondistracting color pallettes.
const getSignalColor = (type: string): string => {
  switch (type) {
    case "EEG":
      return "#2c2c2c";
    case "EOG_EMG":
      return "#3b5f8f";
    case "ECG":
      return "#8f4b4b";
    case "RESPIRATION":
      return "#336666";
    case "SPO2":
      return "#594f81";
    case "PRESSURE":
      return "#996633";
    default:
      return "#4f4f4f";
  }
};

const getSignalType = (label: string): string => {
  const lower = label.toLowerCase();
  if (lower.includes("eeg")) return "EEG";
  if (lower.includes("eog") || lower.includes("emg")) return "EOG_EMG";
  if (lower.includes("ecg") || lower.includes("ekg")) return "ECG";
  if (
    lower.includes("resp") ||
    lower.includes("thorax") ||
    lower.includes("abdo") ||
    lower.includes("flow")
  )
    return "RESPIRATION";
  if (lower.includes("spo2") || lower.includes("ox") || lower.includes("sao2"))
    return "SPO2";
  if (lower.includes("press") || lower.includes("pleth")) return "PRESSURE";
  return "OTHER";
};

const PSGViewer: React.FC<PSGViewerProps> = ({ header, signals }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layoutSize, setLayoutSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const totalDuration = useMemo(
    () => header.dataRecords * header.recordDuration,
    [header],
  );
  const channelLabels = header.signals.map((s) => s.label);
  const epochDuration = 30;
  const [xRange, setXRange] = useState<[number, number]>([0, epochDuration]);
  const [plotlyXRange, setPlotlyXRange] = useState<[number, number]>([
    0,
    epochDuration,
  ]);

  useEffect(() => {
    setPlotlyXRange(xRange);
  }, [xRange]);

  const yAxisRanges = useMemo(() => {
    return header.signals.map((signal) => {
      const type = getSignalType(signal.label);
      const unit = signal.physicalDimension;
      return getYAxisRangeFromSensitivity(type, unit);
    });
  }, [header.signals]);

  // TODO: downsample agressively when the user zooms out. This is a lot of data to plot.
  const traces = useMemo(() => {
    return signals.map((channelData, index) => {
      const channelSampleRate =
        header.signals[index].samplesPerRecord / header.recordDuration;
      const startIndex = Math.max(0, Math.floor(xRange[0] * channelSampleRate));
      const endIndex = Math.min(
        channelData.length,
        Math.ceil(xRange[1] * channelSampleRate),
      );
      const xSlice = Array.from(
        { length: endIndex - startIndex },
        (_, i) => (startIndex + i) / channelSampleRate,
      );
      const ySlice = channelData.slice(startIndex, endIndex);
      const unit = header.signals[index].physicalDimension;
      const signalType = getSignalType(channelLabels[index]);
      return {
        x: xSlice,
        y: ySlice,
        type: "scattergl" as const,
        mode: "lines" as const,
        name: channelLabels[index],
        yaxis: `y${index === 0 ? "" : index + 1}` as Plotly.AxisName,
        line: { width: 1, color: getSignalColor(signalType) },
        hovertemplate: `<b>${channelLabels[index]}</b><br>Time: %{x:.2f} s<br>Value: %{y:.2f} ${unit}<extra></extra>`,
      };
    }) as Plotly.Data[];
  }, [xRange, signals, header, channelLabels]);

  const secondMarkers = useMemo(() => {
    const visibleSeconds = xRange[1] - xRange[0];
    if (visibleSeconds > 300) return [];

    const shapes: Partial<Plotly.Shape>[] = [];
    for (
      let second = Math.floor(Math.max(xRange[0], 0));
      second < Math.min(xRange[1], totalDuration);
      second++
    ) {
      shapes.push({
        type: "line",
        x0: second,
        x1: second,
        yref: "paper",
        y0: 0,
        y1: 1,
        line: { color: "rgba(0, 0, 0, 0.1)", width: 1 },
      });
    }
    return shapes;
  }, [xRange, totalDuration]);

  const epochBoxes = useMemo(() => {
    if (xRange[1] - xRange[0] > 600) return [];

    const startEpoch = Math.floor(Math.max(xRange[0], 0) / epochDuration);
    const endEpoch = Math.ceil(
      Math.min(xRange[1], totalDuration) / epochDuration,
    );

    const boxes: Partial<Plotly.Shape>[] = [];
    for (let i = 0; i < endEpoch - startEpoch; i++) {
      const epochStart = (startEpoch + i) * epochDuration;
      const epochEnd = Math.min(epochStart + epochDuration, totalDuration);
      boxes.push({
        type: "rect",
        xref: "x",
        yref: "paper",
        x0: Math.max(epochStart, 0),
        x1: Math.max(epochEnd, 0),
        y0: 0,
        y1: 1,
        fillcolor:
          (startEpoch + i) % 2 === 0
            ? "rgba(255, 255, 204, 0.1)"
            : "rgba(204, 229, 255, 0.1)",
        line: { width: 0 },
      });
    }
    return boxes;
  }, [xRange, epochDuration, totalDuration]);

  const epochAnnotations = useMemo(() => {
    if (xRange[1] - xRange[0] > 300) return [];

    const startEpoch = Math.floor(Math.max(xRange[0], 0) / epochDuration);
    const endEpoch = Math.ceil(
      Math.min(xRange[1], totalDuration) / epochDuration,
    );

    const annotations: Partial<Plotly.Annotations>[] = [];
    for (let i = 0; i < endEpoch - startEpoch; i++) {
      const epochStart = (startEpoch + i) * epochDuration;
      const epochCenter = epochStart + epochDuration / 2;
      annotations.push({
        x: epochCenter,
        y: 1.02,
        xref: "x",
        yref: "paper",
        text: `Epoch ${startEpoch + i + 1}`,
        showarrow: false,
        font: { size: 10, color: "gray" },
        align: "center",
      });
    }
    return annotations;
  }, [xRange, epochDuration, totalDuration]);

  const channelAnnotations = useMemo(
    () =>
      header.signals.map((signal, i): Partial<Plotly.Annotations> => {
        const domainStart = 1 - (i + 1) / header.signals.length;
        const domainCenter = domainStart + 1 / (2 * header.signals.length);
        return {
          x: 0,
          y: domainCenter,
          xref: "paper",
          yref: "paper",
          text: `${signal.label} (${signal.physicalDimension})`,
          showarrow: false,
          font: { size: 10, color: "black" },
          align: "left",
          bgcolor: "white",
          borderpad: 2,
        };
      }),
    [header.signals],
  );

  useEffect(() => {
    const handleResize = (): void => {
      setLayoutSize({ width: window.innerWidth, height: window.innerHeight });
    };
    const throttle = <T extends (...args: unknown[]) => void>(
      func: T,
      delay: number,
    ): ((...args: Parameters<T>) => void) => {
      let lastCall = 0;
      return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          func(...args);
        }
      };
    };
    const throttledResize = throttle(handleResize, 200);
    window.addEventListener("resize", throttledResize);
    return () => window.removeEventListener("resize", throttledResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const [start, end] = xRange;
      const windowSize = end - start;
      const isEpochView = Math.abs(windowSize - epochDuration) < 1;
      const moveBy = isEpochView ? epochDuration : windowSize * 0.1;

      if (e.key === "ArrowRight") {
        const nextStart = Math.min(start + moveBy, totalDuration - moveBy);
        const nextEnd = Math.min(end + moveBy, totalDuration);
        setXRange([nextStart, nextEnd]);
      } else if (e.key === "ArrowLeft") {
        const nextStart = Math.max(start - moveBy, 0);
        const nextEnd = Math.max(end - moveBy, moveBy);
        setXRange([nextStart, nextEnd]);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: true });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [xRange, totalDuration, epochDuration]);

  const handleRelayout = (e: Partial<Plotly.Layout>) => {
    let newStart: number | undefined = undefined;
    let newEnd: number | undefined = undefined;

    if (e["xaxis.range"]) {
      [newStart, newEnd] = e["xaxis.range"] as [number, number];
    } else if (
      e["xaxis.range[0]"] !== undefined &&
      e["xaxis.range[1]"] !== undefined
    ) {
      newStart = e["xaxis.range[0]"] as number;
      newEnd = e["xaxis.range[1]"] as number;
    }

    const auto = e["xaxis.autorange"];
    if (typeof newStart === "number" && typeof newEnd === "number") {
      newStart = Math.max(0, newStart);
      newEnd = Math.min(totalDuration, newEnd);
      if (newEnd - newStart < 1) {
        newEnd = newStart + 1;
      }
      setXRange([newStart, newEnd]);
    } else if (auto) {
      setXRange([0, epochDuration]);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        outline: "none",
      }}
    >
      <Plot
        data={traces}
        layout={{
          title: "Polysomnography Viewer",
          showlegend: false,
          //automargin: true,
          plot_bgcolor: "rgba(255, 255, 204, 0.1)",
          paper_bgcolor: "white",
          width: layoutSize.width,
          height: layoutSize.height,
          grid: {
            rows: channelLabels.length,
            columns: 1,
            pattern: "independent",
          },
          xaxis: {
            title: "Time (s)",
            domain: [0, 1],
            anchor:
              `y${channelLabels.length === 1 ? "" : channelLabels.length}` as Plotly.AxisName,
            showgrid: true,
            gridcolor: "#ddd",
            side: "bottom",
            range: plotlyXRange,
            constrain: "range",
          },
          ...Object.fromEntries(
            channelLabels.map((_, i) => [
              `yaxis${i === 0 ? "" : i + 1}`,
              {
                domain: [
                  1 - (i + 1) / channelLabels.length,
                  1 - i / channelLabels.length,
                ],
                showticklabels: false,
                fixedrange: true,
                zeroline: false,
                showgrid: false,
                ticks: "",
                range: yAxisRanges[i],
              },
            ]),
          ),
          shapes: [...secondMarkers, ...epochBoxes],
          annotations: [...epochAnnotations, ...channelAnnotations],
        }}
        onRelayout={handleRelayout}
        config={{ responsive: true, scrollZoom: true }}
        useResizeHandler
      />
    </div>
  );
};

export default PSGViewer;
