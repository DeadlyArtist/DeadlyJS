class LinkedSet {
    constructor() {
        this.map = new Map(); // Internal map to maintain unique values
        this.list = new LinkedList(); // Internal doubly linked list to preserve order
    }

    get size() {
        return this.list.length;
    }

    [Symbol.iterator]() {
        return this.values();
    }

    *values() {
        for (let value of this.list) {
            yield value;
        }
    }

    getAll() {
        const result = [];
        for (const value of this) {
            result.push(value);
        }
        return result;
    }

    has(value) {
        return this.map.has(value);
    }

    add(value) {
        if (!this.map.has(value)) {
            const node = new LinkedList.Node(value);
            this.list.addNode(node);
            this.map.set(value, node);
        }
    }

    addFirst(value) {
        if (!this.map.has(value)) {
            const node = new LinkedList.Node(value);
            this.list.addNodeFirst(node);
            this.map.set(value, node);
        }
    }

    addBefore(existingValue, value) {
        const existingNode = this.map.get(existingValue);
        if (!existingNode) return;
        if (!this.map.has(value)) {
            const node = new LinkedList.Node(value);
            this.list.addNodeBeforeNode(existingNode, node);
            this.map.set(value, node);
        }
    }

    addAfter(existingValue, value) {
        const existingNode = this.map.get(existingValue);
        if (!existingNode) return;
        if (!this.map.has(value)) {
            const node = new LinkedList.Node(value);
            this.list.addNodeAfterNode(existingNode, node);
            this.map.set(value, node);
        }
    }

    delete(value) {
        const node = this.map.get(value);
        if (!node) return false;
        this.list.removeNode(node);
        this.map.delete(value);
        return true;
    }

    clear() {
        this.map.clear();
        this.list.clear();
    }

    get first() {
        return this.list.first;
    }

    get last() {
        return this.list.last;
    }

    getBefore(value) {
        const node = this.map.get(value);
        const beforeNode = node ? this.list.getNodeBeforeNode(node) : undefined;
        return beforeNode ? beforeNode.value : undefined;
    }

    getAfter(value) {
        const node = this.map.get(value);
        const afterNode = node ? this.list.getNodeAfterNode(node) : undefined;
        return afterNode ? afterNode.value : undefined;
    }

    // Index-based operations
    getAtIndex(index) {
        const node = this.list.getNodeAtIndex(index);
        return node ? node.value : undefined;
    }

    addAtIndex(index, value) {
        if (this.map.has(value)) return;
        const nodeAtIndex = this.list.getNodeAtIndex(index);
        const newNode = new LinkedList.Node(value);

        if (!nodeAtIndex) {
            // Add to the end of the list if index is out of bounds
            this.list.addNode(newNode);
        } else {
            this.list.addNodeBeforeNode(nodeAtIndex, newNode);
        }
        this.map.set(value, newNode);
    }

    indexOf(value) {
        const node = this.map.get(value);
        return node ? this.list.getNodeIndex(node) : -1;
    }

    includes(value) {
        return this.has(value);
    }

    // Utility methods
    swap(value1, value2) {
        if (!this.map.has(value1) || !this.map.has(value2)) return;
        const node1 = this.map.get(value1);
        const node2 = this.map.get(value2);
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

            // Find the starting point of the right half
            for (let i = 0; i < mid; i++) {
                right = right.next;
            }

            // Break the list into two halves
            if (right.prev) right.prev.next = null;
            right.prev = null;

            // Recursively sort both halves
            const sortedLeft = mergeSort(left, mid);
            const sortedRight = mergeSort(right, size - mid);

            // Merge the sorted halves
            return merge(sortedLeft, sortedRight);
        };

        const merge = (left, right) => {
            let dummy = new LinkedList.Node(null); // Temporary node to build the sorted list
            let current = dummy;

            while (left && right) {
                if (comparator(left.value, right.value) <= 0) {
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

            // Append the remaining nodes
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
            if (sortedHead) sortedHead.prev = null;
            dummy.next = null; // Clean up the dummy node reference
            return sortedHead;
        };

        // Perform merge sort on the linked list
        this.list.head = mergeSort(this.list.head, this.size);

        // Recalculate the tail after sorting
        let current = this.list.head;
        while (current && current.next) {
            current = current.next;
        }
        this.list.tail = current;
    }


    // Functional-style operations
    forEach(callback, thisArg) {
        for (let value of this) {
            callback.call(thisArg, value, value, this);
        }
    }

    map(callback, thisArg) {
        const result = new LinkedSet();
        for (let value of this) {
            result.add(callback.call(thisArg, value, value, this));
        }
        return result;
    }

    filter(callback, thisArg) {
        const result = new LinkedSet();
        for (let value of this) {
            if (callback.call(thisArg, value, value, this)) {
                result.add(value);
            }
        }
        return result;
    }

    some(callback, thisArg) {
        for (let value of this) {
            if (callback.call(thisArg, value, value, this)) return true;
        }
        return false;
    }

    every(callback, thisArg) {
        for (let value of this) {
            if (!callback.call(thisArg, value, value, this)) return false;
        }
        return true;
    }

    find(callback, thisArg) {
        for (let value of this) {
            if (callback.call(thisArg, value, value, this)) return value;
        }
        return undefined;
    }

    reduce(callback, initialValue) {
        let accumulator = initialValue;
        for (let value of this) {
            if (accumulator === undefined) {
                accumulator = value;
            } else {
                accumulator = callback(accumulator, value, value, this);
            }
        }
        return accumulator;
    }

    // List-like operations
    push(value) {
        this.add(value);
    }

    pop() {
        if (!this.list.tail) return undefined;
        const value = this.list.tail.value;
        this.delete(value);
        return value;
    }

    shift() {
        if (!this.list.head) return undefined;
        const value = this.list.head.value;
        this.delete(value);
        return value;
    }

    unshift(value) {
        this.addFirst(value);
    }

    slice(start, end) {
        const result = new LinkedSet();
        let current = this.list.getNodeAtIndex(start);
        let index = start;

        while (current && index < end) {
            result.add(current.value);
            current = current.next;
            index++;
        }

        return result;
    }
}
