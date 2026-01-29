'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Pause, Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void
    disabled?: boolean
}

export function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [duration, setDuration] = useState(0)
    const [audioLevel, setAudioLevel] = useState(0)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationRef = useRef<number | null>(null)

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const updateAudioLevel = useCallback(() => {
        if (analyserRef.current && isRecording && !isPaused) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
            analyserRef.current.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length
            setAudioLevel(average / 255)
            animationRef.current = requestAnimationFrame(updateAudioLevel)
        }
    }, [isRecording, isPaused])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                }
            })

            // Set up audio analysis for visualization
            const audioContext = new AudioContext()
            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            analyserRef.current = analyser

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            })

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mediaRecorder.mimeType
                })
                onRecordingComplete(audioBlob, duration)
                stream.getTracks().forEach(track => track.stop())
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current)
                }
            }

            mediaRecorder.start(1000) // Collect data every second
            setIsRecording(true)
            setDuration(0)

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

            // Start audio level visualization
            updateAudioLevel()
        } catch (error) {
            console.error('Error accessing microphone:', error)
            alert('Could not access microphone. Please ensure you have granted permission.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsPaused(false)
            setAudioLevel(0)
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }

    const togglePause = () => {
        if (mediaRecorderRef.current) {
            if (isPaused) {
                mediaRecorderRef.current.resume()
                timerRef.current = setInterval(() => {
                    setDuration(prev => prev + 1)
                }, 1000)
                updateAudioLevel()
            } else {
                mediaRecorderRef.current.pause()
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                }
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current)
                }
            }
            setIsPaused(!isPaused)
        }
    }

    return (
        <div className="flex flex-col items-center gap-6 p-8">
            {/* Audio visualization */}
            <div className="relative flex items-center justify-center">
                <div
                    className={cn(
                        "absolute rounded-full bg-primary/20 transition-all duration-150",
                        isRecording && !isPaused ? "animate-pulse" : ""
                    )}
                    style={{
                        width: `${100 + audioLevel * 100}px`,
                        height: `${100 + audioLevel * 100}px`,
                    }}
                />
                <div
                    className={cn(
                        "absolute rounded-full bg-primary/30 transition-all duration-150"
                    )}
                    style={{
                        width: `${80 + audioLevel * 60}px`,
                        height: `${80 + audioLevel * 60}px`,
                    }}
                />

                {/* Main button */}
                <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    className={cn(
                        "relative z-10 h-20 w-20 rounded-full",
                        isRecording && !isPaused && "animate-pulse"
                    )}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={disabled}
                >
                    {disabled ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : isRecording ? (
                        <Square className="h-8 w-8" />
                    ) : (
                        <Mic className="h-8 w-8" />
                    )}
                </Button>
            </div>

            {/* Duration display */}
            <div className="text-center">
                <p className="text-3xl font-mono font-bold">{formatTime(duration)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                    {isRecording
                        ? isPaused
                            ? "Paused"
                            : "Recording..."
                        : "Click to start recording"
                    }
                </p>
            </div>

            {/* Controls */}
            {isRecording && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePause}
                    >
                        {isPaused ? (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                            </>
                        ) : (
                            <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                            </>
                        )}
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={stopRecording}
                    >
                        <Square className="h-4 w-4 mr-2" />
                        Stop & Process
                    </Button>
                </div>
            )}
        </div>
    )
}
