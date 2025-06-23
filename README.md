# DeadlyJS
A collection of useful and modular js files.

## How to Use
Locate pieces of code you need and copy them into your project, or modify them as needed.

Don't use URL links!

## Scripts
Scripts can either be put into the tail of the body (as is often the default approach) or the head (uncommon, but often useful). The scripts below are marked by either HEAD or TAIL to help you put them at the right place. The HEAD scripts should be put before any styles so they can execute their code faster. (As the website waits until all files from the head are fully loaded before starting to load the body, there's no reason to do it the other way around.)

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
    - and more...
- Element helpers
    - Html from string
    - Wrap/replace elements/nodes (including text) with elements/html
    - Splice children
    - Text node helpers (including functions to find text nodes by text indices)

### coreHelpers_beforeScripts.js
TAIL (Before all other scripts)  
Used to detect the start of TAIL loading, or otherwise the end of the initial html loading.

### serviceWorkerHelpers.js
HEAD (Before all other scripts)  
Helps with simple service workers. Prompts user to refresh the page after find a new service worker or receiving a RESOURCE_UPDATED message.

### colorSchemes.js
HEAD (Before all other scripts, except serviceWorkerHelpers.js)  
Recommended: colorSchemes.css  
Provides extensive color schemes (dark vs light) support. Can adapt to the OS color scheme (disabled by default).
- Creates and preloads css to avoid initial load color flickering
- Allows adding the light-only- and dark-only- prefix to any class and automatically adds/removes the class as appropriate
- "color-scheme-changed" event

### masonryGrid.js
HEAD  
Requires: masonryGrid.css  
Efficient tiny implementation for masonry grids. Auto resizes in many cases, but sometimes a manual resize is needed.

## Styles
### colorSchemes.css
Recommended: colorSchemes.js  
Allows streamlined and easy defining of colors via color schemes (dark vs light).
- Provides structure to clean variable definitions and dependencies via a sample implementation from a real project
- Adds dark/light mode only classes (.darkModeOnly, .lightModeOnly)