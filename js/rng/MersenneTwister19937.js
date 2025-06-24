class MersenneTwister19937 {
    constructor(seed = generateSeedUsingTime()) {
        if (isBigInt(seed)) seed = Number(seed);
        this.N = 624;
        this.M = 397;
        this.MATRIX_A = 0x9908B0DF;
        this.UPPER_MASK = 0x80000000;
        this.LOWER_MASK = 0x7FFFFFFF;

        this.mt = new Uint32Array(this.N);
        this.mti = this.N + 1;

        this.mag01 = [0x0, this.MATRIX_A];

        this.initialize(seed);
    }

    initialize(seed) {
        this.mt[0] = seed >>> 0;
        for (this.mti = 1; this.mti < this.N; this.mti++) {
            const prev = this.mt[this.mti - 1];
            this.mt[this.mti] = (
                1812433253 * (prev ^ (prev >>> 30)) + this.mti
            ) >>> 0;
        }
    }

    generateNumbers() {
        for (let kk = 0; kk < this.N - this.M; kk++) {
            const y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
            this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ this.mag01[y & 0x1];
        }

        for (let kk = this.N - this.M; kk < this.N - 1; kk++) {
            const y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
            this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ this.mag01[y & 0x1];
        }

        const y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
        this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ this.mag01[y & 0x1];

        this.mti = 0;
    }

    nextUInt() {
        if (this.mti >= this.N) {
            this.generateNumbers();
        }

        let y = this.mt[this.mti++];

        // Tempering
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9D2C5680;
        y ^= (y << 15) & 0xEFC60000;
        y ^= (y >>> 18);

        return y >>> 0;
    }

    nextULong() {
        const high = this.nextUInt();
        const low = this.nextUInt();
        return (BigInt(high) << 32n) | BigInt(low);
    }

    nextLong() {
        const val = this.nextULong();
        return BigInt.asIntN(64, val);
    }

    nextInt(min, max) {
        if (min > max) throw new Error('min must be <= max');
        if (min === max) return min;
        return min + (this.nextUInt() % (max - min + 1));
    }

    nextDouble() {
        return Number(this.nextULong() >> 11n) / Number(1n << 53n);
    }

    nextBytes(length) {
        const arr = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            arr[i] = this.nextUInt() & 0xFF;
        }
        return arr;
    }
}