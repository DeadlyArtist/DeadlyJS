class RegistryEntry {
    obj;
    id;
    tags;
    registry;

    constructor(obj, settings = null) {
        settings ??= {};
        this.obj = obj;
        this.id = settings.id ?? RegistryEntry.extractId(obj);
        this.tags = new Set([...(settings.tags ?? [])]);
    }

    static extractId(obj) {
        if (isString(obj) || isNumber(obj)) return obj;
        return obj.id ?? obj.name ?? obj.title;
    }

    unregister() {
        this.registry?.unregisterEntry(this);
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }
}

class Registry {
    entries = new LinkedMap();
    entriesByObjects = new Map();
    streams = new Set();
    batchStreams = new Set();
    tags = new Map();
    name;

    get size() {
        return this.entries.size;
    }

    get length() {
        return this.size;
    }

    [Symbol.iterator]() {
        return this.values();
    }

    constructor(name = null) {
        this.name = name;

        this.setup();
    }

    setup() {
        let selfRef = new WeakRef(this);
        (async function () {
            while (true) {
                await sleep(100);
                let self = selfRef.deref();
                if (!self) return;
                self._processBatchStreams();
            }
        })();
    }

    register(obj, settings = null) {
        return this.registerEntry(new RegistryEntry(obj, settings), settings);
    }

    registerEntry(entry, settings = null) {
        settings ??= {};

        if (entry.id == null) return null;
        if (this.has(entry) && !settings.replace) return null;

        this.unregister(entry);
        if (settings.replace) {
            let id = settings.replace === true ? entry.id : this.getId(settings.replace);
            if (id == this.first?.id) settings.insertFirst = true;
            else settings.insertAfter = this.getEntryBefore(id);
            this.unregister(id);
        }
        let insertInfo = { insertFirst: settings.insertFirst, insertBefore: settings.insertBefore, insertAfter: settings.insertAfter };;
        this.insertEntryAt(entry, insertInfo);

        // Add entry to the primary registries
        this.entriesByObjects.set(entry.obj, entry);
        entry.registry = this;

        // Handle tags
        if (entry.tags) {
            for (let tag of entry.tags) this.addToTag(tag, entry, false);
        }

        // Notify any active streams
        for (const stream of this.streams) stream.callback(this._getStreamCallbackParam(entry, true, insertInfo));
        for (const stream of this.batchStreams) {
            stream.batchState.registered.add(entry);
            stream.batchState.unregistered.delete(entry);
        }

        return entry;
    }

    insertEntryAt(entry, settings) {
        const { insertFirst, insertBefore, insertAfter } = settings;

        let success = false;
        if (insertBefore) {
            const keyBefore = this.getInsertTargetKey(insertBefore);
            if (keyBefore !== undefined) {
                this.entries.setBefore(keyBefore, entry.id, entry);
                success = true;
            }
        } else if (insertAfter) {
            const keyAfter = this.getInsertTargetKey(insertAfter);
            if (keyAfter !== undefined) {
                this.entries.setAfter(keyAfter, entry.id, entry);
                success = true;
            }
        } else if (insertFirst) {
            this.entries.setFirst(entry.id, entry);
            success = true;
        }

        if (!success) {
            this.entries.set(entry.id, entry); // Default to adding at the end
        }
    }

    /**
     * `id` can be id, object, or entry
     */
    unregister(id) {
        let entry = this.getEntry(id);
        if (!entry) return null;

        // Remove entry from the primary registries
        this.entries.delete(entry.id);
        this.entriesByObjects.delete(entry.obj);
        entry.registry = null;

        // Remove entry from tag registries
        if (entry.tags) {
            for (let tag of entry.tags) this.removeFromTag(tag, entry, false);
        }

        // Notify streams
        for (const stream of this.streams) stream.callback(this._getStreamCallbackParam(entry, false));
        for (const stream of this.batchStreams) {
            stream.batchState.unregistered.add(entry);
            stream.batchState.registered.delete(entry);
        }

        return entry;
    }

    clear() {
        for (let entry of this.getAllEntries()) this.unregister(entry);
    }

