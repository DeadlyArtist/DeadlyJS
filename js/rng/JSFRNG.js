class JSFRNG {
    constructor(seed = generateSeedUsingTime()) {
        this.initialize(BigInt(seed));
    }

    initialize(seed) {
        this._a = 0xf1ea5eedn;
        this._b = seed;
        this._c = seed;
        this._d = seed;

        // Warm up the generator (discard first 20 results)
        for (let i = 0; i < 20; i++) {
            this.nextULong();
        }
    }

    rotateLeft(x, k) {
        return ((x << BigInt(k)) | (x >> BigInt(64 - k))) & 0xFFFFFFFFFFFFFFFFn;
    }

    nextULong() {
        const e = (this._a - this.rotateLeft(this._b, 27)) & 0xFFFFFFFFFFFFFFFFn;
        this._a = (this._b ^ this.rotateLeft(this._c, 17)) & 0xFFFFFFFFFFFFFFFFn;
        this._b = (this._c + this._d) & 0xFFFFFFFFFFFFFFFFn;
        this._c = (this._d + e) & 0xFFFFFFFFFFFFFFFFn;
        this._d = (e + this._a) & 0xFFFFFFFFFFFFFFFFn;
        return this._d;
    }

    nextUInt() {
        return Number(this.nextULong() >> 32n) >>> 0;
    }

    nextLong() {
        return BigInt.asIntN(64, this.nextULong());
    }

    nextInt(min, max) {
        if (min > max) throw new Error("minValue must be <= maxValue");
        if (min === max) return min;
        const range = BigInt(max - min);
        const val = this.nextULong() % range;
        return min + Number(val);
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
            const rem = this.nextULong();
            for (let j = 0; i < length; j++, i++) {
                buffer[i] = Number((rem >> BigInt(j * 8)) & 0xFFn);
            }
        }

        return buffer;
    }
}