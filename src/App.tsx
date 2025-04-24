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
    <>
      {!edfHeader || !edfSignals ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
          <Card className="w-full max-w-md p-6">
            <CardContent className="flex flex-col items-center space-y-4">
              <Input
                type="file"
                accept=".edf"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <hr className="w-full border-t border-gray-300 my-2" />
              <div className="text-xs text-left text-gray-400">
                Disclaimer: OpenPSG is not intended to diagnose, treat, cure, or
                prevent any medical condition. It is designed for research
                purposes only and should not be used as a substitute for
                professional medical advice or care. Users are responsible for
                ensuring compliance with the relevant regulations and standards
                in their region.
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <PSGViewer header={edfHeader} signals={edfSignals} />
      )}
    </>
  );
}

export default App;
