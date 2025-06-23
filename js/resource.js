class Resource {
    loaded = false;

    get id() {
        return this.link;
    }

    constructor(link, preload = false) {
        this.link = link;
        this.preload = preload;

        let self = this;
        if (preload) onBeforeScriptsAfterHtml(() => self.cache());
    }

    async get() {
        let result = await fetchWithCache(this.link);
        this.setLoaded();
        return result;
    }

    async getText() {
        let result = await fetchTextWithCache(this.link);
        this.setLoaded();
        return result;
    }

    async getFromJson() {
        let result = await fetchFromJsonWithCache(this.link);
        this.setLoaded();
        return result;
    }

    setLoaded() {
        if (this.loaded) return;
        this.loaded = true;
        window.dispatchEvent(new CustomEvent('resource-loaded-' + this.id));
    }

    async onLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.loaded) {
                _callback();
            } else {
                window.addEventListener('resource-loaded-' + this.id, e => {
                    _callback();
                });
            }
        });
    }

    async cache() {
        // Add to service worker cache
        const cache = await caches.open("offline-cache");
        await cache.add(this.link).catch(err => {
            //console.error(`Failed to cache resource: ${resourceUrl}`, err)
        });

        // Preload into app-level fetch cache for runtime access
        await this.get();
    }
}

