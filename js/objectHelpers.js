class ObjectHelpers {
    static mapKeys(obj, func, overwrite = true) {
        const temp = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const tKey = func(key);
                temp[tKey] = obj[key];
                if (overwrite) delete obj[key];
            }
        }
        if (!overwrite) return temp;

        for (const key in temp) {
            if (temp.hasOwnProperty(key)) {
                obj[key] = temp[key];
            }
        }

        return obj;
    }

    static mapKeysRecursively(obj, func, overwrite = true) {
        // Set to keep track of visited objects to avoid circular references
        const visited = new Set();

        // Queue for breadth-first traversal
        const queue = [obj];

        while (queue.length > 0) {
            const current = queue.shift();

            // Skip if already visited (to handle circular references)
            if (current && typeof current === 'object' && visited.has(current)) {
                continue;
            }

            // Visit this object
            if (current && typeof current === 'object') {
                visited.add(current);

                // Apply the mapping to the current object's keys if it's not an array
                if (!Array.isArray(current)) {
                    this.mapKeys(current, func, overwrite);
                }

                // Add child objects/arrays to the queue
                for (const key in current) {
                    if (current.hasOwnProperty(key)) {
                        queue.push(current[key]);
                    }
                }
            }
        }

        return obj;
    }

    static lowerFirstCharOfKeys(obj, overwrite = true) {
        return this.mapKeys(obj, key => key ? key.charAt(0).toLowerCase() + key.slice(1) : key, overwrite);
    }

    static upperFirstCharOfKeys(obj, overwrite = true) {
        return this.mapKeys(obj, key => key ? key.charAt(0).toUpperCase() + key.slice(1) : key, overwrite);
    }

    static lowerFirstCharOfKeysRecursively(obj, overwrite = true) {
        return this.mapKeysRecursively(obj, key => key ? key.charAt(0).toLowerCase() + key.slice(1) : key, overwrite);
    }

    static upperFirstCharOfKeysRecursively(obj, overwrite = true) {
        return this.mapKeysRecursively(obj, key => key ? key.charAt(0).toUpperCase() + key.slice(1) : key, overwrite);
    }

    static clearKeys(obj) {
        Object.keys(obj).forEach(key => delete obj[key]);
    }

    static filterProperties(obj, filterFunc) {
        Object.keys(obj).forEach(key => {
            if (!filterFunc(key, obj[key])) {
                delete obj[key];
            }
        });
        return obj;
    }

    static fromArray(array, keySelector, valueSelector) {
        return array.reduce((accum, item) => {
            const key = typeof keySelector === 'function' ? keySelector(item) : item[keySelector];
            const value = valueSelector ? (typeof valueSelector === 'function' ? valueSelector(item) : item[valueSelector]) : item;
            accum[key] = value;
            return accum;
        }, {});
    }

    static fromMap(map) {
        if (!(map instanceof Map)) return map;
        let obj = {};
        for (let [key, value] of map.entries()) {
            obj[key] = value;
        }
        return obj;
    }

    static toMap(obj) {
        let map = new Map();
        for (let [key, value] of Object.entries(obj)) {
            map.set(key, value);
        }
        return map;
    }
}
