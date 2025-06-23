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

let isHtmlBeforeScriptsLoaded = false;
async function onBeforeScriptsAfterHtml(callback) {
    return new Promise((resolve, reject) => {
        let _callback = () => { callback(); resolve(); }
        if (isHtmlBeforeScriptsLoaded) {
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
