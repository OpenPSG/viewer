// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import React from "react";
import { EDFHeader } from "@/lib/edf/edftypes";
import { User, FileText, Clock, Timer, Waves } from "lucide-react";

interface PSGHeaderProps {
  header: EDFHeader;
}

export const PSGHeader: React.FC<PSGHeaderProps> = ({ header }) => {
  return (
    <div className="w-full border-b px-6 py-4 bg-gray-50 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 text-sm md:text-base">
        <div className="flex items-center gap-2 font-semibold">
          <User className="w-4 h-4 text-muted-foreground" />
          Patient ID: <span className="font-normal">{header.patientId}</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Recording ID:{" "}
          <span className="font-normal">{header.recordingId}</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Start Time:{" "}
          <span className="font-normal">
            {header.startTime.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <Timer className="w-4 h-4 text-muted-foreground" />
          Duration:{" "}
          <span className="font-normal">
            {Math.floor((header.dataRecords * header.recordDuration) / 60)} min
          </span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <Waves className="w-4 h-4 text-muted-foreground" />
          Signals: <span className="font-normal">{header.signalCount}</span>
        </div>
      </div>
    </div>
  );
};
