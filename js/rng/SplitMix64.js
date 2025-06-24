class SplitMix64 {
    constructor(seed = generateSeedUsingTime()) {
        this.state = seed;
    }

    static U64 = (n) => BigInt(n) & 0xFFFFFFFFFFFFFFFFn;

    nextULong() {
        this.state = SplitMix64.U64(this.state + 0x9E3779B97F4A7C15n);
        let z = this.state;
        z = SplitMix64.U64((z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n);
        z = SplitMix64.U64((z ^ (z >> 27n)) * 0x94D049BB133111EBn);
        return SplitMix64.U64(z ^ (z >> 31n));
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
            let chunk = this.nextULong();
            for (let j = 0; j < 8; j++) {
                buffer[i + j] = Number((chunk >> BigInt(j * 8)) & 0xFFn);
            }
            i += 8;
        }

        if (i < length) {
            let chunk = this.nextULong();
            for (let j = 0; i < length; j++, i++) {
                buffer[i] = Number((chunk >> BigInt(j * 8)) & 0xFFn);
            }
        }

        return buffer;
    }
}