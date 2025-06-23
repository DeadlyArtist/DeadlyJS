class MasonryGrid {
    static gapDefault = 10;
    static widthDefault = 200;
    static allResizeDisabled = false;
    resizeDisabled = false;

    constructor(gridElement) {
        this.grid = gridElement;
        let self = this;
        this.debouncedResize = debounce(() => self.resize());
        this.updateValues();

        this.debouncedResize();
        this.initObservers();
    }

    updateValues() {
        this.gapX = +this.grid.getAttribute('gap-x') || +this.grid.getAttribute('gap') || this.gapDefault;
        this.gapY = +this.grid.getAttribute('gap-y') || +this.grid.getAttribute('gap') || this.gapDefault;
        this.minWidth = +this.grid.getAttribute('min-width') || this.widthDefault;
        this.centerAtStart = this.grid.getAttribute('center-at-start');
        this.centerAtStart = this.centerAtStart != null && this.centerAtStart != "false";
    }

    initObservers() {
        this.initContentObserver();
        this.initAttributeObserver();
    }

    initAttributeObserver() {
        const observer = new MutationObserver(() => {
            this.updateValues();
            resizeMasonryGrid(this.grid);
        });

        observer.observe(this.grid, {
            attributes: true,
            attributeFilter: ['gap-x', 'gap-y', 'min-width', 'center-at-start']
        });
    }

    initContentObserver() {
        const observer = new MutationObserver(mutations => {
            let itemChanged = false;

            // Loop through mutations and detect changes specific to `.masonryGridItem`
            for (const mutation of mutations) {
                if (mutation.target != this.grid && mutation.target.parentElement != this.grid) continue;

                if (mutation.type === "childList" && ([...mutation.addedNodes, ...mutation.removedNodes].some(node => node.classList?.contains("masonryGridItem")))) {
                    this.debouncedResize();
                }
            }
        });

        observer.observe(this.grid, {
            childList: true,  // Detect when children (grid-items) are added or removed
            subtree: true,
        });

        const images = this.grid.querySelectorAll('.masonryGridItem img')
        images.forEach(img => {
            if (!img.complete) {
                img.addEventListener('load', () => this.resize());
            }
        });
    }

    resize(rerun = false) {
        if (this.resizeDisabled || MasonryGrid.allResizeDisabled) return;

        const grid = this.grid;
        if (grid.children.length === 0) {
            grid.style.height = ``;
            return;
        }

        // Measure container and calculate layout - reading phase
        const isScrollbarPresent = isYScrollbarPresent() || rerun;
        const scrollbarWidth = getScrollbarWidth();
        let scrollbarOffset = 0;
        const maxContainerWidth = 1000;
        const leftPaddingMediaSize = 1024;
        if (window.innerWidth >= leftPaddingMediaSize) scrollbarOffset += Math.floor(scrollbarWidth / 2);
        scrollbarOffset += clamp(maxContainerWidth + scrollbarWidth - window.innerWidth, 0, scrollbarWidth);
        // We just assume that a scrollbar will become present upon resize
        // This way, we only resize twice when there weren't many items to begin with
        const containerWidth = grid.clientWidth - (isScrollbarPresent ? 0 : scrollbarOffset);
        const columnCount = Math.max(
            1,
            Math.floor((containerWidth + this.gapX) / (this.minWidth + this.gapX))
        );

        const totalColumnSpace = columnCount * this.minWidth + (columnCount - 1) * this.gapX;
        const remainingSpace = containerWidth - totalColumnSpace;
        const stretchPerColumn = remainingSpace > 0 ? remainingSpace / columnCount : remainingSpace;
        const itemWidth = this.minWidth + stretchPerColumn;

        const items = Array.from(grid.querySelectorAll(":scope > .masonryGridItem"));
        const columns = Array(columnCount).fill(0);
        const positions = []; // Store positions for a later write phase
        let startOffset = 0;

        if (this.centerAtStart && items.length < columnCount) {
            const emptySpace = containerWidth - (items.length * itemWidth + (items.length - 1) * this.gapX);
            startOffset = emptySpace / 2; // Center alignment offset
        }

        const visibleItems = items.filter(item => item.offsetParent !== null);

        // Batch write widths
        visibleItems.forEach(item => {
            item.style.width = `${itemWidth}px`;
        });

        // Batch read height and calculate position
        visibleItems.forEach(item => {
            const minHeight = Math.min(...columns);
            const columnIndex = columns.indexOf(minHeight);
            const xPos = Math.floor(startOffset + (columnIndex * (itemWidth + this.gapX)));
            const yPos = columns[columnIndex];

            // Store positions for later updates
            positions.push({ item, xPos, yPos });

            // Estimate height - avoids layout thrashing
            const contentHeight = item.offsetHeight;
            columns[columnIndex] += contentHeight + this.gapY;
        });

        // Batch write position
        positions.forEach(({ item, xPos, yPos }) => {
            item.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        });

        // Set container height
        const gridHeight = Math.max(...columns);
        grid.style.height = `${gridHeight}px`;

        // If we guessed wrongly that a scrollbar would appear after resize, resize again without that assumption
        if (!rerun && containerWidth < grid.clientWidth) this.resize(true);
    }
}

function resizeMasonryGrid(grid) {
    if (!grid.classList.contains('masonryGrid')) return;

    let masonry = grid._masonry;
    if (masonry) {
        masonry.debouncedResize();
    } else {
        grid._masonry = new MasonryGrid(grid);
    }
}

function resizeAllMasonryGrids() {
    document.querySelectorAll('.masonryGrid').forEach(grid => resizeMasonryGrid(grid));
}

function resizeClosestMasonryGrid(element) {
    getClosestProperty(element, "_masonry")?.resize();
}

onBodyCreated(() => {
    // Set up an observer to detect when new MasonryGrid elements are added to the DOM
    new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    resizeMasonryGrid(node);
                    node.querySelectorAll('.masonryGrid').forEach(resizeMasonryGrid);
                }
            });
        });
    }).observe(document.body, {
        childList: true,
        subtree: true
    });
});

window.addEventListener('load', resizeAllMasonryGrids);
window.addEventListener('resize', resizeAllMasonryGrids);