"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

export default function AriaLiveAnnouncer() {
  const { screenReaderMessage } = useApp();
  const [liveText, setLiveText] = useState("");

  useEffect(() => {
    if (screenReaderMessage) {
      setLiveText(screenReaderMessage);
    }
  }, [screenReaderMessage]);

  return (
    <div
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: "0",
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: "0",
      }}
    >
      {liveText}
    </div>
  );
}
