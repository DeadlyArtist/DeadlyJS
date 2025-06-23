class LinkedMap {
    constructor() {
        this.map = new Map();
        this.list = new LinkedList();
    }

    get size() {
        return this.list.length;
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    *entries() {
        for (const node of this.list) {
            yield [node.key, node.value];
        }
    }

    *keys() {
        for (const node of this.list) {
            yield node.key;
        }
    }

    *values() {
        for (const node of this.list) {
            yield node.value;
        }
    }

    getAll() {
        const result = [];
        for (const value of this.values()) {
            result.push(value);
        }
        return result;
    }

    getAllEntries() {
        const result = [];
        for (const entry of this.entries()) {
            result.push(entry);
        }
        return result;
    }

    getAllKeys() {
        const result = [];
        for (const key of this.keys()) {
            result.push(key);
        }
        return result;
    }

    has(key) {
        return this.map.has(key);
    }

    set(key, value) {
        if (this.map.has(key)) {
            const node = this.map.get(key);
            node.value = { key, value };
        } else {
            const newNode = new LinkedList.Node({ key, value });
            this.list.addNode(newNode);
            this.map.set(key, newNode);
        }
    }

    setFirst(key, value) {
        if (this.map.has(key)) {
            const node = this.map.get(key);
            this.list.removeNode(node);
            node.value = { key, value };
            this.list.addNodeFirst(node);
        } else {
            const newNode = new LinkedList.Node({ key, value });
            this.list.addNodeFirst(newNode);
            this.map.set(key, newNode);
        }
    }

    setBefore(existingKey, key, value) {
        const existingNode = this.map.get(existingKey);
        if (!existingNode) return;
        if (this.map.has(key)) {
            const node = this.map.get(key);
            this.list.removeNode(node);
            node.value = { key, value };
            this.list.addNodeBeforeNode(existingNode, node);
        } else {
            const newNode = new LinkedList.Node({ key, value });
            this.list.addNodeBeforeNode(existingNode, newNode);
            this.map.set(key, newNode);
        }
    }

    setAfter(existingKey, key, value) {
        const existingNode = this.map.get(existingKey);
        if (!existingNode) return;
        if (this.map.has(key)) {
            const node = this.map.get(key);
            this.list.removeNode(node);
            node.value = { key, value };
            this.list.addNodeAfterNode(existingNode, node);
        } else {
            const newNode = new LinkedList.Node({ key, value });
            this.list.addNodeAfterNode(existingNode, newNode);
            this.map.set(key, newNode);
        }
    }

    get firstKey() {
        return this.list.first?.key;
    }

    get lastKey() {
        return this.list.last?.key;
    }

    get first() {
        return this.list.first?.value;
    }

    get last() {
        return this.list.last?.value;
    }

    get(key) {
        return this.map.has(key) ? this.map.get(key).value.value : undefined;
    }

    getKeyBefore(key) {
        const node = this.map.get(key);
        const beforeNode = node ? this.list.getNodeBeforeNode(node) : null;
        return beforeNode ? beforeNode.value.key : undefined;
    }

    getBefore(key) {
        const node = this.map.get(key);
        const beforeNode = node ? this.list.getNodeBeforeNode(node) : null;
        return beforeNode ? beforeNode.value.value : undefined;
    }

    getKeyAfter(key) {
        const node = this.map.get(key);
        const afterNode = node ? this.list.getNodeAfterNode(node) : null;
        return afterNode ? afterNode.value.key : undefined;
    }

    getAfter(key) {
        const node = this.map.get(key);
        const afterNode = node ? this.list.getNodeAfterNode(node) : null;
        return afterNode ? afterNode.value.value : undefined;
    }

    delete(key) {
        const node = this.map.get(key);
        if (!node) return;
        this.list.removeNode(node);
        this.map.delete(key);
    }

    setReplace(oldKey, newKey, value) {
        this.delete(oldKey);
        this.set(newKey, value);
    }

    replaceKey(oldKey, newKey) {
        if (!this.map.has(oldKey) || this.map.has(newKey)) return;
        const node = this.map.get(oldKey);
        node.value.key = newKey;
        this.map.delete(oldKey);
        this.map.set(newKey, node);
    }

    getKeyIndex(key) {
        const node = this.map.get(key);
        return node ? this.list.getNodeIndex(node) : -1;
    }

    getIndex(index) {
        const node = this.list.getNodeAtIndex(index);
        return node ? node.value.value : undefined;
    }

    setAtIndex(index, key, value) {
        const nodeAtIndex = this.list.getNodeAtIndex(index);
        if (!nodeAtIndex) return;
        if (this.map.has(key)) {
            const node = this.map.get(key);
            this.list.removeNode(node);
            node.value = { key, value };
        } else {
            const newNode = new LinkedList.Node({ key, value });
            this.list.addNodeBeforeNode(nodeAtIndex, newNode);
            this.map.set(key, newNode);
        }
    }

    getKeyAtIndex(index) {
        const node = this.list.getNodeAtIndex(index);
        return node ? node.value.key : undefined;
    }

    getAtIndex(index) {
        const node = this.list.getNodeAtIndex(index);
        return node ? node.value.value : undefined;
    }

    clear() {
        this.map.clear();
        this.list.clear();
    }

    // Utility methods
    swap(key1, key2) {
        if (!this.map.has(key1) || !this.map.has(key2)) return;

        const node1 = this.map.get(key1);
        const node2 = this.map.get(key2);

        this.list.swapNodes(node1, node2);
    }

    sortInPlace(comparator = (a, b) => a > b ? 1 : a < b ? -1 : 0) {
        // If the size is less than or equal to 1, it's already sorted
        if (this.size <= 1) return;

        // Use merge sort to sort the doubly linked list
        const mergeSort = (head, size) => {
            // Base case: if there's only one node, return it
            if (size <= 1) return head;

            // Split the list into two halves
            const mid = Math.floor(size / 2);
            let left = head;
            let right = head;

            // Find the midpoint (split location)
            for (let i = 0; i < mid; i++) {
                right = right.next;
            }

            // Break the list into two separate halves
            if (right.prev) right.prev.next = null;
            right.prev = null;

            // Recursive sorting of the left and right halves
            const sortedLeft = mergeSort(left, mid);
            const sortedRight = mergeSort(right, size - mid);

            // Merge the two sorted halves into one sorted list
            return merge(sortedLeft, sortedRight);
        };

        const merge = (left, right) => {
            // Temporary node to assemble the sorted linked list
            let dummy = new LinkedList.Node(null);
            let current = dummy;

            while (left && right) {
                if (comparator(left.value.value, right.value.value) <= 0) {
                    current.next = left;
                    left.prev = current;
                    left = left.next;
                } else {
                    current.next = right;
                    right.prev = current;
                    right = right.next;
                }
                current = current.next;
            }

            // Append the remaining nodes from either list
            if (left) {
                current.next = left;
                left.prev = current;
            }
            if (right) {
                current.next = right;
                right.prev = current;
            }

            // Return the head of the merged list
            const sortedHead = dummy.next;
            if (sortedHead) sortedHead.prev = null; // Remove the dummy pointer
            dummy.next = null; // Cleanup the dummy node
            return sortedHead;
        };

        // Perform the merge sort on the doubly linked list
        this.list.head = mergeSort(this.list.head, this.size);

        // Recalculate the tail after sorting
        let current = this.list.head;
        while (current && current.next) {
            current = current.next;
        }
        this.list.tail = current;
    }

    sortInPlaceByKeys(comparator = (a, b) => a > b ? 1 : a < b ? -1 : 0) {
        // If the size is less than or equal to 1, it's already sorted
        if (this.size <= 1) return;

        // Use merge sort to sort the doubly linked list
        const mergeSort = (head, size) => {
            if (size <= 1) return head; // Base case

            const mid = Math.floor(size / 2);
            let left = head;
            let right = head;

            // Split the list into two halves
            for (let i = 0; i < mid; i++) {
                right = right.next;
            }

            // Disconnect left and right parts
            if (right.prev) right.prev.next = null;
            right.prev = null;

            const sortedLeft = mergeSort(left, mid);
            const sortedRight = mergeSort(right, size - mid);

            return merge(sortedLeft, sortedRight);
        };

        const merge = (left, right) => {
            let dummy = new LinkedList.Node(null); // Temporary node for sorted merge
            let current = dummy;

            while (left && right) {
                if (comparator(left.value.key, right.value.key) <= 0) {
                    current.next = left;
                    left.prev = current;
                    left = left.next;
                } else {
                    current.next = right;
                    right.prev = current;
                    right = right.next;
                }
                current = current.next;
            }

            // Append remaining nodes
            if (left) {
                current.next = left;
                left.prev = current;
            }
            if (right) {
                current.next = right;
                right.prev = current;
            }

            const sortedHead = dummy.next;
            if (sortedHead) sortedHead.prev = null; // Remove dummy reference
            dummy.next = null; // Cleanup
            return sortedHead;
        };

        // Perform merge sort on the doubly linked list by keys
        this.list.head = mergeSort(this.list.head, this.size);

        // Recalculate the tail after sorting
        let current = this.list.head;
        while (current && current.next) {
            current = current.next;
        }
        this.list.tail = current;
    }

    sortInPlaceByEntries(comparator = ([keyA, valueA], [keyB, valueB]) => {
        if (keyA > keyB) return 1;
        if (keyA < keyB) return -1;
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    }) {
        if (this.size <= 1) return;

        const mergeSort = (head, size) => {
            if (size <= 1) return head; // Base case

            const mid = Math.floor(size / 2);
            let left = head;
            let right = head;

            // Split the list into two halves
            for (let i = 0; i < mid; i++) {
                right = right.next;
            }

            // Disconnect left and right parts
            if (right.prev) right.prev.next = null;
            right.prev = null;

            const sortedLeft = mergeSort(left, mid);
            const sortedRight = mergeSort(right, size - mid);

            return merge(sortedLeft, sortedRight);
        };

        const merge = (left, right) => {
            let dummy = new LinkedList.Node(null); // Temporary node for sorted merge
            let current = dummy;

            while (left && right) {
                const entryA = [left.value.key, left.value.value];
                const entryB = [right.value.key, right.value.value];
                if (comparator(entryA, entryB) <= 0) {
                    current.next = left;
                    left.prev = current;
                    left = left.next;
                } else {
                    current.next = right;
                    right.prev = current;
                    right = right.next;
                }
                current = current.next;
            }

            // Append remaining nodes
            if (left) {
                current.next = left;
                left.prev = current;
            }
            if (right) {
                current.next = right;
                right.prev = current;
            }

            const sortedHead = dummy.next;
            if (sortedHead) sortedHead.prev = null; // Remove dummy reference
            dummy.next = null; // Cleanup
            return sortedHead;
        };

        // Perform merge sort on the doubly linked list by entries
        this.list.head = mergeSort(this.list.head, this.size);

        // Recalculate the tail after sorting
        let current = this.list.head;
        while (current && current.next) {
            current = current.next;
        }
        this.list.tail = current;
    }


    // Common list operations
    indexOf(key) {
        return this.getKeyIndex(key);
    }

    includes(key) {
        return this.map.has(key);
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
        for (const [key, value] of this) {
            callback.call(thisArg, value, key, this);
        }
    }

    map(callback, thisArg) {
        const result = new LinkedMap();
        for (const [key, value] of this) {
            const [newKey, newValue] = callback.call(thisArg, [key, value], key, this);
            result.set(newKey, newValue);
        }
        return result;
    }

    filter(callback, thisArg) {
        const result = new LinkedMap();
        for (const [key, value] of this) {
            if (callback.call(thisArg, value, key, this)) {
                result.set(key, value);
            }
        }
        return result;
    }

    some(callback, thisArg) {
        for (const [key, value] of this) {
            if (callback.call(thisArg, value, key, this)) return true;
        }
        return false;
    }

    every(callback, thisArg) {
        for (const [key, value] of this) {
            if (!callback.call(thisArg, value, key, this)) return false;
        }
        return true;
    }

    find(callback, thisArg) {
        for (const [key, value] of this) {
            if (callback.call(thisArg, value, key, this)) return [key, value];
        }
        return undefined;
    }

    reduce(callback, initialValue) {
        let accumulator = initialValue;
        for (const [key, value] of this) {
            if (accumulator === undefined) {
                accumulator = value;
            } else {
                accumulator = callback(accumulator, value, key, this);
            }
        }
        return accumulator;
    }
}
