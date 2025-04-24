// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import React, { useState } from "react";
import { EDFReader } from "@/lib/edf/edfreader";
import { EDFHeader } from "@/lib/edf/edftypes";
import { PSGViewer } from "@/components/PSGViewer";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function App() {
  const [edfHeader, setEdfHeader] = useState<EDFHeader | null>(null);
  const [edfSignals, setEdfSignals] = useState<number[][] | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const reader = new EDFReader(arrayBuffer);
    const header = reader.readHeader();
    const signals = header.signals.map((_, i) => reader.readSignal(header, i));

    setEdfHeader(header);
    setEdfSignals(signals);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {!edfHeader || !edfSignals ? (
        <Card className="w-full max-w-md p-6">
          <CardContent className="flex flex-col items-center space-y-4">
            <Input
              type="file"
              accept=".edf"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </CardContent>
        </Card>
      ) : (
        <PSGViewer header={edfHeader} signals={edfSignals} />
      )}
    </div>
  );
}

export default App;
