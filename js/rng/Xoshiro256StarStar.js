class Xoshiro256StarStar {
    constructor(seed) {
        if (Array.isArray(seed)) {
            if (seed.length !== 4)
                throw new Error("Seed array must have exactly 4 elements.");
            const [s0, s1, s2, s3] = seed.map(BigInt);
            if (!(s0 | s1 | s2 | s3))
                throw new Error("The state must not be all zero.");
            this._s0 = s0;
            this._s1 = s1;
            this._s2 = s2;
            this._s3 = s3;
        } else {
            this.setInitialState(BigInt(seed ?? generateSeedUsingTime()));
        }
    }

    setInitialState(seed) {
        const sm64 = new SplitMix64(seed);
        this._s0 = sm64.nextULong();
        this._s1 = sm64.nextULong();
        this._s2 = sm64.nextULong();
        this._s3 = sm64.nextULong();

        if ((this._s0 | this._s1 | this._s2 | this._s3) === 0n)
            this._s0 = 0x1n; // Avoid all-zero state
    }

    rotateLeft(x, k) {
        return ((x << BigInt(k)) | (x >> BigInt(64 - k))) & 0xFFFFFFFFFFFFFFFFn;
    }

    updateState() {
        const t = this._s1 << 17n;

        this._s2 ^= this._s0;
        this._s3 ^= this._s1;
        this._s1 ^= this._s2;
        this._s0 ^= this._s3;

        this._s2 ^= t;
        this._s3 = this.rotateLeft(this._s3, 45);
    }

    nextULong() {
        const result = this.rotateLeft(this._s1 * 5n, 7) * 9n;
        this.updateState();
        return result & 0xFFFFFFFFFFFFFFFFn;
    }

    nextUInt() {
        return Number(this.nextULong() >> 32n) >>> 0;
    }

    nextLong() {
        return BigInt.asIntN(64, this.nextULong());
    }

    nextInt(min, max) {
        if (min > max) throw new Error("min must be <= max");
        if (min === max) return min;
        const range = BigInt(max - min + 1);
        const val = this.nextULong() % range;
        return min + Number(val);
    }

    // Use xoshiro256+ for better double quality
    nextDouble() {
        // Perform full xoshiro256+ step and return double
        const result = (this._s0 + this._s3) & 0xFFFFFFFFFFFFFFFFn;

        this.updateState();

        // Use the highest 53 bits for double
        return Number(result >> 11n) / Number(1n << 53n);
    }

    nextBytes(length) {
        const buffer = new Uint8Array(length);
        let i = 0;
        while (i + 8 <= length) {
            const rand = this.nextULong();
            for (let j = 0; j < 8; j++) {
                buffer[i + j] = Number((rand >> BigInt(j * 8)) & 0xFFn);
            }
            i += 8;
        }

        if (i < length) {
            const rand = this.nextULong();
            for (let j = 0; i < length; j++, i++) {
                buffer[i] = Number((rand >> BigInt(j * 8)) & 0xFFn);
            }
        }

        return buffer;
    }
}