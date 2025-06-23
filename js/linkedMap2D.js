class LinkedMap2D {
    constructor() {
        this.rows = new LinkedSet(); // A linked set of LinkedMap instances (rows)
        this.rowsByKey = new Map(); // Maps each key to the row that contains it
    }

    get size() {
        return this.rowsByKey.size; // Number of all values
    }

    get rowsSize() {
        return this.rows.size; // Number of rows
    }

    [Symbol.iterator]() {
        return this.rows[Symbol.iterator]();
    }

    *entries() {
        for (const map of this.rows) {
            yield* map.entries();
        }
    }

    *keys() {
        for (const map of this.rows) {
            yield* map.keys();
        }
    }

    *values() {
        for (const map of this.rows) {
            yield* map.values();
        }
    }

    *rows() {
        for (const row of this.rows) {
            yield row;
        }
    }

    getAll() {
        return Array.from(this.values());
    }

    getAllKeys() {
        return Array.from(this.keys());
    }

    getAllEntries() {
        return Array.from(this.entries());
    }

    getAllRows() {
        return Array.from(this.rows());
    }

    has(key) {
        return this.rowsByKey.has(key);
    }

    get firstRow() {
        return this.rows.first;
    }

    get lastRow() {
        return this.rows.last;
    }

    get firstKey() {
        return this.firstRow?.firstKey;
    }

    get lastKey() {
        return this.lastRow?.lastKey;
    }

    get first() {
        return this.firstRow?.first;
    }

    get last() {
        return this.lastRow?.last;
    }

    get(key) {
        const row = this.rowsByKey.get(key);
        return row?.get(key);
    }

    getBefore(key) {
        const row = this.rowsByKey.get(key);
        return row?.getBefore(key);
    }

    getAfter(key) {
        const row = this.rowsByKey.get(key);
        return row?.getAfter(key);
    }

    getFirstOfRow(row) {
        return row.first;
    }

    getLastOfRow(row) {
        return row.last;
    }

    set(key, value) {
        let row = this.rowsByKey.get(key);
        if (!row) {
            if (this.rows.size != 0) {
                row = this.rows.last;
            } else {
                row = new LinkedMap();
                this.rows.add(row);
            }
        }
        row.set(key, value);
        this.rowsByKey.set(key, row);
    }

    setBefore(existingKey, key, value) {
        const row = this.rowsByKey.get(existingKey);
        if (row && !this.rowsByKey.has(key)) {
            row.setBefore(existingKey, key, value);
            this.rowsByKey.set(key, row);
        }
    }

    setAfter(existingKey, key, value) {
        const row = this.rowsByKey.get(existingKey);
        if (row && !this.rowsByKey.has(key)) {
            row.setAfter(existingKey, key, value);
            this.rowsByKey.set(key, row);
        }
    }

    setFirstToRow(row, key, value) {
        if (!this.rows.has(row)) return;
        row.setFirst(key, value);
        this.rowsByKey.set(key, row);
    }

    setLastToRow(row, key, value) {
        if (!this.rows.has(row)) return;
        row.set(key, value);
        this.rowsByKey.set(key, row);
    }

    delete(key, deleteRowIfEmpty = false) {
        const row = this.rowsByKey.get(key);
        if (!row) return false;
        row.delete(key);
        this.rowsByKey.delete(key);

        if (deleteRowIfEmpty && row.size === 0) {
            this.rows.delete(row);
        }
        return true;
    }

    clear() {
        this.rows.clear();
        this.rowsByKey.clear();
    }

    getRowOf(key) {
        return this.rowsByKey.get(key);
    }

    addRow() {
        const newRow = new LinkedMap();
        this.rows.add(newRow);
        return newRow;
    }

    addRowFirst() {
        const newRow = new LinkedMap();
        this.rows.addFirst(newRow);
        return newRow;
    }

    addRowLast() {
        const newRow = new LinkedMap();
        this.rows.add(newRow);
        return newRow;
    }

    addRowBefore(existingRow) {
        if (!this.rows.has(existingRow)) return;
        const newRow = new LinkedMap();
        this.rows.addBefore(existingRow, newRow);
        return newRow;
    }

    addRowAfter(existingRow) {
        if (!this.rows.has(existingRow)) return;
        const newRow = new LinkedMap();
        this.rows.addAfter(existingRow, newRow);
        return newRow;
    }

    deleteRow(row) {
        if (!this.rows.has(row)) return false;
        this.clearRow(row);
        this.rows.delete(row);
    }

    clearRow(row) {
        if (!this.rows.has(row)) return false;
        for (let key of row.keys()) {
            this.rowsByKey.delete(key);
        }
        row.clear();
    }

    // Common list operations
    indexOf(key) {
        return this.getRowOf(key).indexOf(key);
    }

    rowIndexOf(key) {
        return this.rows.indexOf(this.getRowOf(key));
    }

    includes(key) {
        return this.has(key);
    }

    push(key, value) {
        this.set(key, value);
    }

    pop() {
        if (!this.list.tail) return undefined;
        const { key, value } = this.list.tail.value;
        this.delete(key);
        return { key, value };
    }

    shift() {
        if (!this.list.head) return undefined;
        const { key, value } = this.list.head.value;
        this.delete(key);
        return { key, value };
    }

    unshift(key, value) {
        this.setFirst(key, value);
    }

    slice(start, end) {
        const slicedList = this.list.slice(start, end);
        const result = new LinkedMap();
        for (const { key, value } of slicedList) {
            result.set(key, value);
        }
        return result;
    }

    // Common iteration operations
    forEach(callback, thisArg) {
        for (const [key, value] of this.entries()) {
            callback.call(thisArg, value, key, this);
        }
    }

    map(callback, thisArg) {
        const result = new LinkedMap2D();
        for (const [key, value] of this.entries()) {
            result.set(key, callback.call(thisArg, value, key, this));
        }
        return result;
    }

    filter(callback, thisArg) {
        const result = new LinkedMap2D();
        for (const [key, value] of this.entries()) {
            if (callback.call(thisArg, value, key, this)) {
                result.set(key, value);
            }
        }
        return result;
    }

    some(callback, thisArg) {
        for (const [key, value] of this.entries()) {
            if (callback.call(thisArg, value, key, this)) return true;
        }
        return false;
    }

    every(callback, thisArg) {
        for (const [key, value] of this.entries()) {
            if (!callback.call(thisArg, value, key, this)) return false;
        }
        return true;
    }

    find(callback, thisArg) {
        for (const [key, value] of this.entries()) {
            if (callback.call(thisArg, value, key, this)) return [key, value];
        }
        return undefined;
    }

    reduce(callback, initialValue) {
        let accumulator = initialValue;
        for (const [key, value] of this.entries()) {
            if (accumulator === undefined) {
                accumulator = value; // Use the first value if no initial accumulator
            } else {
                accumulator = callback(accumulator, value, key, this);
            }
        }
        return accumulator;
    }
}
