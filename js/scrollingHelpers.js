class ScrollingHelpers {
    static scrolledBottomLastFrame = false;
    static userHasScrolled = false;
    static autoScrollBotom = false;
    static pageLoaded = true;
    static scrollTickBlockers = 1; // Block by default, as it is not really needed in this app
    static tickDuration = 10;

    static setupEventListeners() {
        // Use MutationObserver to monitor the DOM for added elements
        const observer = new MutationObserver((mutations) => {
            doScrollTick();
        });

        // Observe the document body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    static injectScrollTopButton() {
        const scrollButtons = document.getElementById('scrollButtons');
        const topButton = fromHTML(`<button class="largeElement complexButton scrollButtonTop" title="Scroll to the top of the page">`);
        topButton.addEventListener('click', e => scrollToTop());
        topButton.appendChild(icons.expandLess());
        if (isScrolledTop()) topButton.classList.add('invisible');
        scrollButtons.appendChild(topButton);

        scrollingElement.addEventListener('scroll', () => {
            if (isScrolledTop()) topButton.classList.add('invisible');
            else topButton.classList.remove('invisible');
        });
    }

    static injectScrollBottomButton() {
        const scrollButtons = document.getElementById('scrollButtons');
        const bottomButton = fromHTML(`<button class="largeElement complexButton scrollButtonBottom" title="Scroll to the bottom of the page">`);
        bottomButton.addEventListener('click', e => scrollToBottom());
        bottomButton.appendChild(icons.expandMore());
        if (isScrolledBottom()) bottomButton.classList.add('invisible');
        scrollButtons.appendChild(bottomButton);

        scrollingElement.addEventListener('scroll', () => {
            if (isScrolledBottom()) bottomButton.classList.add('invisible');
            else bottomButton.classList.remove('invisible');
        });
    }

    static injectScrollButtons() {
        ScrollingHelpers.injectScrollTopButton();
        ScrollingHelpers.injectScrollBottomButton();
    }

    static blockScrollTicks() {
        this.scrollTickBlockers++;
    }

    static unblockScrollTicks() {
        this.scrollTickBlockers--;
    }

    static areScrollTicksBlocked() {
        return this.scrollTickBlockers != 0;
    }
}

let scrollingElement = null;
onBeforeScriptsAfterHtml(() => scrollingElement = document.getElementById('scrollingElement'));

function getScrollbarWidth() {
    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
}

function isYScrollbarPresent() {
    return scrollingElement.offsetWidth > scrollingElement.clientWidth;
}

function isXScrollbarPresent() {
    return scrollingElement.offsetHeight > scrollingElement.clientHeight;
}


function isScrolledBottom() {
    return Math.abs(scrollingElement.scrollHeight - scrollingElement.scrollTop - scrollingElement.clientHeight) <= 3.0;
}

function scrollToBottom() {
    scrollingElement.scroll({ top: scrollingElement.scrollHeight });
}

function isScrolledTop() {
    return scrollingElement.scrollTop === 0;
}

function scrollToTop() {
    scrollingElement.scroll({ top: 0 });
}

scrollingElement.addEventListener('scroll', () => {
    ScrollingHelpers.userHasScrolled = true;
});

window.addEventListener('pageloaded', e => ScrollingHelpers.pageLoaded = true);

async function doScrollTick() {
    if (ScrollingHelpers.areScrollTicksBlocked()) {
        await sleep(ScrollingHelpers.tickDuration);
        return;
    }

    if (isScrolledBottom()) {
        ScrollingHelpers.scrolledBottomLastFrame = true;
    } else if (ScrollingHelpers.userHasScrolled || ScrollingHelpers.pageLoaded) {
        ScrollingHelpers.scrolledBottomLastFrame = false;
    } else if (ScrollingHelpers.autoScrollBotom && ScrollingHelpers.scrolledBottomLastFrame) {
        scrollToBottom();
    }

    ScrollingHelpers.userHasScrolled = false;
    ScrollingHelpers.pageLoaded = false;

    await sleep(ScrollingHelpers.tickDuration);
}

// Check scroll periodically
(async function () {
    while (true) {
        await doScrollTick();
    }
})();

// Uncomment to show scroll to top/bottom buttons
//ScrollingHelpers.injectScrollButtons();
window.addEventListener('load', e => ScrollingHelpers.setupEventListeners());