    /**
     * `id` can be id, object, or entry
     */
    getId(id) {
        if (id == null) return null;
        let entry = this.getEntryForObject(id);
        if (entry != null) id = entry.id;
        else id = RegistryEntry.extractId(id);
        return id;
    }

    /**
     * `id` can be id, object, or entry
     */
    get(id) {
        return this.getEntry(id)?.obj;
    }

    /**
     * `id` can be id, object, or entry
     */
    getEntry(id) {
        return this.entries.get(this.getId(id));
    }

    getEntryForObject(obj) {
        return this.entriesByObjects.get(obj);
    }

    /**
     * `id` can be id, object, or entry
     */
    getIndex(id) {
        return this.entries.getKeyIndex(this.getId(id));
    }

    getInsertTargetKey(target) {
        if (typeof target === 'number') {
            return this.entries.getKeyAtIndex(target);
        } else {
            const id = this.getId(target);
            return id;
        }
    }

    getAll() {
        return [...this.entries.values()].map(entry => entry.obj);
    }

    getAllEntries() {
        return [...this.entries.values()];
    }

    forEach(callback, thisArg = undefined) {
        for (const obj of this) {
            callback.call(thisArg, obj, this.getEntryForObject(obj), this.getAllEntries());
        }
    }

    *values() {
        for (const entry of this.entries.values()) {
            yield entry.obj;
        }
    }

    *entries() {
        for (const entry of this.entries.values()) {
            yield entry;
        }
    }

    get first() {
        return this.entries.first?.obj;
    }

    get firstEntry() {
        return this.entries.first;
    }

    get last() {
        return this.entries.last?.obj;
    }

    get lastEntry() {
        return this.entries.last;
    }

    getBefore(id) {
        const keyBefore = this.entries.getKeyBefore(this.getId(id));
        return this.entries.get(keyBefore)?.obj;
    }

    getEntryBefore(id) {
        const keyBefore = this.entries.getKeyBefore(this.getId(id));
        return this.entries.get(keyBefore);
    }

    getAfter(id) {
        const keyAfter = this.entries.getKeyAfter(this.getId(id));
        return this.entries.get(keyAfter)?.obj;
    }

    getEntryAfter(id) {
        const keyAfter = this.entries.getKeyAfter(this.getId(id));
        return this.entries.get(keyAfter);
    }

    /**
     * `id` can be id, object, or entry
     */
    has(id) {
        return this.entries.has(this.getId(id));
    }

    /**
     * use has instead
     */
    contains(id) {
        return this.has(id);
    }

    stream(callback) {
        for (const entry of this.getAllEntries()) callback(this._getStreamCallbackParam(entry, true));

        let self = this;
        const stream = {
            callback,
            stop: () => self.streams.delete(stream), // Unregister the stream
        };
        this.streams.add(stream);

        return stream;
    }

    _getStreamCallbackParam(entry, registered, insertInfo = null) {
        return { obj: entry.obj, entry, insertInfo, registered };
    }

    streamBatch(callback) {
        callback(this._getStreamBatchCallbackParam(this.getAllEntries()));

        const batchState = {
            registered: new Set(),
            unregistered: new Set(),
        };

        let self = this;
        const stream = {
            batchState,
            callback,
            stop: () => self.streams.delete(stream), // Unregister the stream
        };
        this.batchStreams.add(stream);

        return stream;
    }

    _getStreamBatchCallbackParam(registeredEntries, unregisteredEntries = null) {
        registeredEntries ??= [];
        unregisteredEntries ??= [];
        return { registered: registeredEntries.map(e => e.obj), registeredEntries: registeredEntries, unregistered: unregisteredEntries.map(e => e.obj), unregisteredEntries: unregisteredEntries };
    }

    _processBatchStreams() {
        for (const stream of this.batchStreams) {
            const registered = [...stream.batchState.registered];
            const unregistered = [...stream.batchState.unregistered];
            if (registered.length || unregistered.length) {
                stream.callback(this._getStreamBatchCallbackParam(registered, unregistered));
                stream.batchState.registered.clear();
                stream.batchState.unregistered.clear();
            }
        }
    }

    streamTag(tag, callback) {
        this.tryInitTag(tag);
        return this.getTagRegistry(tag).stream(callback);
    }

    clone() {
        return Registry.fromJSON(JSON.stringify(this));
    }

