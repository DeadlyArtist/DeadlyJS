class CMWC {
    static DEFAULT_CYCLE = 4096;
    static CMWC_C_MAX = 809430660n;
    static DEFAULT_A = 18782n;
    static MODULUS = 0xFFFFFFFEn;

    constructor(seed = generateSeedUsingTime(), cycle = CMWC.DEFAULT_CYCLE) {
        if (!isPowerOfTwo(cycle)) {
            throw new Error("CMWC cycle size must be a power of 2.");
        }
        if (cycle < 16) {
            throw new Error("CMWC cycle size must be at least 16.");
        }

        this.cycle = cycle;
        this._Q = new Uint32Array(cycle);
        this._index = cycle - 1;
        this._c = 0n;

        this.initialize(seed);
    }

    initialize(seed) {
        const sm64 = new SplitMix64(seed);

        for (let i = 0; i < this.cycle; i++) {
            this._Q[i] = Number(sm64.nextULong() & 0xFFFFFFFFn);
        }

        do {
            this._c = sm64.nextULong() & 0xFFFFFFFFn;
        } while (this._c >= CMWC.CMWC_C_MAX);
    }

    nextUInt() {
        this._index = (this._index + 1) & (this.cycle - 1);

        const t = CMWC.DEFAULT_A * BigInt(this._Q[this._index]) + this._c;
        this._c = t >> 32n;

        let x = BigInt(t & 0xFFFFFFFFn) + this._c;
        if (x < this._c) {
            x += 1n;
            this._c += 1n;
        }

        const res = (CMWC.MODULUS - x) & 0xFFFFFFFFn;
        this._Q[this._index] = Number(res);
        return Number(res);
    }

    nextULong() {
        const high = BigInt(this.nextUInt());
        const low = BigInt(this.nextUInt());
        return (high << 32n) | low;
    }

    nextLong() {
        return BigInt.asIntN(64, this.nextULong());
    }

    nextInt(min, max) {
        if (min > max) throw new Error("minValue must be <= maxValue");
        if (min === max) return min;
        const range = BigInt(max - min + 1);
        const value = this.nextULong() % range;
        return min + Number(value);
    }

    nextDouble() {
        return Number(this.nextULong() >> 11n) / Number(1n << 53n);
    }

    nextBytes(length) {
        const buffer = new Uint8Array(length);
        let i = 0;

        while (i + 8 <= length) {
            const rnd = this.nextULong();
            for (let j = 0; j < 8; j++) {
                buffer[i + j] = Number((rnd >> BigInt(j * 8)) & 0xFFn);
            }
            i += 8;
        }

        if (i < length) {
            const rnd = this.nextULong();
            for (let j = 0; i < length; j++, i++) {
                buffer[i] = Number((rnd >> BigInt(j * 8)) & 0xFFn);
            }
        }

        return buffer;
    }
}