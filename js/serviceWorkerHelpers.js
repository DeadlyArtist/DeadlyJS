class ServiceWorkerHelpers {
    static updated = [];
    static askedForReload = false;

    static setup() {
        function _debounce(func, delay) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        }
        this.debouncedTryPromptResourceUpdate = _debounce(() => this.debouncedTryPromptResourceUpdate(false), 1000);

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/serviceWorker.js", {
                updateViaCache: "none", // disable caching, because it is now handled by the service worker
            }).then(reg => {
                reg.onupdatefound = () => {
                    const newWorker = reg.installing;

                    newWorker.onstatechange = () => {
                        if (newWorker.state === "installed") {
                            if (navigator.serviceWorker.controller) {
                                // A new update is available
                                console.log("New update available, refresh to update.");
                                if (confirm("A new version of the app is available. Refresh?")) {
                                    window.location.reload();
                                }
                            } else {
                                console.log("Service Worker installed for the first time.");
                            }
                        }
                    };
                };

                navigator.serviceWorker.addEventListener("message", event => {
                    if (event.data && event.data.type === "RESOURCE_UPDATED") {
                        const resource = event.data.resource;
                        ServiceWorkerHelpers.resourceUpdateReceived(resource);
                    }
                });
            });
        }
    }

    static resourceUpdateReceived(resource) {
        console.log("New version found for resource (reload to update):", resource);
        ServiceWorkerHelpers.updated.push(resource);
        window.dispatchEvent(new CustomEvent('cached-resource-updated'));

        //if (confirm(`A resource has been updated (${resource}). Refresh to apply updates?`)) {
        //    window.location.reload();
        //}
    }

    static async onResourceUpdateReceived(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.updated.length != 0) {
                _callback();
            }
            window.addEventListener('cached-resource-updated', e => {
                _callback();
            });
        });
    }

    static tryPromptResourceUpdate(debounce = true) {
        if (debounce) this.debouncedTryPromptResourceUpdate();
        if (this.updated.length == 0) return;
        if (this.askedForReload) return;
        this.askedForReload = true;

        if (confirm(`Refresh to apply updates?`)) {
            window.location.reload(true);
        }
    }
}

ServiceWorkerHelpers.setup();
