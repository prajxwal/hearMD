"use client";

import { useState, useRef, useCallback } from "react";

interface UseAssemblyAIReturn {
    transcript: string;
    isConnected: boolean;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
}

export function useAssemblyAI(): UseAssemblyAIReturn {
    const [transcript, setTranscript] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Track completed turns by turn_order (Map so formatted replaces unformatted)
    const completedTurnsRef = useRef<Map<number, string>>(new Map());

    const buildTranscript = (partial?: string) => {
        const turns = Array.from(completedTurnsRef.current.entries())
            .sort(([a], [b]) => a - b)
            .map(([, text]) => text);
        if (partial) turns.push("⏳ " + partial);
        return turns.join("\n\n");
    };

    const startRecording = useCallback(async () => {
        setError(null);
        setTranscript("");
        completedTurnsRef.current = new Map();

        try {
            // 1. Get temporary token from our API
            const tokenRes = await fetch("/api/assemblyai-token");
            const tokenData = await tokenRes.json();

            if (!tokenRes.ok || !tokenData.token) {
                throw new Error(tokenData.error || "Failed to get token");
            }

            // 2. Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            streamRef.current = stream;

            // 3. Set up AudioContext and AudioWorklet
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            await audioContext.audioWorklet.addModule("/pcm-processor.js");

            const source = audioContext.createMediaStreamSource(stream);
            const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

            // 4. Connect WebSocket to AssemblyAI v3 Universal Streaming
            const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&token=${tokenData.token}&format_turns=true`;
            const ws = new WebSocket(wsUrl);
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                console.log("AssemblyAI v3 WebSocket connected");
            };

            ws.onmessage = (event) => {
                if (typeof event.data !== "string") return;

                const msg = JSON.parse(event.data);

                if (msg.type === "Begin") {
                    console.log(`Streaming session started: ${msg.id}`);
                } else if (msg.type === "Turn") {
                    if (!msg.transcript) return;
                    const turnOrder = msg.turn_order ?? 0;

                    if (msg.end_of_turn) {
                        // Set/overwrite this turn (formatted replaces unformatted)
                        completedTurnsRef.current.set(turnOrder, msg.transcript);
                        setTranscript(buildTranscript());
                    } else {
                        // Partial — show with indicator
                        setTranscript(buildTranscript(msg.transcript));
                    }
                } else if (msg.type === "Termination") {
                    console.log(`Session ended: ${msg.audio_duration_seconds}s of audio`);
                }
            };

            ws.onerror = (e) => {
                console.error("WebSocket error:", e);
                setError("Connection error");
            };

            ws.onclose = (e) => {
                setIsConnected(false);
                if (e.code !== 1000) {
                    console.warn("WebSocket closed:", e.code, e.reason);
                }
            };

            // 5. Stream raw PCM16 audio via WebSocket
            workletNode.port.onmessage = (event) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(event.data);
                }
            };

            // Connect the audio pipeline
            source.connect(workletNode);
            workletNode.connect(audioContext.destination);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Recording failed";
            setError(message);
            console.error("Start recording error:", err);
            throw err;
        }
    }, []);

    const stopRecording = useCallback(async () => {
        // Set final transcript (completed turns only, no partials)
        setTranscript(buildTranscript());

        // Terminate session via v3 protocol
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "Terminate" }));
            wsRef.current.close();
            wsRef.current = null;
        }

        // Stop mic stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            await audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setIsConnected(false);
    }, []);

    return { transcript, isConnected, error, startRecording, stopRecording };
}
