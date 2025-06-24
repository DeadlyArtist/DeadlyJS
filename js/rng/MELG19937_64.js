class MELG19937_64 {
    static NN = 311n;
    static MM = 81n;
    static LAG1 = 19n;
    static SHIFT1 = 16n;

    static MATRIX_A = 0x5c32e06df730fc42n;
    static MASKU = 0xffffffffffffffe0n;
    static MASKL = ~MELG19937_64.MASKU & 0xFFFFFFFFFFFFFFFFn;
    static MASK1 = 0x6aede6fd97b338ecn;

    constructor(seed = generateSeedUsingTime()) {
        this._state = new Array(Number(MELG19937_64.NN)).fill(0n);
        this._mag01 = [0n, MELG19937_64.MATRIX_A];
        this._lung = 0n;
        this._index = 0;
        this.Seed(seed);
    }

    Seed(seed) {
        this._state[0] = BigInt(seed);
        for (let i = 1; i < this._state.length; i++) {
            const prev = this._state[i - 1];
            this._state[i] = (
                6364136223846793005n * (prev ^ (prev >> 62n)) + BigInt(i)
            ) & 0xFFFFFFFFFFFFFFFFn;
        }

        const last = this._state[this._state.length - 1];
        this._lung = (
            6364136223846793005n * (last ^ (last >> 62n)) + BigInt(this._state.length)
        ) & 0xFFFFFFFFFFFFFFFFn;

        this._index = 0;
    }

    NextULong() {
        const i = this._index;
        const nextIdx = (i + 1) % this._state.length;
        const mm = (i + Number(MELG19937_64.MM)) % this._state.length;
        const lag = (i + Number(MELG19937_64.LAG1)) % this._state.length;

        const x = (this._state[i] & MELG19937_64.MASKU) |
            (this._state[nextIdx] & MELG19937_64.MASKL);

        this._lung = (
            (x >> 1n) ^
            this._mag01[Number(x & 1n)] ^
            this._state[mm] ^
            (this._lung ^ (this._lung << 23n))
        ) & 0xFFFFFFFFFFFFFFFFn;

        this._state[i] =
            x ^ ((this._lung ^ (this._lung >> 33n)) & MELG19937_64.MASK1);

        const result =
            this._state[i] ^ ((this._state[lag] << MELG19937_64.SHIFT1) & 0xFFFFFFFFFFFFFFFFn);

        this._index = nextIdx;
        return result & 0xFFFFFFFFFFFFFFFFn;
    }

    NextUInt() {
        return Number(this.NextULong() >> 32n) >>> 0;
    }

    NextLong() {
        return BigInt.asIntN(64, this.NextULong());
    }

    NextInt(min, max) {
        if (min > max) throw new Error("minValue must be <= maxValue");
        if (min === max) return min;
        const range = BigInt(max - min);
        const raw = this.NextULong() % range;
        return min + Number(raw);
    }

    NextDouble() {
        return Number(this.NextULong() >> 11n) / Number(1n << 53n);
    }

    NextBytes(length) {
        const buffer = new Uint8Array(length);
        let i = 0;
        while (i + 8 <= length) {
            const rnd = this.NextULong();
            for (let j = 0; j < 8; j++) {
                buffer[i + j] = Number((rnd >> BigInt(j * 8)) & 0xFFn);
            }
            i += 8;
        }

        if (i < length) {
            const rnd = this.NextULong();
            for (let j = 0; i < length; j++, i++) {
                buffer[i] = Number((rnd >> BigInt(j * 8)) & 0xFFn);
            }
        }

        return buffer;
    }
}