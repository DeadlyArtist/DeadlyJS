class PCG32 {
    static Multiplier = 6364136223846793005n;
    static DefaultIncrement = 1442695040888963407n;

    constructor(seed = generateSeedUsingTime(), increment = PCG32.DefaultIncrement) {
        increment = BigInt(increment);
        if ((increment & 1n) === 0n) {
            throw new Error("Increment must be odd.");
        }

        this._increment = increment;
        this._state = BigInt(seed) + this._increment;
        this.nextUInt(); // Warm up
    }

    nextUInt() {
        this._state = (this._state * PCG32.Multiplier + this._increment) & 0xFFFFFFFFFFFFFFFFn;

        const xorshifted = Number(((this._state >> 18n) ^ this._state) >> 27n) & 0xFFFFFFFF;
        const rot = Number(this._state >> 59n) & 31;

        const result = ((xorshifted >>> rot) | (xorshifted << ((32 - rot) & 31))) >>> 0;
        return result;
    }

    nextULong() {
        return (BigInt(this.nextUInt()) << 32n) | BigInt(this.nextUInt());
    }

    nextLong() {
        return BigInt.asIntN(64, this.nextULong());
    }

    nextInt(min, max) {
        if (min > max) throw new Error("minValue must be <= maxValue");
        if (min === max) return min;
        const range = BigInt(max - min + 1);
        return min + Number(BigInt(this.nextUInt()) % range);
    }

    nextDouble() {
        return Number(this.nextULong() >> 11n) / Number(1n << 53n);
    }

    nextBytes(length) {
        const buffer = new Uint8Array(length);
        let i = 0;

        while (i + 4 <= length) {
            const value = this.nextUInt();
            buffer[i++] = value & 0xFF;
            buffer[i++] = (value >>> 8) & 0xFF;
            buffer[i++] = (value >>> 16) & 0xFF;
            buffer[i++] = (value >>> 24) & 0xFF;
        }

        if (i < length) {
            const value = this.nextUInt();
            for (let j = 0; i < length; i++, j++) {
                buffer[i] = (value >>> (j * 8)) & 0xFF;
            }
        }

        return buffer;
    }
}