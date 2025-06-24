
function generateSeedUsingTime() {
    const now = BigInt(Date.now() & 0xFFFFFFFF); // lower 32 bits of current time (ms)
    const perf = typeof performance !== 'undefined'
        ? BigInt(Math.floor((performance.now() % 1000) * 1_000_000)) & 0xFFFFFFFFn // microseconds
        : 0n;

    return (now << 32n) | perf; // 64-bit result
}

class Random {
    constructor(rng) {
        this.rng = rng;
    }

    nextULong() {
        return this.rng.nextULong();
    }

    nextUInt() {
        return this.rng.nextUInt();
    }

    nextLong() {
        return this.rng.nextLong();
    }

    nextInt(min, max) {
        return this.rng.nextInt(min, max);
    }

    nextDouble() {
        return this.rng.nextDouble();
    }

    nextBytes(buffer) {
        return this.rng.nextBytes(buffer);
    }

    nextPercentInt() {
        return this.nextInt(1, 100);
    }

    gamble(percentChance) {
        return this.nextPercentInt() <= percentChance;
    }

    gambleDouble(probability) {
        return this.nextDouble() < probability;
    }

    nextDoubleRange(min, max) {
        return min + (max - min) * this.nextDouble();
    }

    nextFloat(min, max) {
        return min + (max - min) * this.nextDouble();
    }

    nextBool() {
        return this.nextInt(0, 2) === 1;
    }

    nextChar() {
        return String.fromCharCode(this.nextInt(65, 122));
    }

    nextString(length) {
        let str = '';
        for (let i = 0; i < length; i++) str += this.nextChar();
        return str;
    }

    nextItem(array) {
        if (!Array.isArray(array)) throw new Error('Input must be array');
        return array[this.nextInt(0, array.length)];
    }

    shuffle(array) {
        if (!Array.isArray(array)) throw new Error('Input must be array');
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    nextWithinCircle(radius = 1) {
        const angle = this.nextDouble() * Math.PI * 2;
        const r = radius * Math.sqrt(this.nextDouble());
        return {
            x: r * Math.cos(angle),
            y: r * Math.sin(angle),
        };
    }

    nextWithinCircleCentered(center, radius = 1) {
        const offset = this.nextWithinCircle(radius);
        return {
            x: offset.x + center.x,
            y: offset.y + center.y,
        };
    }

    // === STATIC SINGLETONS (lazy loaded) ===
    static get DEFAULT() {
        return Random.SPLIT_MIX;
    }

    static get SPLIT_MIX() {
        return Random.#_SPLIT_MIX ??= Random.CreateSplitMix();
    }

    static get XOSHIRO() {
        return Random.#_XOSHIRO ??= Random.CreateXoshiro();
    }

    static get MERSENNE_TWISTER() {
        return Random.#_MERSENNE_TWISTER ??= Random.CreateMersenneTwister();
    }

    static get PCG() {
        return Random.#_PCG ??= Random.CreatePCG();
    }

    static get CMWC() {
        return Random.#_CMWC ??= Random.CreateCMWC();
    }

    static get CMWC_SMALL() {
        return Random.#_CMWC_SMALL ??= Random.CreateCMWCSmall();
    }

    static get CHACHA() {
        return Random.#_CHACHA ??= Random.CreateChaCha();
    }

    static get JSF() {
        return Random.#_JSF ??= Random.CreateJSF();
    }

    static get RCB() {
        return Random.#_RCB ??= Random.CreateRCB();
    }

    static get RCB_FAST() {
        return Random.#_RCB_FAST ??= Random.CreateRCBFast();
    }

    static get MELG() {
        return Random.#_MELG ??= Random.CreateMELG();
    }

    // === CREATE METHODS ===
    static CreateSplitMix(seed = null) {
        return new Random(new SplitMix64(seed));
    }

    static CreateXoshiro(seed = null) {
        return new Random(new Xoshiro256StarStar(seed));
    }

    static CreateMersenneTwister(seed = null) {
        return new Random(new MersenneTwister19937(Number(seed & 0xFFFFFFFFn)));
    }

    static CreatePCG(seed = null) {
        return new Random(new PCG32(seed));
    }

    static CreateCMWC(seed = null) {
        return new Random(new CMWC(seed));
    }

    static CreateCMWCSmall(seed = null) {
        return new Random(new CMWC(seed, 128));
    }

    static CreateChaCha(seed = null) {
        return new Random(new ChaChaRNG(seed));
    }

    static CreateJSF(seed = null) {
        return new Random(new JSFRNG(seed));
    }

    static CreateRCB(seed = null) {
        return new Random(new RCBRNG(seed));
    }

    static CreateRCBFast(seed = null) {
        return new Random(new RCBFastRNG(seed));
    }

    static CreateMELG(seed = null) {
        return new Random(new MELG19937_64(seed));
    }

    // === PRIVATE STATIC FIELDS ===
    static #_SPLIT_MIX;
    static #_XOSHIRO;
    static #_MERSENNE_TWISTER;
    static #_PCG;
    static #_CMWC;
    static #_CMWC_SMALL;
    static #_CHACHA;
    static #_JSF;
    static #_RCB;
    static #_RCB_FAST;
    static #_MELG;
}