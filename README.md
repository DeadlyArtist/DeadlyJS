# DeadlyJS
A collection of useful and modular js files.

## How to Use
Locate pieces of code you need and copy them into your project, or modify them as needed.

Don't use URL links!

## Scripts
Scripts can either be put into the tail of the body (as is often the default approach) or the head (uncommon, but often useful). The scripts below are marked by either HEAD or TAIL to help you put them at the right place. The HEAD scripts should be put before any styles so they can execute their code faster. (As the website waits until all files from the head are fully loaded before starting to load the body, there's no reason to do it the other way around.)

This library puts most scripts in HEAD to support dynamic website generation.

### coreHelpers.js
HEAD (Before all other scripts, except colorSchemes.js and serviceWorkerHelpers.js)  
The backbone required for many other scripts.

Contains:
- Auto formatting of URL to remove ugly parts (like an empty hash or an index.html suffix).
- Helper events (used by many other scripts)
    - "body-created"
    - "before-scripts"
    - "added"
    - "removed"
- Input helpers
    - Keep track of pressed keys
    - Fake mouse move polling (for hover effects, as by default the mouse only sends updates when its position changes, useful when a hovered element is replaced with another without the mouse moving)
- Html helpers
- Various small helpers
    - Random string generation
    - Child event detection
    - Sleeping
    - Cloning and comparison
    - Stop website saving missclicks
    - Log storage sizes
    - Set cookies
    - Run functions in parallel
    - Debounce functions
    - Sanitize html (requires external DOMPurify library)
    - Byte helpers
    - and more...
- Time helpers
- Fetch helpers
    - Fetch directly as text or json
    - Optionally cache results
- String helpers
    - Various substring (finder) functions
    - Escape/Unescape html
    - Escape/Unescape regex
    - Various string transformations (like camel case)
- URL helpers
    - quickly get various parts of a (or the current) URL
    - go to URLs without request
        - replace
        - change hash
        - any other URL
    - "load-silently" event (called when page changes without a reload, such as a history push when using the provided functions)
    - "hashchange" event
    - create object url
- Hash helpers
    - Fake url paths and queries using hashes
- Element helpers
    - Html from string
    - Get closest element with a property
    - Wrap/replace elements/nodes (including text) with elements/html
    - Splice children
    - Text node helpers (including functions to find text nodes by text indices)

### coreHelpers_beforeScripts.js
TAIL (Before all other scripts)  
Used to detect the start of TAIL loading, or otherwise the end of the initial html loading.

### colorSchemes.js
HEAD (Before all other scripts, except serviceWorkerHelpers.js)  
Recommended: colorSchemes.css  
Provides extensive color schemes (dark vs light) support. Can adapt to the OS color scheme (disabled by default).
- Creates and preloads css to avoid initial load color flickering
- Allows adding the light-only- and dark-only- prefix to any class and automatically adds/removes the class as appropriate
- "color-scheme-changed" event

---

### chatApi.js
HEAD  
Simple client side chatbot API.

### codeHelpers.js
HEAD  
Requires: code.css  
Allows creating a simple code element with a copy button. Also allows code highlighting (requires external hljs library).

### contentEditableHelpers.js
HEAD  
Add some basic functionality to content editables.
- plainTextOnly (includes firefox fallback)
- tab key adds 4 spaces

### customMath.js
HEAD  
Provides a super simple custom math parser. Allows defining custom operators, variables, functions, and brackets.

### dialog.js
HEAD  
Allows quickly creating fully functional dialogs.

### dropArea.js
HEAD  
Provides simple way to create a fully functional drop area.
- Includes drop area with borders that change in color for (non)matching files
- Includes a button to select files
- Allows pasting files
- Unified way to retrieve the files
- Configurable via atttributes
    - "multiple"
    - "accept" (used by browser, allows defining valid extensions)
    - "allowed-mime-types"
    - "max-file-size"
- Allows custom file parsing

### encoder.js
HEAD  
Allows creating custom encoders for quickly encoding, decoding, escaping, and unescaping using an encoding.

### fileHelpers.js
HEAD  
Greatly simplifies downloading (and managing) of files (and dataURLs). Also includes zipping (requires JSZIP external library).

### fromHTMLHelpers.js
HEAD  
Provides very simple fromHTML helpers. Includes horizontal and vertical breaks.

### icons.js
HEAD  
Requires: icons.css  
Allows quick icon html creation via code (using fromHTML). Includes sample icons from google materials and hero icons.

### inputHelpers.js
TAIL  
- Constrain input (especially number input)
- Replace text with undo

### katexAutoRender.js
TAIL  
Requires: External katex renderer library + math.css  
Recommended: katexHelpers.js  
Modified version of the katex auto render library (fixes $...$ inline math and marked.js compatibility).

### katexHelpers.js
TAIL  
Requires: External katex renderer library + math.css  
Recommended: katexAutoRender.js  
Adds some helpers for using katex.

### linkedList.js
HEAD  
Adds a linked list.

### linkedList2D.js
HEAD  
Adds a 2 dimensional linked list.

### linkedMap.js
HEAD  
Adds a linked map.

### linkedMap.js
HEAD  
Adds a 2 dimensional linked map.

### linkedSet.js
HEAD  
Adds a linked set.

### mapHelpers.js
HEAD  
Helps with index insertion or element relative insertion for vanilla maps.

### masonryGrid.js
HEAD  
Requires: breaks.css + masonryGrid.css  
Efficient tiny implementation for masonry grids. Auto resizes in many cases, but sometimes a manual resize is needed.

### markdownHelpers.js
HEAD  
Requires: External marked.js library  
Helps with parsing and rendering markdown, especially in combination with katex, hljs, and DOMPurify. Also improves parsing of faulty LLM generated codeblock markdown (a bit buggy though).

### monacoEditor.js
TAIL  
Requires: External monaco library + monacoEditor.css
Improves the monaco editor experience.
- Works with colorSchemes.js
- Editor builder
- Replace text with undo

### objectHelpers.js
HEAD  
Provides some helpers for object manipulation.
- Transform or filter keys
- Clear properties
- To/From map

### registry.js
HEAD  
Adds a fully featured registry.
- Events for adding/removing of entries
- Stream entries (optionally in batches)
- All functions dynamically retrieve the right id, making them work whether you have the object, its entry, or its id

### resource.js
HEAD  
Adds a resource class to help with managing dynamically loading persistent resources via code (rather than via html).

### scrollingHelpers.js
HEAD  
Helps with scrolling dynamically. Requires having an element with "scrollingElement" as id.
- Functions to scroll top/bottom
- Optionally auto scroll to bottom (a bit buggy)
- Optionally adds back to top/bottom buttons (requires a container element with "scrollButtons" as id, as well as scrollButtons.css)
- Get scroll bar width
- Check for scroll bar presence

### serviceWorker_SPA_.js
NONE (Dynamically loaded)
Note: Remove the _SPA from the name to use it and put it into the top level directory (not any js folder)
A sample implementation for a single page application (SPA), which expects the server to respond with the same index.html, no matter which path (that starts with "/app/") is requested. Uses a Stale-While-Revalidate caching strategy (Serve cached content immediately, fetch & update cache in background).

### serviceWorkerHelpers.js
HEAD (Before all other scripts)  
Requires: A top level serviceWorker.js script
Helps with simple service workers. Prompts user to refresh the page after find a new service worker or receiving a RESOURCE_UPDATED message.

### sidebar.js
HEAD  
Requires: sidebar.css  
Fully manages a sidebar element. Requires at least one element with the "sidebar" class.
- Events
- Optional perma open mode at a minimum width
- Dynamic css classes (like sidebarControlsEnabledOnly or sidebarOpenOnly)

### tooltip.js
TAIL  
Requires: tooltip.css  
Provides customizable tooltip implementation. Displays a tooltip on hover if a valid attribute is defined.
- "tooltip" attribute to display value as html
- "tooltip-url" attribute to fetch html from a url and display it (includes loading... placeholder)
- add new attributes with custom handling
- Tooltips stack (can open a tooltip on a tooltip)
- Tooltips keep open if close to the element, close to the tooltip, or while 'q' is pressed (all configurable)
- Delay before tooltip is shown

## Styles
### helpers.css
Provides a large mix of helper classes, as well as some helper settings (at the top).

### colorSchemes.css
Recommended: colorSchemes.js  
Allows streamlined and easy defining of colors via color schemes (dark vs light).
- Provides structure to clean variable definitions and dependencies via a sample implementation from a real project
- Adds dark/light mode only classes (.darkModeOnly, .lightModeOnly)

---

### borders.css
Provides border styling, including vertical and horizontal rulers.

### breaks.css
Provides horizontal breaks (hb-x), vertical breaks (vb-x), and gaps (gap-x).

### buttons.css
Provides button styling, as well as fake buttons.

### code.css
Provides code styling.

### contentEditable.css
Recommended: contentEditableHelpers.js  
Provides content editable styling.

### dialog.css
Requires: dialog.js  
Provides dialog styling.

### dropArea.css
Requires: dropArea.js  
Provides drop area styling.

### elements.css
Provides various simple element classes for super quick styling of simple elements.

### headers.css
Provides header styling.

### headers.css
Provides header styling.

### highlight.css
Allows highlighting of text.

### icons.css
Recommended: icons.js  
Provides icons styling.

### images.css
Provides image styling.

### input.css
Provides input (and select) styling.

### links.css
Provides link styling.

### lists.css
Provides list styling. Includes a decorated container (a small vertical list to its right and left).

### markdown.css
Requires: External marked.js library
Provides markdown styling.

### math.css
Requires: External katex library
Provides math styling.

### masonryGrid.css
Requires: masonryGrid.js  
Provides masonry grid styling.

### monacoEditor.css
Requires: External monaco library  
Provides monaco editor styling.

### progress.css
Provides progress bar styling.

### quotes.css
Provides blockquote styling.

### scrollButtons.css
Requires: scrollingHelpers.js  
Provides scroll buttons styling.

### settings.css
Provides example variable settings from a real project (as an example base structure).

### sidebar.css
Requires: sidebar.js  
Provides sidebar styling.

### site.css
Provides example site specific css from a real project (as an example base structure).

### stackoverflow-dark.css
Requires: External hljs library  
An hljs theme. Modified to work better with multiple color schemes.

### table.css
Provides table styling.

### tooltip.css
Requires: tooltip.js  
Provides tooltip styling.