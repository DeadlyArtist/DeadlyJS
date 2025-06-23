class Highlighter {
    constructor() {
        this.rangesByNode = new Map(); // Buffers ranges for deferred highlighting
        this.lastBufferTimestamp = null;
        this.waitingToHighlight = false;
        this.highlightDisabled = false;
    }

    // targets accepts either an array of or a single element
    collectHighlightRanges(searchTerm, isExactMatch, targets) {
        if (!targets) return;
        if (!isArray(targets)) targets = [targets];
        targets = targets.filter(t => t); // Ensure valid elements exist

        for (let element of targets) {
            if (!element || element.textContent == null) continue;

            let nodes = getTextNodesFast(element);
            let text = getTextFromTextNodes(nodes);

            // Find all indices where the search term matches
            let indices = [];
            if (isExactMatch) {
                if (element.textContent.toLowerCase() === searchTerm) indices.push(0);
            } else {
                indices = findAllIndicesInString(text.toLowerCase(), searchTerm);
            }

            for (let index of indices) {
                let nodeInfoByIndices = findTextNodesByIndices(nodes, index, index + searchTerm.length - 1);

                for (let [_, nodeInfo] of Object.entries(nodeInfoByIndices)) {
                    const node = nodeInfo.node;
                    const relativeIndex = nodeInfo.relativeIndex;

                    if (!this.rangesByNode.has(node)) {
                        this.rangesByNode.set(node, []);
                    }

                    // Store the relative index along with the search term
                    this.rangesByNode.get(node).push({ relativeIndex, searchTerm });
                }
            }
        }
    }


    unhighlight(container = document.body) {
        let highlightedElements = [...container.getElementsByClassName("search-highlight")];
        for (let element of highlightedElements) {
            element.outerHTML = element.innerHTML;
        }
    }

    async waitToHighlightSections() {
        // Wait for a buffer delay to avoid excessive highlighting
        if (this.waitingToHighlight) return;
        this.waitingToHighlight = true;

        do {
            if (!this.tryHighlight()) {
                await sleep(this.lastWaitTime);
            }
        } while (this.waitingToHighlight);
    }

    // Requires first calling collectHighlightRanges
    tryHighlight() {
        if (this.highlightDisabled) {
            this.waitingToHighlight = false;
            return true;
        }

        // Determine if highlighting is safe to proceed
        let rangeCount = 0;
        for (let ranges of this.rangesByNode.values()) {
            rangeCount += ranges.length;
        }
        let tooManyHighlightRanges = rangeCount >= 200;
        this.lastWaitTime = clamp(rangeCount, 200, 5000) / 2;
        let waitIsOver = this.lastBufferTimestamp + this.lastWaitTime <= Date.now();
        if (!tooManyHighlightRanges || waitIsOver) {
            this.waitingToHighlight = false;
            this.highlight();
            return true;
        } else if (!this.waitingToHighlight) {
            this.waitToHighlightSections();
        }
        return false;
    }

    // Use tryHighlight instead for buffering support
    // Requires first calling collectHighlightRanges
    highlight() {
        for (let [node, ranges] of this.rangesByNode.entries()) {
            if (node.parentElement.closest('.hiddenSearchElement') != null) continue;
            try {
                this.highlightRangesInNode(node, ranges);
            } catch (error) {
                console.error("Error highlighting section:", error, node, ranges);
            }
        }
    }

    highlightRangesInNode(node, ranges) {
        if (!node || node.nodeType !== Node.TEXT_NODE) {
            return;
        }

        // Convert ranges into a stable order
        const sortedRanges = [...ranges].sort((a, b) => a.relativeIndex - b.relativeIndex);

        // Safely split the text content and wrap matches with a <span>
        const text = node.nodeValue;
        const fragments = [];
        let lastIndex = 0;

        for (let { relativeIndex, searchTerm } of sortedRanges) {
            const start = relativeIndex;
            const end = start + searchTerm.length;

            // Ensure no overlap exists
            if (start < lastIndex) continue;

            // Add non-highlight text before the match
            if (start > lastIndex) {
                fragments.push(document.createTextNode(text.slice(lastIndex, start)));
            }

            // Add highlight span for the matched term
            let highlightSpan = document.createElement("span");
            highlightSpan.className = "search-highlight";
            highlightSpan.textContent = text.slice(start, end);
            fragments.push(highlightSpan);

            // Update last index to avoid overlapping
            lastIndex = end;
        }

        // Add any remaining text after the last match
        if (lastIndex < text.length) {
            fragments.push(document.createTextNode(text.slice(lastIndex)));
        }

        // Replace the original node with the processed fragments
        const parent = node.parentNode;
        for (let fragment of fragments) {
            parent.insertBefore(fragment, node);
        }
        parent.removeChild(node);
    }
}
const highlighter = new Highlighter();

// Highlight text in an element or multiple (targets accepts either an array of or a single element)
function highlightText(searchTerm, isExactMatch, targets) {
    highlighter.unhighlight();
    highlighter.collectHighlightRanges(searchTerm, isExactMatch, targets);
    highlighter.highlight();
}