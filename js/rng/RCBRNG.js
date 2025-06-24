class RCBRNG {
    constructor(seed = generateSeedUsingTime(), reseed = false) {
        this._count = 0n;
        this._flags = 0;
        this.initialize(BigInt(seed), 10n, reseed);
    }

    static MAX_UINT64 = (1n << 64n) - 1n;

    initialize(seed, offset = 10n, reseed = false) {
        this._count = 0n;
        this._flags = 0;
        this._value = (seed + offset) & RCBRNG.MAX_UINT64;
        this._last = ~(seed - offset) & RCBRNG.MAX_UINT64;
        this._flags = this.setFlag(this._flags, 2, reseed);
    }

    // Bit helpers
    getBit(value, pos) {
        return ((value >> BigInt(pos)) & 1n) !== 0n;
    }

    setFlag(flags, pos, value) {
        return (flags & ~(1 << pos)) | ((value ? 1 : 0) << pos);
    }

    getFlag(flags, pos) {
        return (flags & (1 << pos)) !== 0;
    }

    generate(value, left, startBit) {
        let temp;
        if (left) {
            temp = (value << 1n) | (startBit ? 1n : 0n);
        } else {
            temp = (value >> 1n) | ((startBit ? 1n : 0n) << 63n);
        }

        return temp ^ value;
    }

    generateInner(input, bitPosition) {
        const pos1 = bitPosition % 64;
        const pos2 = (bitPosition + 32) % 64;

        const left = this.getBit(this._value, pos1) !== this.getFlag(this._flags, 1);
        const startBit = this.getBit(this._value, pos2) !== this.getFlag(this._flags, 0);

        this._flags = this.setFlag(this._flags, 1, left);
        this._flags = this.setFlag(this._flags, 0, startBit);

        const gen = this.generate(input, left, startBit);
        this._last = gen ^ (~this._last & RCBRNG.MAX_UINT64);
        return this._last;
    }

    generateOuter(tempCount) {
        const part1 = (this.generateInner(this._value, 0) << 1n) & RCBRNG.MAX_UINT64;
        const part2 = (this.generateInner(tempCount, 1) << 1n) & RCBRNG.MAX_UINT64;
        const part3 = this.generateInner(this._value, 2);

        this._value = (part1 * part2) ^ part3;
        return this._value & RCBRNG.MAX_UINT64;
    }

    get reseeds() {
        return this.getFlag(this._flags, 2);
    }

    get isGood() {
        return this._count !== RCBRNG.MAX_UINT64;
    }

    nextULong() {
        this._count = (this._count + 1n) & RCBRNG.MAX_UINT64;
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