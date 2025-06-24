//// REGION: URL Formatting
//// Format the URL to remove ugly parts
function _tryRemoveIndexHtml() {
    let pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    if (pathname.endsWith('index.html')) {
        pathname = pathname.substring(0, pathname.length - 'index.html'.length);
        const newUrl = `${pathname}${search}${hash}`;
        window.history.replaceState(null, "", newUrl);
        return true;
    }
    return false;
}
_tryRemoveIndexHtml();

function _tryRemoveEmptyHash() {
    let urlWithoutHash = window.location.href.split('#')[0];
    let hash = window.location.hash;
    if (hash != null && hash.length < 2) {
        history.replaceState(null, "", urlWithoutHash);
        return true;
    }
    return false;
}
// No need to stop propagation because it replaces state, which doesn't cause any events
window.addEventListener('hashchange', _tryRemoveEmptyHash);
window.addEventListener('load-silently', _tryRemoveEmptyHash);
_tryRemoveEmptyHash();
//// ENDREGION


//// REGION: Helper Events
(function () {
    const observer = new MutationObserver(() => {
        if (document.body) {
            observer.disconnect(); // Stop observing once the body is found

            // Dispatch custom body-created event
            const event = new CustomEvent('body-created');
            window.dispatchEvent(event);
        }
    });

    // Start observing the document element for added nodes (the body)
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();

async function onBodyCreated(callback) {
    return new Promise((resolve, reject) => {
        let _callback = () => { callback(); resolve(); }
        if (document.body) {
            _callback();
        } else {
            window.addEventListener('body-created', e => _callback());
        }
    });
}

let isLoaded = false;
async function onLoaded(callback) {
    return new Promise((resolve, reject) => {
        let _callback = () => { callback(); resolve(); }
        if (isLoaded) {
            _callback();
        } else {
            window.addEventListener('load', e => _callback());
        }
    });
}
onLoaded(() => isLoaded = true);

let isHtmlFromBeforeScriptsLoaded = false;
async function onBeforeScriptsAfterHtml(callback) {
    return new Promise((resolve, reject) => {
        let _callback = () => { callback(); resolve(); }
        if (isHtmlFromBeforeScriptsLoaded) {
            _callback();
        } else {
            window.addEventListener('before-scripts', e => _callback());
        }
    });
}

onBodyCreated(() => {
    (function () {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const addedEvent = new CustomEvent('added', { bubbles: false });
                        node.dispatchEvent(addedEvent);
                        node.querySelectorAll('*').forEach((child) => {
                            child.dispatchEvent(addedEvent);
                        });
                    }
                });
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const removedEvent = new CustomEvent('removed', { bubbles: false });
                        node.dispatchEvent(removedEvent);
                        node.querySelectorAll('*').forEach((child) => {
                            child.dispatchEvent(removedEvent);
                        });
                    }
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    })();
});
//// ENDREGION


//// REGION: Input Helpers
// Keep track of key pressed states
pressedKeys = {};

(function () {
    function onKeyDown(event) {
        pressedKeys[event.key] = true;
    }

    function onKeyUp(event) {
        delete pressedKeys[event.key];
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
})();
window.addEventListener('focus', () => {
    Object.keys(pressedKeys).forEach(key => delete pressedKeys[key]); // Delete all keys upon gaining focus to prevent missing a keyup from outside the window
});

function isKeyPressed(key) {
    return !!pressedKeys[key];
}


let lastMousePosition = null;
let isMouseInputReal = false;
onBodyCreated(() => {
    const dispatchFakeMousemove = () => {
        if (lastMousePosition) {
            const { x, y } = lastMousePosition;
            let targetElement = document.elementFromPoint(x, y);
            if (!targetElement) targetElement = document.body;

            const fakeMouseEvent = new MouseEvent('mousemove-polled', {
                clientX: x,
                clientY: y,
                bubbles: true,
                cancelable: true,
            });

            targetElement.dispatchEvent(fakeMouseEvent);
        }

        requestAnimationFrame(dispatchFakeMousemove); // Post during each rerender
    };

    dispatchFakeMousemove();
});
document.addEventListener('mousemove', e => {
    if (isMouseInputReal) lastMousePosition = { x: e.clientX, y: e.clientY };
}, true);
document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === "mouse") {
        isMouseInputReal = true;
    } else {
        isMouseInputReal = false;
        lastMousePosition = null;
    }
}, true);
document.addEventListener('pointermove', (e) => {
    if (e.pointerType === "mouse") {
        isMouseInputReal = true;
    } else {
        isMouseInputReal = false;
        lastMousePosition = null;
    }
}, true);
//// ENDREGION