    // Does NOT return a string. Use JSON.stringify instead.
    toJSON() {
        return {
            name: this.name,
            entries: this.getAllEntries().map(entry => ({
                id: entry.id,
                tags: entry.tags,
                obj: entry.obj,
            })),
        };
    }

    static fromJSON(json) {
        const parsed = JSON.parse(json);
        const registry = new Registry(parsed.name);
        parsed.entries.forEach(entryData => {
            registry.register(entryData.obj, entryData.id, entryData.tags);
        });
        return registry;
    }


    // Tags
    tryInitTag(tag) {
        tag = RegistryEntry.extractId(tag);
        if (!this.tags.has(tag)) {
            this.tags.set(tag, new Registry(tag));
        }
    }

    /**
     * @returns {Registry}
     */
    getTagRegistry(tag) {
        tag = RegistryEntry.extractId(tag);
        return this.tags.get(tag);
    }

    addToTag(tag, entry, addToEntry = true) {
        tag = RegistryEntry.extractId(tag);
        this.tryInitTag(tag);
        const tagRegistry = this.getTagRegistry(tag);
        tagRegistry.register(entry.obj);
        if (addToEntry) entry.tags.add(tag);
    }

    removeFromTag(tag, entry, removeFromEntry = true) {
        tag = RegistryEntry.extractId(tag);
        if (removeFromEntry) entry.tags.delete(tag);

        const tagRegistry = this.getTagRegistry(tag);
        if (!tagRegistry) return;

        tagRegistry.unregister(entry);
    }

    getAllByTag(tag) {
        const tagRegistry = this.getTagRegistry(tag);
        return tagRegistry ? tagRegistry.getAll() : [];
    }

    getAllEntriesByTag(tag) {
        const tagRegistry = this.getTagRegistry(tag);
        return tagRegistry ? tagRegistry.getAllEntries() : [];
    }

    tagExists(tag) {
        tag = RegistryEntry.extractId(tag);
        return this.tags.get(tag)?.size > 0;
    }

    // JSON
    toJSON() {
        return this.getAllEntries().map(entry => ({
            id: entry.id,
            tags: [...entry.tags],
            obj: entry.obj,
        }));
    }

    static fromJSON(json) {
        let registry = new Registry();
        json.forEach(e => registry.register(e.obj, { id: e.id, tags: e.tags }));
        return registry;
    }

    // List method wrappers
    filter(callback, thisArg = undefined) {
        const result = [];
        for (const obj of this) {
            if (callback.call(thisArg, obj, this.getEntryForObject(obj), this)) {
                result.push(obj);
            }
        }
        return result;
    }

    find(callback, thisArg = undefined) {
        for (const obj of this) {
            if (callback.call(thisArg, obj, this.getEntryForObject(obj), this)) {
                return obj;
            }
        }
        return undefined;
    }

    some(callback, thisArg = undefined) {
        for (const obj of this) {
            if (callback.call(thisArg, obj, this.getEntryForObject(obj), this)) {
                return true;
            }
        }
        return false;
    }

    every(callback, thisArg = undefined) {
        for (const obj of this) {
            if (!callback.call(thisArg, obj, this.getEntryForObject(obj), this)) {
                return false;
            }
        }
        return true;
    }

    map(callback, thisArg = undefined) {
        const result = [];
        for (const obj of this) {
            result.push(callback.call(thisArg, obj, this.getEntryForObject(obj), this));
        }
        return result;
    }

    reduce(callback, initialValue) {
        let accumulator = initialValue;
        for (const obj of this) {
            accumulator = callback(accumulator, obj, this.getEntryForObject(obj), this);
        }
        return accumulator;
    }

    includes(obj) {
        return this.has(obj);
    }

    indexOf(obj) {
        let index = 0;
        for (const entry of this) {
            if (entry === obj) return index;
            index++;
        }
        return -1;
    }

    flatMap(callback, thisArg = undefined) {
        const result = [];
        for (const obj of this) {
            const value = callback.call(thisArg, obj, this.getEntryForObject(obj), this);
            result.push(...value);
        }
        return result;
    }

    join(separator = null) {
        return this.getAll().join(separator);
    }
}
