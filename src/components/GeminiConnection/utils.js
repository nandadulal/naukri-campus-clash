export const base64ToArrayBuffer = base64 => {
    const binaryString = atob(base64); // Decode the base64 string
    const length = binaryString.length;
    const buffer = new ArrayBuffer(length);
    const view = new Uint8Array(buffer);
    // Copy each character of the binary string into the buffer
    for (let i = 0; i < length; i++) {
        view[i] = binaryString.charCodeAt(i);
    }

    return buffer;
};

export const downsampleBuffer = (buffer, sampleRate, outSampleRate) => {
    if (outSampleRate === sampleRate) {
        return buffer;
    }
    let sampleRateRatio = sampleRate / outSampleRate;
    let newLength = Math.round(buffer.length / sampleRateRatio);
    let result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
        let nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0,
            count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }

        result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
};

export const generateSilence = () => {
    return ('A'.repeat(3963) + '=');
};

export const noop = () => {};
