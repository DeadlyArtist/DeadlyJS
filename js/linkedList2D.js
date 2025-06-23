class LinkedList2D {
    constructor() {
        this.rows = new LinkedList();
    }

    [Symbol.iterator]() {
        return this.rows[Symbol.iterator]();
    }

    *values() {
        for (const row of this) {
            yield* row.values();
        }
    }

    getAllRows() {
        return this.rows.getAll();
    }

    getAllValues() {
        const result = [];
        for (const value of this.values()) {
            result.push(value);
        }
        return result;
    }

    addRowNode(newRowNode) {
        this.rows.addNode(newRowNode);
    }

    addRow(row) {
        if (!(row instanceof LinkedList)) return;
        const newNode = new LinkedList.Node(row);
        this.addRowNode(newNode);
    }

    addRowNodeFirst(newRowNode) {
        this.rows.addNodeFirst(newRowNode);
    }

    addRowFirst(row) {
        if (!(row instanceof LinkedList)) return;
        const newNode = new LinkedList.Node(row);
        this.addRowNodeFirst(newNode);
    }

    addRowNodeBeforeRowNode(existingRowNode, newRowNode) {
        this.rows.addNodeBeforeNode(existingRowNode, newRowNode);
    }

    addRowBeforeRowNode(existingRowNode, row) {
        if (!(row instanceof LinkedList)) return;
        const newNode = new LinkedList.Node(row);
        this.addRowNodeBeforeRowNode(existingRowNode, newNode);
    }

    addRowNodeAfterRowNode(existingRowNode, newRowNode) {
        this.rows.addNodeAfterNode(existingRowNode, newRowNode);
    }

    addRowAfterRowNode(existingRowNode, row) {
        if (!(row instanceof LinkedList)) return;
        const newNode = new LinkedList.Node(row);
        this.addRowNodeAfterRowNode(existingRowNode, newNode);
    }

    addRowNodeAtIndex(index, newRowNode) {
        this.rows.addNodeAtIndex(index, newRowNode);
    }

    addRowAtIndex(index, row) {
        if (!(row instanceof LinkedList)) return;
        const newNode = new LinkedList.Node(row);
        this.addRowNodeAtIndex(index, newNode);
    }

    getRowNodeAtIndex(index) {
        return this.rows.getNodeAtIndex(index);
    }

    getRowAtIndex(index) {
        return this.getRowNodeAtIndex(index)?.value;
    }

    removeRowNode(rowNode) {
        this.rows.removeNode(rowNode);
    }

    addNode(rowNode, newNode) {
        rowNode.value.addNode(newNode);
    }

    add(rowNode, value) {
        if (!(rowNode?.value instanceof LinkedList)) return;
        rowNode.value.add(value);
    }

    get firstRowNode() {
        return this.rows.firstNode;
    }

    get lastRowNode() {
        return this.rows.lastNode;
    }

    get firstRow() {
        return this.rows.first;
    }

    get lastRow() {
        return this.rows.last;
    }

    get firstValue() {
        return this.firstRow?.first;
    }

    get lastValue() {
        return this.lastRow?.last;
    }

    length() {
        return this.rows.length;
    }

    // Common iteration operations
    forEach(callback, thisArg) {
        let index = 0;
        for (const row of this) {
            callback.call(thisArg, row, index, this);
            index++;
        }
    }

    forEachAll(callback, thisArg) {
        let outerIndex = 0;
        for (const row of this) {
            let innerIndex = 0;
            for (const value of row) {
                callback.call(thisArg, value, innerIndex, outerIndex, this);
                innerIndex++;
            }
            outerIndex++;
        }
    }

    map(callback, thisArg) {
        const result = new LinkedList2D();
        let index = 0;
        for (const row of this) {
            const mappedRow = row.map((value, innerIndex) =>
                callback.call(thisArg, value, innerIndex, index, this)
            );
            result.addRow(mappedRow);
            index++;
        }
        return result;
    }

    mapAll(callback, thisArg) {
        const result = new LinkedList2D();
        let outerIndex = 0;
        for (const row of this) {
            const mappedRow = row.map((value, innerIndex) =>
                callback.call(thisArg, value, innerIndex, outerIndex, this)
            );
            result.addRow(mappedRow);
            outerIndex++;
        }
        return result;
    }

    filter(callback, thisArg) {
        const result = new LinkedList2D();
        let index = 0;
        for (const row of this) {
            const filteredRow = row.filter((value, innerIndex) =>
                callback.call(thisArg, value, innerIndex, index, this)
            );
            if (filteredRow.length > 0) result.addRow(filteredRow);
            index++;
        }
        return result;
    }

    filterAll(callback, thisArg) {
        const result = new LinkedList2D();
        let outerIndex = 0;
        for (const row of this) {
            const filteredRow = new LinkedList();
            let innerIndex = 0;
            for (const value of row) {
                if (callback.call(thisArg, value, innerIndex, outerIndex, this)) {
                    filteredRow.add(value);
                }
                innerIndex++;
            }
            if (filteredRow.length > 0) result.addRow(filteredRow);
            outerIndex++;
        }
        return result;
    }

    some(callback, thisArg) {
        let index = 0;
        for (const row of this) {
            if (row.some((value, innerIndex) =>
                callback.call(thisArg, value, innerIndex, index, this)
            )) {
                return true;
            }
            index++;
        }
        return false;
    }

    someAll(callback, thisArg) {
        let outerIndex = 0;
        for (const row of this) {
            let innerIndex = 0;
            for (const value of row) {
                if (callback.call(thisArg, value, innerIndex, outerIndex, this)) {
                    return true;
                }
                innerIndex++;
            }
            outerIndex++;
        }
        return false;
    }

    every(callback, thisArg) {
        let index = 0;
        for (const row of this) {
            if (!row.every((value, innerIndex) =>
                callback.call(thisArg, value, innerIndex, index, this)
            )) {
                return false;
            }
            index++;
        }
        return true;
    }

    everyAll(callback, thisArg) {
        let outerIndex = 0;
        for (const row of this) {
            let innerIndex = 0;
            for (const value of row) {
                if (!callback.call(thisArg, value, innerIndex, outerIndex, this)) {
                    return false;
                }
                innerIndex++;
            }
            outerIndex++;
        }
        return true;
    }

    find(callback, thisArg) {
        let index = 0;
        for (const row of this) {
            const foundValue = row.find((value, innerIndex) =>
                callback.call(thisArg, value, innerIndex, index, this)
            );
            if (foundValue !== undefined) {
                return foundValue;
            }
            index++;
        }
        return undefined;
    }

    findAll(callback, thisArg) {
        let outerIndex = 0;
        for (const row of this) {
            let innerIndex = 0;
            for (const value of row) {
                if (callback.call(thisArg, value, innerIndex, outerIndex, this)) {
                    return value;
                }
                innerIndex++;
            }
            outerIndex++;
        }
        return undefined;
    }

    reduce(callback, initialValue) {
        let accumulator = initialValue;
        let index = 0;
        for (const row of this) {
            accumulator = row.reduce(
                (acc, value, innerIndex) =>
                    callback.call(thisArg, acc, value, innerIndex, index, this),
                accumulator
            );
            index++;
        }
        return accumulator;
    }
}
