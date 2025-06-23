// Doubly linked list
class LinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    static Node = class {
        constructor(value) {
            this.value = value;
            this.next = null;
            this.prev = null;
        }
    };

    get length() {
        return this.size;
    }

    [Symbol.iterator]() {
        return this.values();
    }

    *values() {
        let current = this.head;
        while (current) {
            yield current.value;
            current = current.next;
        }
    }

    getAll() {
        const result = [];
        for (const value of this) {
            result.push(value);
        }
        return result;
    }

    addNodeFirst(newNode) {
        if (!newNode) return;
        if (this.head) {
            this.addNodeBeforeNode(this.head, newNode);
        } else {
            this.head = this.tail = newNode;
            this.size++;
        }
    }

    addFirst(value) {
        const newNode = new LinkedList.Node(value);
        this.addNodeFirst(newNode);
    }

    addNodeBeforeNode(existingNode, newNode) {
        if (!newNode) return;
        if (!existingNode) return;

        newNode.next = existingNode;
        newNode.prev = existingNode.prev;
        if (existingNode.prev) {
            existingNode.prev.next = newNode;
        } else {
            this.head = newNode;
        }
        existingNode.prev = newNode;
        this.size++;
    }

    addBeforeNode(node, value) {
        const newNode = new LinkedList.Node(value);
        this.addNodeBeforeNode(node, newNode);
    }

    addNodeAfterNode(existingNode, newNode) {
        if (!newNode) return;
        if (!existingNode) return;

        newNode.prev = existingNode;
        newNode.next = existingNode.next;
        if (existingNode.next) {
            existingNode.next.prev = newNode;
        } else {
            this.tail = newNode;
        }
        existingNode.next = newNode;
        this.size++;
    }

    addAfterNode(node, value) {
        const newNode = new LinkedList.Node(value);
        this.addNodeAfterNode(node, newNode);
    }

    addNode(newNode) {
        if (!newNode) return;
        if (this.tail) {
            this.addNodeAfterNode(this.tail, newNode);
        } else {
            this.head = this.tail = newNode;
            this.size++;
        }
    }

    add(value) {
        const newNode = new LinkedList.Node(value);
        this.addNode(newNode);
    }

    addLast(value) {
        this.add(value);
    }

    get firstNode() {
        return this.head;
    }

    get lastNode() {
        return this.tail;
    }

    get first() {
        return this.head?.value;
    }

    get last() {
        return this.tail?.value;
    }

    getNodeBeforeNode(node) {
        return node ? node.prev : undefined;
    }

    getNodeAfterNode(node) {
        return node ? node.next : undefined;
    }

    removeNode(node) {
        if (!node) return;
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }
        this.size--;
    }

    replace(node, newValue) {
        if (!node) return;
        node.value = newValue;
    }

    getNodeIndex(node) {
        if (node == this.tail) return this.size - 1;
        let current = this.head;
        let index = 0;
        while (current) {
            if (current === node) return index;
            current = current.next;
            index++;
        }
        return -1;
    }

    getNodeAtIndex(index) {
        if (index < 0 || index >= this.size) return undefined;
        let current = this.head;
        let currentIndex = 0;
        while (currentIndex < index) {
            current = current.next;
            currentIndex++;
        }
        return current;
    }

    addAtIndex(index, value) {
        const newNode = new LinkedList.Node(value);
        this.addNodeAtIndex(index, newNode);
    }

    addNodeAtIndex(index, newNode) {
        if (index < 0 || index > this.size) return;
        if (index === 0) {
            if (this.head) {
                this.addNodeBeforeNode(this.head, newNode);
            } else {
                this.head = this.tail = newNode;
                this.size++;
            }
        } else if (index === this.size) {
            this.addNode(newNode);
        } else {
            const nodeAtIndex = this.getNodeAtIndex(index);
            this.addNodeBeforeNode(nodeAtIndex, newNode);
        }
    }

    getAtIndex(index) {
        const node = this.getNodeAtIndex(index);
        return node ? node.value : undefined;
    }

    swapNodes(node1, node2) {
        if (!node1 || !node2 || node1 === node2) return; // Nothing to swap

        const prev1 = node1.prev;
        const next1 = node1.next;
        const prev2 = node2.prev;
        const next2 = node2.next;

        // If node1 is adjacent to node2
        if (next1 === node2) {
            if (prev1) prev1.next = node2;
            if (next2) next2.prev = node1;

            node2.prev = prev1;
            node2.next = node1;

            node1.prev = node2;
            node1.next = next2;
        }
        // If node2 is adjacent to node1
        else if (next2 === node1) {
            if (prev2) prev2.next = node1;
            if (next1) next1.prev = node2;

            node1.prev = prev2;
            node1.next = node2;

            node2.prev = node1;
            node2.next = next1;
        }
        // If node1 and node2 are not adjacent
        else {
            if (prev1) prev1.next = node2;
            if (next1) next1.prev = node2;

            if (prev2) prev2.next = node1;
            if (next2) next2.prev = node1;

            const tempPrev = node1.prev;
            const tempNext = node1.next;

            node1.prev = node2.prev;
            node1.next = node2.next;

            node2.prev = tempPrev;
            node2.next = tempNext;
        }

        // Update head and tail if needed
        if (this.head === node1) this.head = node2;
        else if (this.head === node2) this.head = node1;

        if (this.tail === node1) this.tail = node2;
        else if (this.tail === node2) this.tail = node1;
    }

    clear() {
        this.head = this.tail = null;
        this.size = 0;
    }

    // Common list operations
    pop() {
        if (!this.tail) return undefined;
        const value = this.tail.value;
        this.removeNode(this.tail);
        return value;
    }

    push(value) {
        this.add(value);
    }

    shift() {
        if (!this.head) return undefined;
        const value = this.head.value;
        this.removeNode(this.head);
        return value;
    }

    unshift(value) {
        this.addFirst(value);
    }

    indexOf(value) {
        let index = 0;
        let current = this.head;
        while (current) {
            if (current.value === value) return index;
            current = current.next;
            index++;
        }
        return -1;
    }

    includes(value) {
        return this.indexOf(value) !== -1;
    }

    slice(start, end) {
        const result = new LinkedList();
        let current = this.head;
        let index = 0;
        while (current && index < end) {
            if (index >= start) {
                result.add(current.value);
            }
            current = current.next;
            index++;
        }
        return result;
    }

    // Common iteration operations
    forEach(callback, thisArg) {
        let index = 0;
        for (let value of this) {
            callback.call(thisArg, value, index, this);
            index++;
        }
    }

    map(callback, thisArg) {
        const result = new LinkedList();
        let index = 0;
        for (let value of this) {
            result.add(callback.call(thisArg, value, index, this));
            index++;
        }
        return result;
    }

    filter(callback, thisArg) {
        const result = new LinkedList();
        let index = 0;
        for (let value of this) {
            if (callback.call(thisArg, value, index, this)) {
                result.add(value);
            }
            index++;
        }
        return result;
    }

    some(callback, thisArg) {
        let index = 0;
        for (let value of this) {
            if (callback.call(thisArg, value, index, this)) {
                return true;
            }
            index++;
        }
        return false;
    }

    every(callback, thisArg) {
        let index = 0;
        for (let value of this) {
            if (!callback.call(thisArg, value, index, this)) {
                return false;
            }
            index++;
        }
        return true;
    }

    find(callback, thisArg) {
        let index = 0;
        for (let value of this) {
            if (callback.call(thisArg, value, index, this)) {
                return value;
            }
            index++;
        }
        return undefined;
    }

    reduce(callback, initialValue) {
        let accumulator = initialValue;
        let index = 0;
        for (let value of this) {
            if (index === 0 && accumulator === undefined) {
                accumulator = value; // Use first element as the initial accumulator if not provided
            } else {
                accumulator = callback(accumulator, value, index, this);
            }
            index++;
        }
        return accumulator;
    }
}
