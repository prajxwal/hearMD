/**
 * PCM16 AudioWorklet Processor
 * Converts Float32 audio samples from getUserMedia to Int16 PCM
 * and posts them to the main thread for WebSocket streaming.
 */
class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffer = [];
        this._bufferSize = 800; // ~50ms at 16kHz
    }

    process(inputs) {
        const input = inputs[0];
        if (input.length === 0) return true;

        const channelData = input[0];
        for (let i = 0; i < channelData.length; i++) {
            // Clamp and convert Float32 [-1, 1] to Int16 [-32768, 32767]
            const s = Math.max(-1, Math.min(1, channelData[i]));
            this._buffer.push(s < 0 ? s * 0x8000 : s * 0x7fff);
        }

        // Send buffer when we have enough samples
        while (this._buffer.length >= this._bufferSize) {
            const chunk = this._buffer.splice(0, this._bufferSize);
            const int16Array = new Int16Array(chunk);
            this.port.postMessage(int16Array.buffer, [int16Array.buffer]);
        }

        return true;
    }
}

registerProcessor("pcm-processor", PCMProcessor);
