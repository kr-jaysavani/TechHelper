"use client";

import { CircleStop, Mic } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./ui/button";

type Props = {
  onPartialText?: (text: string) => void;
  onFinalText: (text: string) => void;
};

export function VoiceButton({ onPartialText, onFinalText }: Props) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [recording, setRecording] = useState(false);

  async function start() {
    const ws = new WebSocket("ws://localhost:8000/ws/transcribe");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

    //   if (msg.type === "partial") {
    //     onPartialText?.(msg.text);
    //   }

      if (msg.type === "final") {
        onFinalText(msg.text);
      }
    };

    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const audioContext = new AudioContext({ sampleRate: 16_000 });
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(streamRef.current);
    sourceRef.current = source;

    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const input = e.inputBuffer.getChannelData(0);
      const buffer = new ArrayBuffer(input.length * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < input.length; i++) {
        const sample = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(i * 2, sample * 0x7f_ff, true);
      }

      ws.send(buffer);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    setRecording(true);
  }

  function stop() {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();

    streamRef.current?.getTracks().forEach((t) => t.stop());
    wsRef.current?.close();

    processorRef.current = null;
    sourceRef.current = null;
    audioContextRef.current = null;
    wsRef.current = null;

    setRecording(false);
  }

  return (
    <Button
      className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
      onClick={(e) => {
        e.preventDefault();
        recording ? stop() : start();
      }}
      variant="ghost"
    >
      {recording ? <CircleStop /> : <Mic />}
    </Button>
  );
}
