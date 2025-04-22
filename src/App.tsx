// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import React, { useState } from "react";
import { EDFReader } from "./lib/edf/edfreader";
import { EDFHeader } from "./lib/edf/edftypes";
import PSGViewer from "./components/PSGViewer";

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
    <div>
      {!edfHeader || !edfSignals ? (
        <input
          type="file"
          accept=".edf"
          onChange={handleFileUpload}
          style={{ margin: 20 }}
        />
      ) : (
        <PSGViewer header={edfHeader} signals={edfSignals} />
      )}
    </div>
  );
}

export default App;
