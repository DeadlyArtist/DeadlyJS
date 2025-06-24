class ChaChaRNG {
    static ROUNDS = 20;

    constructor(seed = generateSeedUsingTime(), stream = 0n) {
        this.state = new Uint32Array(16);
        this.keyStream = new Uint32Array(16);
        this.keyStreamIndex = 16; // force key stream gen on first call
        this.workingState = new Uint32Array(16);
        this.initialize(seed, stream);
    }

    static rotateLeft(x, n) {
        return ((x << n) | (x >>> (32 - n))) >>> 0;
    }

    static quarterRound(x, a, b, c, d) {
        x[a] = (x[a] + x[b]) >>> 0; x[d] ^= x[a]; x[d] = ChaChaRNG.rotateLeft(x[d], 16);
        x[c] = (x[c] + x[d]) >>> 0; x[b] ^= x[c]; x[b] = ChaChaRNG.rotateLeft(x[b], 12);
        x[a] = (x[a] + x[b]) >>> 0; x[d] ^= x[a]; x[d] = ChaChaRNG.rotateLeft(x[d], 8);
        x[c] = (x[c] + x[d]) >>> 0; x[b] ^= x[c]; x[b] = ChaChaRNG.rotateLeft(x[b], 7);
    }

    initialize(seed, stream) {
        // Constants: "expand 32-byte k"
        const constants = [
            0x61707865, 0x3320646e, 0x79622d32, 0x6b206574
        ];

        this.state.set(constants, 0);

        // Seed = 64-bit -> 2 words
        const seedLo = Number(seed & 0xFFFFFFFFn) >>> 0;
        const seedHi = Number((seed >> 32n) & 0xFFFFFFFFn) >>> 0;

        this.state[4] = seedLo;
        this.state[5] = seedHi;
        this.state[6] = 0xDEADBEEF;
        this.state[7] = 0xDEADBEEF;

        const streamLo = Number(stream & 0xFFFFFFFFn) >>> 0;
        const streamHi = Number((stream >> 32n) & 0xFFFFFFFFn) >>> 0;

        this.state[8] = streamLo;
        this.state[9] = streamHi;
        this.state[10] = 0xDEADBEEF;
        this.state[11] = 0xDEADBEEF;

        // Block counter
        this.state[12] = 0;
        this.state[13] = 0;

        this.state[14] = 0xDEADBEEF;
        this.state[15] = 0xDEADBEEF;
    }

    generateKeyStream() {
        this.workingState.set(this.state);

        for (let i = 0; i < ChaChaRNG.ROUNDS; i += 2) {
            // Odd round
            ChaChaRNG.quarterRound(this.workingState, 0, 4, 8, 12);
            ChaChaRNG.quarterRound(this.workingState, 1, 5, 9, 13);
            ChaChaRNG.quarterRound(this.workingState, 2, 6, 10, 14);
            ChaChaRNG.quarterRound(this.workingState, 3, 7, 11, 15);
            // Even round
            ChaChaRNG.quarterRound(this.workingState, 0, 5, 10, 15);
            ChaChaRNG.quarterRound(this.workingState, 1, 6, 11, 12);
            ChaChaRNG.quarterRound(this.workingState, 2, 7, 8, 13);
            ChaChaRNG.quarterRound(this.workingState, 3, 4, 9, 14);
        }

        for (let i = 0; i < 16; i++) {
            this.keyStream[i] = (this.workingState[i] + this.state[i]) >>> 0;
        }

        // Increment block counter
        this.state[12] = (this.state[12] + 1) >>> 0;
        if (this.state[12] === 0) {
            this.state[13] = (this.state[13] + 1) >>> 0;
        }

        this.keyStreamIndex = 0;
    }

    nextUInt() {
        if (this.keyStreamIndex >= 16) {
            this.generateKeyStream();
        }
        return this.keyStream[this.keyStreamIndex++];
    }

    nextULong() {
        const low = this.nextUInt();
        const high = this.nextUInt();
        return (BigInt(high) << 32n) | BigInt(low);
    }

    nextLong() {
        return BigInt.asIntN(64, this.nextULong());
    }

    nextInt(min, max) {
        if (min > max) throw new Error("minValue must be <= maxValue");
        if (min === max) return min;
        const range = max - min + 1;
        return min + (this.nextUInt() % range);
    }

    nextDouble() {
        return Number(this.nextULong() >> 11n) / Number(1n << 53n);
    }

    nextBytes(length) {
        const arr = new Uint8Array(length);
        let i = 0;
        while (i < length) {
            if (this.keyStreamIndex >= 16) {
                this.generateKeyStream();
            }
            const word = this.keyStream[this.keyStreamIndex++];
            arr[i++] = word & 0xFF;
            if (i < length) arr[i++] = (word >> 8) & 0xFF;
            if (i < length) arr[i++] = (word >> 16) & 0xFF;
            if (i < length) arr[i++] = (word >> 24) & 0xFF;
        }
        return arr;
    }
}