//// REGION: Random helpers
const letterCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function generateRandomLetters(length, alphabet = letterCharacters) {
    const charactersLength = alphabet.length;
    let result = "";
    let counter = 0;
    while (counter < length) {
        result += alphabet.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
const letterAndDigitCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateRandomLettersOrDigits(length) {
    return generateRandomLetters(length, letterAndDigitCharacters);
}
function generateUniqueId() {
    return Date.now() + "_" + generateRandomLettersOrDigits(20);
}
//// ENDREGION


//// REGION: Event helpers
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function isChildEvent(event) {
    return event.currentTarget.contains(event.fromElement) || event.currentTarget === event.fromElement;
}

function isChildLeaveEvent(event) {
    return event.currentTarget.contains(event.toElement) || event.currentTarget === event.toElement;
}
//// ENDREGION


//// REGION: Variety
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sleepUntil(targetTime) {
    const currentTime = new Date().getTime();
    const delay = targetTime - currentTime;

    if (delay <= 0) {
        // If the target time is in the past or now, resolve immediately
        return Promise.resolve();
    } else {
        return sleep(delay);
    }
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function jsonEquals(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function equalSets(set1, set2) {
    return set1.size === set2.size &&
        [...set1].every((x) => set2.has(x));
}

function between(x, min, max) {
    return x >= min && x <= max;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

// Stop save events
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
    }
});

function intDivision(a, b) {
    return Math.floor(a / b);
}

function isPowerOfTwo(x) {
    return (x & (x - 1)) === 0;
}

function logStorageSizes() {
    let _lsTotal = 0, _xLen, _x;
    for (_x in localStorage) {
        if (!localStorage.hasOwnProperty(_x)) {
            continue;
        }
        _xLen = ((localStorage[_x].length + _x.length) * 2);
        _lsTotal += _xLen;
        console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB")
    }
    ; console.log("Total = " + (_lsTotal / 1024).toFixed(2) + " KB");
}

// Defaults to max length
function setCookie(name, value, days = null) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    } else {
        const daysToExpire = new Date(2147483647 * 1000).toUTCString();
        expires = "; expires=" + daysToExpire;
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

/**
 * Executes async function on an iterator of items in parallel and returns their output in an array in the same order as the iterator.
 * */
async function parallel(iterator, asyncFunc) {
    const array = [...iterator];
    const results = new Array(array.length);
    const promises = [];
    const errors = [];
    array.forEach((item, index) => promises.push(asyncFunc(item, index).then(result => results[index] = result, error => errors.push(error))));

    await Promise.allSettled(promises);

    if (errors.length != 0) throw errors[0];
    return results;
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function doNothing() { }

// Requires DOMPurify library
function sanitizeHtml(html) {
    return DOMPurify.sanitize(html);
}

const kilobyte = 1024;
const megabyte = kilobyte * 1024;
const gigabyte = megabyte * 1024;


function isNumber(obj) {
    return typeof obj == 'number';
}
function isBigInt(value) {
    return typeof value === 'bigint';
}
// isString is in string helpers region
function isFunction(obj) {
    return typeof obj == 'function';
}
function isArray(obj) {
    return Array.isArray(obj);
}
function isObject(obj) {
    return typeof obj == 'object';
}
//// ENDREGION


//// REGION: Time helpers
const millisecond = 1;
function milliseconds(milliseconds) {
    return millisecond * milliseconds;
}

const second = millisecond * 1000;
function seconds(seconds) {
    return second * seconds;
}

const minute = second * 60;
function minutes(minutes) {
    return minute * minutes;
}

const hour = minute * 60;
function hours(hours) {
    return hour * hours;
}

const day = hour * 24;
function days(days) {
    return day * days;
}

const week = day * 24;
function weeks(weeks) {
    return week * weeks;
}

function isDurationOver(startTime, duration) {
    return Date.now() - startTime > duration;
}

function getRemainingDuration(startTime, duration) {
    const elapsed = Date.now() - startTime;
    const remaining = duration - elapsed;
    return remaining > 0 ? remaining : 0;
}
//// ENDREGION


//// REGION: Fetch helpers
class FetchHelpers {
    static fetchCache = {};
    static fetchPromises = {};
    static fetchTextCache = {};
    static fetchTextPromises = {};
}

async function fetchText(url) {
    const response = await fetch(url);
    return await response.text();
}

async function fetchFromJson(url) {
    return JSON.parse(await fetchText(url));
}

async function fetchWithCache(url) {
    if (FetchHelpers.fetchCache[url]) return FetchHelpers.fetchCache[url];
    if (FetchHelpers.fetchPromises[url]) return await FetchHelpers.fetchPromises[url];

    const promise = fetch(url);
    FetchHelpers.fetchPromises[url] = promise;
    const result = await promise;
    FetchHelpers.fetchCache[url] = result;
    delete FetchHelpers.fetchPromises[url];
    return result;
}

async function fetchTextWithCache(url) {
    if (FetchHelpers.fetchTextCache[url]) return await FetchHelpers.fetchTextCache[url];
    if (FetchHelpers.fetchTextPromises[url]) return await FetchHelpers.fetchTextPromises[url];

    const promise = (async () => {
        const response = await fetch(url);
        const text = await response.text();
        return text;
    })();
    FetchHelpers.fetchTextPromises[url] = promise;
    const result = await promise;
    FetchHelpers.fetchTextCache[url] = result;
    delete FetchHelpers.fetchTextPromises[url];
    return result;
}

async function fetchFromJsonWithCache(url) {
    return JSON.parse(await fetchTextWithCache(url));
}
//// ENDREGION


//// REGION: String helpers
const _htmlStringHelpers = {
    escapeHtmlChars: {
        '¢': 'cent',
        '£': 'pound',
        '¥': 'yen',
        '€': 'euro',
        '©': 'copy',
        '®': 'reg',
        '<': 'lt',
        '>': 'gt',
        '"': 'quot',
        '&': 'amp',
        '\'': '#39',
    },
    getEscapeHtmlRegex() {
        let escapeHtmlRegexString = '[';
        for (let key in _htmlStringHelpers.escapeHtmlChars) {
            escapeHtmlRegexString += key;
        }
        escapeHtmlRegexString += ']';
        const regex = new RegExp(escapeHtmlRegexString, 'g');
        return regex;
    },
    htmlEntities: {
        nbsp: ' ',
        cent: '¢',
        pound: '£',
        yen: '¥',
        euro: '€',
        copy: '©',
        reg: '®',
        lt: '<',
        gt: '>',
        quot: '"',
        amp: '&',
        apos: '\''
    },
};
_htmlStringHelpers.escapeHtmlRegex = _htmlStringHelpers.getEscapeHtmlRegex();

function escapeHTML(str) {
    return String(str).replace(_htmlStringHelpers.escapeHtmlRegex, function (m) {
        return '&' + _htmlStringHelpers.escapeHtmlChars[m] + ';';
    });
}
function unescapeHTML(str) {
    return str.replace(/\\&([^;]+);/g, function (entity, entityCode) {
        let match;

        if (entityCode in _htmlStringHelpers.htmlEntities) {
            return _htmlStringHelpers.htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#x([\\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#(\\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function unescapeRegex(string) {
    return string.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');  // $1 refers to the captured group
}

function escapeReplacement(string) {
    return string.replace(/\$/g, '$$$$');
}

function escapeCamelCase(name) {
    const parts = escapeFileName(name).replace('\.\-', ' ').replace('( )*', ' ').trim().split(' ');
    if (parts[0].length != 0) parts[0] = parts[0][0].toLowerCase() + parts[0].slice(1);
    for (let i = 1; i < parts.length; i++) {
        if (parts[i].length != 0) parts[i] = parts[i][0].toUpperCase() + parts[i].slice(1);
    }
    return parts.join('');
}

function removeFirstChar(str) {
    return str.substring(1);
}
function removeLastChar(str) {
    return str.substring(0, str.length - 1);
}

function isString(str, orNull = false) {
    return (orNull && str == null) || typeof str === 'string' || str instanceof String;
}

function getStringByteSize(string) {
    string.length * 2;
}

function addIndent(string, spaces = 4) {
    return string.split('\n').map(l => ' '.repeat(spaces) + l).join('\n');
}
function getIndexBeyond(string, searchTerm, startIndex = 0) {
    const nextIndex = string.indexOf(searchTerm, startIndex);
    if (nextIndex === -1) return null;
    const newIndex = nextIndex + searchTerm.length;
    if (newIndex === searchTerm.length) return null;
    return nextIndex;
}

function getSubstringAfterOrNull(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    if (searchIndex === -1) return null;
    return string.slice(searchIndex + searchTerm.length);
}

function getSubstringAfter(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    return searchIndex === -1 ? string : string.slice(searchIndex + searchTerm.length);
}

function getSubstringBeforeOrNull(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    if (searchIndex === -1) return null;
    return string.slice(0, searchIndex);
}

function getSubstringBefore(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    return searchIndex === -1 ? string : string.slice(0, searchIndex);
}

function getSubstringAfterLastOrNull(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    if (lastIndex === -1) return null;
    return string.slice(lastIndex + searchTerm.length, adjustedEndIndex);
}

function getSubstringAfterLast(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    return lastIndex === -1 ? '' : string.slice(lastIndex + searchTerm.length, adjustedEndIndex);
}

function getSubstringBeforeLastOrNull(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    if (lastIndex === -1) return null;
    return string.slice(0, lastIndex);
}

function getSubstringBeforeLast(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    return lastIndex === -1 ? string : string.slice(0, lastIndex);
}

function getSubstringStartingWith(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    return searchIndex === -1 ? '' : string.slice(searchIndex);
}

function getSubstringStartingWithOrNull(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    return searchIndex === -1 ? null : string.slice(searchIndex);
}

function getSubstringStartingWithLast(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    return lastIndex === -1 ? '' : string.slice(lastIndex);
}

function getSubstringStartingWithLastOrNull(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    return lastIndex === -1 ? null : string.slice(lastIndex);
}

function toNormalCase(text, makeLowerCase = false) {
    if (makeLowerCase) text = text.toLowerCase();
    text = text.replace(/_/g, ' ');
    return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function toTextCase(text) {
    text = toNormalCase(text);
    text = text.replace(/([A-Z])/g, ' $1').trim();
    return text;
}

function toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

function findAllIndicesInString(str, subString) {
    if (subString.length == 0) return range(str.length);
    let indices = [];
    let i = 0;
    while (~(i = str.indexOf(subString, i))) {
        indices.push(i);
        i += subString.length;
    }
    return indices;
}
//// ENDREGION



//// REGION: URL helpers
function getUrl() {
    return window.location.href;
}

function getUrlBase(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    url = getSubstringBefore(url, '?');
    return url;
}

function getUrlWithoutHash(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    return url;
}

function getUrlModifiers(url = null) {
    url ??= window.location.href;
    hash = url.indexOf('#');
    query = url.indexOf('?');
    if (hash == query) return "";

    var first = query;
    if (hash < query) {
        if (hash != -1) first = hash;
    } else {
        if (query == -1) first = hash;
    }
    url = url.substring(first);

    return url;
}

function getServerUrl(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    return url;
}

function getPath(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    url = getSubstringBefore(url, '?');
    const domainEndIndex = url.indexOf('//') >= 0 ? url.indexOf('/', url.indexOf('//') + 2) : url.indexOf('/');
    if (domainEndIndex === -1) return '/';
    return url.substring(domainEndIndex);
}

function getDomain(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    url = getSubstringBefore(url, '?');
    const doubleSlashIndex = url.indexOf('//');
    const domainStartIndex = (doubleSlashIndex >= 0) ? doubleSlashIndex + 2 : 0;
    const domainEndIndex = url.indexOf('/', domainStartIndex);
    if (domainEndIndex === -1) url = url.substring(domainStartIndex);
    url = url.substring(domainStartIndex, domainEndIndex);

    if (!url.includes('.') || url.length == 0) return null;
    return url;
}

function getOrigin(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    url = getSubstringBefore(url, '?');
    const doubleSlashIndex = url.indexOf('//');
    const protocol = doubleSlashIndex >= 0 ? url.substring(0, doubleSlashIndex + 2) : '';
    const domain = getDomain(url);
    return protocol + domain;
}

function getProtocol(url = null) {
    url ??= window.location.href;
    const protocolEndIndex = url.indexOf(':');
    if (protocolEndIndex === -1) return '';
    return url.substring(0, protocolEndIndex);
}

function getUrlWithChangedPath(newPath, url = null) {
    url ??= window.location.href;
    const origin = getOrigin(url), modifiers = getUrlModifiers(url);
    if (!newPath.startsWith('/')) newPath = '/' + newPath;
    return origin + newPath + modifiers;
}

function getUrlWithChangedHash(newHash, url = null) {
    url ??= window.location.href;
    const base = getUrlBase(url), query = getSubstringBefore(getUrlModifiers(url), '#');
    if (newHash == '#') newHash = '';
    else if (!newHash.startsWith('#')) newHash = '#' + newHash;
    return base + query + newHash;
}

function getUrlWithChangedDomain(newDomain, url = null) {
    url ??= window.location.href;
    const protocol = getProtocol(url), path = getPath(url), modifiers = getUrlModifiers(url);
    return `${protocol}://${newDomain}${path}${modifiers}`;
}

function getUrlWithChangedOrigin(newOrigin, url = null) {
    url ??= window.location.href;
    const path = getPath(url), modifiers = getUrlModifiers(url);
    if (newOrigin.endsWith('/')) newOrigin = newOrigin.slice(0, -1);
    return `${newOrigin}${path}${modifiers}`;
}

function getUrlWithChangedProtocol(newProtocol, url = null) {
    url ??= window.location.href;
    const domain = getDomain(url), path = getPath(url), modifiers = getUrlModifiers(url);
    if (!newProtocol.endsWith(':')) newProtocol += ':';
    return `${newProtocol}//${domain}${path}${modifiers}`;
}

function getQueryVariable(variable, url = null) {
    url ??= window.location.href;
    url = url.split('#')[0];
    const query = url.split('?')[1];
    if (!query) return undefined;

    const vars = query.split('&');
    for (const pair of vars) {
        const [key, value] = pair.split('=');
        if (key == variable) return decodeURIComponent(value);
    }
    return undefined;
}


function goToUrl(url) {
    window.location.href = url;
}

function replaceUrl(newUrl) {
    if (newUrl == getUrl()) return;
    history.replaceState(null, "", newUrl);
}

const loadWithoutRequestEvent = new CustomEvent('load-silently');
// Update the browser's URL without reloading the page
function goToUrlWithoutRequest(url, dispatchEvent = true) {
    if (url == getUrl()) return;
    window.history.pushState({}, '', url);
    if (dispatchEvent) window.dispatchEvent(loadWithoutRequestEvent);
}

function changeHash(hash, url = null) {
    const newUrl = getUrlWithChangedHash(hash, url);
    const oldUrl = getUrl();
    if (newUrl == oldUrl) return;
    goToUrlWithoutRequest(newUrl, false);

    const hashChangeEvent = new HashChangeEvent('hashchange', {
        oldURL: oldUrl,
        newURL: newUrl,
    });
    window.dispatchEvent(hashChangeEvent);
}

function createObjectUrl(object, options = undefined) {
    const blob = new Blob([object], options);
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
}
//// ENDREGION


//// Region: Hash helpers
/**
 * Retrieves the value of the specified query parameter from the current URL.
 *
 * @param {string} param - The name of the parameter to retrieve.
 * @param {boolean} log - Whether to log the param.
 * @returns {string|null} - Returns the value of the parameter, or null if the parameter is not found.
 */
function getHashQueryVariable(param, log = false) {
    let hashSearchParams = getHashParams();

    let value = hashSearchParams.get(param);
    if (log) console.log(param, value);
    // Use the get method to retrieve the value of the parameter
    return value;
}

class URLHashParams {
    constructor(params) {
        this.params = new Map(params ? params.split('&').map(p => p.split('=').map(q => unescapeHashParameter(q))) : []);
    }

    get(key) {
        return this.params.get(key);
    }

    set(key, value) {
        return this.params.set(key, value);
    }

    delete(key) {
        return this.params.delete(key);
    }

    values() {
        return this.params.values();
    }

    keys() {
        return this.params.keys();
    }

    entries() {
        return this.params.entries();
    }

    toString() {
        return Array.from(this.params.entries())
            .map(([key, value]) => `${escapeHashParameter(key)}=${escapeHashParameter(value)}`)
            .join('&');
    }
}

function getHashParams() {
    let hashParts = window.location.hash.split("?");
    let hashSearchParams = new URLHashParams(hashParts.length === 1 ? '' : hashParts[1]);
    return hashSearchParams;
}

function getHash(url = null) {
    url ??= window.location.href;
    let parts = url.split('#', 2);
    let hash;
    if (parts.length == 1) hash = '';
    else hash = parts[1];
    return '#' + hash;
}

function getHashUrl() {
    let hashParts = window.location.hash.split("?");
    return hashParts[0];
}

function getPathFromHash() {
    return removeFirstChar(getHashUrl());
}

function getPathPartFromHash(index) {
    const parts = getPathFromHash().split("/");
    return parts.length > index ? parts[index] : null;
}

function buildUrlWithNewHashParams(hashSearchParams) {
    let hashSearchParamsString = hashSearchParams.toString();

    let url = new URL(window.location);
    url.hash = '';
    let hashParts = window.location.hash.split("?");
    let baseHash = hashParts[0];
    if (baseHash == '' && hashSearchParamsString != '') baseHash = '#';
    let urlString = url.toString() + baseHash + (hashSearchParamsString === '' ? '' : ('?' + hashSearchParamsString));
    return urlString;
}

function getUrlWithChangedHashParam(name, value) {
    const hashParams = getHashParams();
    if (value == null || value == "") {
        hashParams.delete(name);
    } else {
        hashParams.set(name, value);
    }

    const url = buildUrlWithNewHashParams(hashParams);
    return url;
}

function getHashWithChangedParam(name, value) {
    const url = getUrlWithChangedHashParam(name, value);
    return getHash(url);
}

function escapeHashParameter(param) {
    return param.replace(/[#?&=%]/g, match => encodeURIComponent(match));
}

function unescapeHashParameter(param) {
    return decodeURIComponent(param);
}
//// ENDREGION


//// REGION: Html helpers
/**
 * @param {String} HTML representing a single element.
 * @param {Boolean} collapse representing whether or not to return only the element when only one element exists.
 * @param {Boolean} flag representing whether or not to trim input whitespace, defaults to true.
 * @return {Element | Node | HTMLCollection | null}
 */
function fromHTML(html, collapse = true, trim = true) {
    // Process the HTML string.
    html = trim ? html.trim() : html;
    if (!html) return null;

    // Then set up a new template element.
    const template = document.createElement('template');
    template.innerHTML = html;
    const result = template.content.childNodes;

    // Then return either an HTMLElement or HTMLCollection,
    // based on whether the input HTML had one or more roots.
    if (collapse && result.length === 1) return result[0];
    return result;
}

function getClosestWithProperty(element, property) {
    while (element) {
        if (element[property] !== undefined) return element;
        element = element.parentElement;
    }
    return undefined;
}

function getClosestProperty(element, property) {
    while (element) {
        if (element[property] !== undefined) return element[property];
        element = element.parentElement;
    }
    return undefined;
}

function spliceChildren(element, start = -1, deleteCount = 0, ...newChildren) {
    if (start < 0) start = element.children.length + 1 + start;

    const childElements = [...element.children];
    const removedChildren = childElements.splice(start, deleteCount, ...newChildren);
    removedChildren.forEach(child => child.remove());
    const isLast = element.children.length <= start;
    // Insert new children into the DOM
    newChildren.forEach((child, index) => {
        if (isLast) {
            element.appendChild(child);
        } else {
            element.insertBefore(child, element.children[start + index]);
        }
    });
}

function wrapElement(element, wrapper) {
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);
}

function replaceNode(oldNode, newNode) {
    return oldNode.parentNode.replaceChild(newNode, oldNode);
}

function replaceNodeWithClone(node) {
    const clone = node.cloneNode(true);
    replaceNode(node, clone);
    return clone;
}

function replaceTextNodeWithHTML(node, html) {
    if (node && node.nodeType === Node.TEXT_NODE) {
        let parentNode = node.parentNode;
        // Create a temporary container for the new HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        // Replace the text node with new HTML content
        while (tempDiv.firstChild) {
            parentNode.insertBefore(tempDiv.firstChild, node);
        }
        // Remove the original text node
        node.remove();
    }
}

function getTextNodesFromArray(elements, settings = null) {
    settings ??= {};
    let nodes = [];
    if (!elements) return nodes;

    for (let element of elements) {
        (function worker(node, matchedInclude = false) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (!settings.includeQuery || matchedInclude) nodes.push(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (settings.excludeQuery && node.matches(settings.excludeQuery)) return;
                for (const child of node.childNodes) {
                    worker(child, matchedInclude || node.matches(settings.includeQuery));
                }
            }
        })(element);
    }

    return nodes;
}

function getTextNodes(element, settings = null) {
    return getTextNodesFromArray([element], settings);
}

function getTextNodesFast(element) {
    // Get all text nodes within the element
    let walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let nodes = [];
    let node;
    while ((node = walker.nextNode())) {
        nodes.push(node);
    }
    return nodes;
}

function getTextFromTextNodes(textNodes) {
    let text = "";
    for (let node of textNodes) {
        text += node.nodeValue;
    }
    return text;
}

// Find text nodes overlapping with a range
function findTextNodesByIndices(nodes, rangeStart, rangeEnd) {
    let result = {};
    let offset = 0;
    for (let node of nodes) {
        let start = offset;
        let end = start + node.nodeValue.length - 1;
        if (end < rangeStart) {
            offset += node.nodeValue.length;
            continue;
        }
        if (start > rangeEnd) break;

        let overlapStart = Math.max(start, rangeStart);
        result[overlapStart] = { node: node, relativeIndex: overlapStart - offset };
        offset += node.nodeValue.length;
    }
    return result;
}

function applyFunctionToAllNodes(node, fn, nodeFilter = NodeFilter.SHOW_ALL) {
    const walker = document.createTreeWalker(
        element,
        nodeFilter, // Only process element nodes
        null,
        false
    );

    do {
        fn(walker.currentNode);
    } while (walker.nextNode());
}

function applyFunctionToAllElements(element, fn) {
    applyFunctionToAllNodes(element, fn, NodeFilter.SHOW_ELEMENT);
}
//// ENDREGION
