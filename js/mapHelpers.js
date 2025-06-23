class MapHelpers {
    static insertAtIndex(map, index, key, value, output = null) {
        output ??= {};
        const arr = Array.from(map);
        output.index = index;
        output.insertedBefore = index > 0 ? arr[index - 1][0] : null;
        output.insertedAfter = index < arr.length ? arr[index][0] : null;
        arr.splice(index, 0, [key, value]);
        map.clear();
        arr.forEach(([k, v]) => map.set(k, v));
    }

    static insertBefore(map, beforeKey, key, value) {
        const arr = Array.from(map);
        const index = arr.findIndex(([k]) => k === beforeKey);
        if (index === -1) throw new Error(`Key "${beforeKey}" not found in the map.`);
        this.insertAtIndex(map, index, key, value);
    }

    static insertAfter(map, afterKey, key, value) {
        const arr = Array.from(map);
        const index = arr.findIndex(([k]) => k === afterKey);
        if (index === -1) throw new Error(`Key "${afterKey}" not found in the map.`);
        this.insertAtIndex(map, index + 1, key, value);
    }
}
