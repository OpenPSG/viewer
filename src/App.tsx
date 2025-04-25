// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Copyright (C) 2025 The OpenPSG Authors.

import React, { useState } from "react";
import { EDFHeader, EDFReader } from "edf-ts";
import { PSGViewer, PSGEvent } from "@/components/PSGViewer";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function App() {
  const [edfHeader, setEdfHeader] = useState<EDFHeader | null>(null);
  const [edfSignals, setEdfSignals] = useState<number[][] | null>(null);
  const [edfAnnotations, setEdfAnnotations] = useState<PSGEvent[]>([]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const reader = new EDFReader(new Uint8Array(arrayBuffer));
    const header = reader.readHeader();
    const signals = header.signals.map((_, i) => reader.readSignal(i));

    if (header.signals.some((signal) => signal.label === "EDF Annotations")) {
      const annotations = reader.readAnnotations();
      setEdfAnnotations(annotations);
    }

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
              <div className="text-center">
                <a
                  href="/privacy.html"
                  className="text-blue-500 hover:underline text-xs"
                >
                  Privacy Policy
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <PSGViewer
          header={edfHeader}
          signals={edfSignals}
          events={edfAnnotations}
        />
      )}
    </>
  );
}

export default App;
