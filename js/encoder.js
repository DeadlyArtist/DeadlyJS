class Encoder {
    constructor(encoding) {
        this.encoding = encoding;
        this.decoding = {};
        for (let e of Object.entries(encoding)) this.decoding[e[1]] = e[0];
    }

    encode(string) {
        for (let e of Object.entries(this.encoding)) {
            string = string.replaceAll('\\' + e[0], '\\' + e[1]);
        }
        return string;
    }

    decode(string) {
        for (let e of Object.entries(this.decoding)) {
            string = string.replaceAll('\\' + e[0], '\\' + e[1]);
        }
        return string;
    }

    escape(string) {
        for (let e of Object.entries(this.encoding)) {
            string = string.replaceAll(e[0], '\\' + e[1]);
        }
        return string;
    }

    unescape(string) {
        for (let e of Object.entries(this.decoding)) {
            string = string.replaceAll('\\' + e[0], e[1]);
        }
        return string;
    }
}