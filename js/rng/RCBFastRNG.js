class RCBFastRNG {
    constructor(seed = generateSeedUsingTime(), reseed = false) {
        this._count = 0n;
        this._flags = reseed ? 1 : 0;
        this.initialize(BigInt(seed), 10n, reseed);
    }

    static MAX_UINT64 = (1n << 64n) - 1n;

    initialize(seed, offset = 10n, reseed = false) {
        this._count = 0n;
        this._value = ~(seed + offset) & RCBFastRNG.MAX_UINT64;
        this._flags = reseed ? 1 : 0;
    }

    get reseeds() {
        return (this._flags & 1) !== 0;
    }

    get isGood() {
        return this._count !== RCBFastRNG.MAX_UINT64;
    }

    static circularShiftLeft(value, shift) {
        shift %= 64;
        return ((value << BigInt(shift)) | (value >> BigInt(64 - shift))) & RCBFastRNG.MAX_UINT64;
    }

    static circularShiftRight(value, shift) {
        shift %= 64;
        return ((value >> BigInt(shift)) | (value << BigInt(64 - shift))) & RCBFastRNG.MAX_UINT64;
    }

    static generate(input) {
        let value = input & RCBFastRNG.MAX_UINT64;

        const temp = (((value + ((value & 0x7FFFFFFFFFFFFFFFn) << 1n)) & RCBFastRNG.MAX_UINT64) >> 3n) | 1n;

        value ^= RCBFastRNG.circularShiftRight(value, 1);
        value ^= value >> 32n;
        value ^= value << 32n;
        value &= RCBFastRNG.MAX_UINT64;

        return value ^ RCBFastRNG.circularShiftRight(value, Number(temp & 63n));
    }

    generateOuter(count) {
        const v = this._value;
        const temp = ((~v << 1n) & RCBFastRNG.MAX_UINT64) * ((RCBFastRNG.generate(~v) << 1n) & RCBFastRNG.MAX_UINT64);
        const result = RCBFastRNG.generate(v) ^ temp ^ RCBFastRNG.generate(temp) ^ RCBFastRNG.generate(~RCBFastRNG.generate(count));
        this._value = result & RCBFastRNG.MAX_UINT64;
        return this._value;
    }

    nextULong() {
        this._count = (this._count + 1n) & RCBFastRNG.MAX_UINT64;
        if (this._count === 0n) this._count = 1n;

        let result = this.generateOuter(this._count);

        if (!this.isGood && this.reseeds) {
            const a = this.generateOuter(++this._count);
            const b = this.generateOuter(++this._count);
            this.initialize(a, b, true);
        }

        return result;
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
        return min + Number(this.nextULong() % range);
    }

    nextDouble() {
        return Number(this.nextULong() >> 11n) / Number(1n << 53n);
    }

    nextBytes(length) {
        const buffer = new Uint8Array(length);
        let i = 0;

        while (i + 8 <= length) {
            const value = this.nextULong();
            for (let j = 0; j < 8; j++) {
                buffer[i + j] = Number((value >> BigInt(j * 8)) & 0xFFn);
            }
            i += 8;
        }

        if (i < length) {
            const value = this.nextULong();
            for (let j = 0; i < length; j++, i++) {
                buffer[i] = Number((value >> BigInt(j * 8)) & 0xFFn);
            }
        }

        return buffer;
    }
}