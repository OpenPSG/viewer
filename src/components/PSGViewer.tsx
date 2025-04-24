// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import React, { useEffect, useState, useMemo } from "react";
import "./PSGViewer.css";
import Plot from "react-plotly.js";
import { EDFHeader } from "@/lib/edf/edftypes";
import {
  getSignalType,
  getColorForSignalType,
  getYAxisRangeForSignal,
  getFiltersForSignal,
} from "@/lib/signal/signal";
import { IIRFilter } from "@/lib/filters/IIRFilter";
import { resample } from "@/lib/resampling/resample";
import { PSGHeader } from "@/components/PSGHeader";

interface PSGViewerProps {
  header: EDFHeader;
  signals: number[][];
}

export const PSGViewer: React.FC<PSGViewerProps> = ({ header, signals }) => {
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
      const signalType = getSignalType(signal);
      return getYAxisRangeForSignal(signalType, signal.physicalDimension);
    });
  }, [header.signals]);

  const filteredSignals = useMemo(() => {
    return signals.map((signalData, index) => {
      const signalType = getSignalType(header.signals[index]);
      const sampleRate =
        header.signals[index].samplesPerRecord / header.recordDuration;

      const filter = new IIRFilter(getFiltersForSignal(signalType, sampleRate));

      // TODO: in place to save memory?
      // TODO: spawn a web worker to do this in parallel
      const filteredSignalData = filter.multiStep(signalData, false);

      return filteredSignalData;
    });
  }, [header, signals]);

  const traces = useMemo(() => {
    return filteredSignals.map((channelData, index) => {
      const channelSampleRate =
        header.signals[index].samplesPerRecord / header.recordDuration;

      const startIndex = Math.max(0, Math.floor(xRange[0] * channelSampleRate));
      const endIndex = Math.min(
        channelData.length,
        Math.ceil(xRange[1] * channelSampleRate),
      );

      const channelDataSegment = channelData.slice(startIndex, endIndex);

      // Downsample the data to reduce the number of points plotted
      const ySlice = resample(channelDataSegment, 10000, false); // TODO: N should be dynamic?

      // Generate x values for the downsampled data
      const xStep = (xRange[1] - xRange[0]) / ySlice.length;
      const xSlice = Array.from(
        { length: ySlice.length },
        (_, i) => xRange[0] + i * xStep,
      );

      const unit = header.signals[index].physicalDimension;
      const signalType = getSignalType(header.signals[index]);
      return {
        x: xSlice,
        y: ySlice,
        type: "scattergl" as const,
        mode: "lines" as const,
        name: channelLabels[index],
        yaxis: `y${index === 0 ? "" : index + 1}` as Plotly.AxisName,
        line: { width: 1, color: getColorForSignalType(signalType) },
        hovertemplate: `<b>${channelLabels[index]}</b><br>Time: %{x:.2f} s<br>Value: %{y:.2f} ${unit}<extra></extra>`,
      };
    }) as Plotly.Data[];
  }, [xRange, filteredSignals, header, channelLabels]);

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

  const { tickvals, ticktext } = useMemo(() => {
    const [start, end] = xRange;
    const duration = end - start;
    if (duration <= 0) return { tickvals: [], ticktext: [] };

    let interval: number;
    if (duration <= 60) {
      interval = 5;
    } else if (duration <= 300) {
      interval = 30;
    } else if (duration <= 1800) {
      interval = 60; // 1 min
    } else if (duration <= 7200) {
      interval = 300; // 5 min
    } else if (duration <= 14400) {
      interval = 600; // 10 min
    } else if (duration <= 43200) {
      interval = 1800; // 30 min
    } else {
      interval = 3600; // 1 hour
    }

    const tickvals: number[] = [];
    const ticktext: string[] = [];

    for (
      let t = Math.ceil(start / interval) * interval;
      t <= end;
      t += interval
    ) {
      tickvals.push(t);

      const date = new Date(header.startTime.getTime() + t * 1000);
      const wallTime = date.toTimeString().slice(0, 8);
      ticktext.push(wallTime);
    }

    return { tickvals, ticktext };
  }, [xRange, header.startTime]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const [start, end] = xRange;
      const windowSize = end - start;
      const isEpochView = Math.abs(windowSize - epochDuration) < 1;
      const moveBy = isEpochView ? epochDuration : windowSize * 0.1;

      if (e.key === "ArrowRight") {
        if (end >= totalDuration) return;

        const nextStart = Math.min(start + moveBy, totalDuration - moveBy);
        const nextEnd = Math.min(end + moveBy, totalDuration);

        // Only update if range actually changes
        if (nextStart !== start || nextEnd !== end) {
          setXRange([nextStart, nextEnd]);
        }
      } else if (e.key === "ArrowLeft") {
        if (start <= 0) return;

        const nextStart = Math.max(start - moveBy, 0);
        const nextEnd = Math.max(end - moveBy, moveBy);

        if (nextStart !== start || nextEnd !== end) {
          setXRange([nextStart, nextEnd]);
        }
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
    <div className="w-full min-h-screen bg-white flex flex-col">
      <PSGHeader header={header} />
      <Plot
        className="w-full min-h-[calc(100vh-60px)]"
        data={traces}
        layout={{
          title: "Polysomnography Viewer",
          showlegend: false,
          plot_bgcolor: "rgba(255, 255, 204, 0.1)",
          paper_bgcolor: "white",
          margin: { t: 40, l: 40, r: 40, b: 40 },
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
            tickvals,
            ticktext,
            tickangle: 0,
            tickfont: { size: 10 },
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
