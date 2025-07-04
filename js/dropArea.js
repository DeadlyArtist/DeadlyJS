class DropAreaHelpers {
    static setupEventListeners() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        [...document.getElementsByClassName('dropArea')].forEach(d => this.initializeDropArea(d));
        [...document.getElementsByClassName('dropButton')].forEach(d => this.initializeDropButton(d));

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Check if it's an element node
                        if (node.classList.contains('dropArea')) {
                            this.initializeDropArea(node);
                        } else if (node.classList.contains('dropButton')) {
                            this.initializeDropButton(node);
                        }
                    }

                    // Check if any child nodes of the added node also have the dropArea class
                    const dropAreas = node.querySelectorAll ? node.querySelectorAll('.dropArea') : [];
                    dropAreas.forEach(d => this.initializeDropArea(d));
                    const dropButtons = node.querySelectorAll ? node.querySelectorAll('.dropButton') : [];
                    dropButtons.forEach(d => this.initializeDropButton(d));
                });
            });
        });

        const container = document.body;
        const observerOptions = {
            childList: true,
            subtree: true,
        };
        observer.observe(container, observerOptions);
    }

    static highlightDrag(dropArea) {
        dropArea.classList.add('dragover');
    }

    static unhighlightDrag(dropArea) {
        dropArea.classList.remove('dragover');
    }

    static initializeDropArea(dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, e => this.highlightDrag(dropArea), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, e => this.unhighlightDrag(dropArea), false);
        });

        ['dragenter'].forEach(eventName => {
            dropArea.addEventListener(eventName, e => this.validateDragenterType(e), false);
        });
        ['dragleave'].forEach(eventName => {
            dropArea.addEventListener(eventName, e => this.onDragleave(e), false);
        });
        ['drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, e => this.onDragdrop(e), false);
        });
    }

    static initializeDropButton(dropButton) {
        const dropArea = dropButton.closest('.dropArea');
        if (dropArea) dropButton.addEventListener('click', e => DropAreaHelpers.clickDropInput(dropArea));
    }

    static clickDropInput(dropArea) {
        const inputs = dropArea.getElementsByClassName('dropInput');
        if (inputs.length === 0) return;
        inputs[0].click();
    }

    static validateDragenterType(event) {
        if (isChildEvent(event)) return;

        let element = event.currentTarget;
        const allowedMimeTypes = DropAreaHelpers.getAllowedMimeTypes(element);
        const allowedTypes = new Set(allowedMimeTypes);
        const wildcardTypes = [...allowedTypes].filter(type => type.includes('*'));
        const isTypeAllowed = (fileType) => {
            if (allowedTypes.size === 0) return true;
            else if (allowedTypes.has(fileType)) return true;

            // Wildcard match
            for (const wildcard of wildcardTypes) {
                const [prefix] = wildcard.split('*');
                if (fileType.startsWith(prefix)) {
                    return true;
                }
            }

            return false;
        };

        let valid = false;
        if (event.dataTransfer.items) {
            const multiple = DropAreaHelpers.getMultiple(element);
            if (multiple || event.dataTransfer.items.length === 1) {
                for (let item of event.dataTransfer.items) {
                    if (item.kind === "file" && isTypeAllowed(item.type)) {
                        valid = true;
                        break;
                    }
                }
            }
        }

        if (valid) element.classList.add('dragover');
        else element.classList.add('invalidFiles');
    }

    static onDragleave(event) {
        if (isChildEvent(event)) return;

        this.onDragdrop(event);
    }

    static onDragdrop(event) {
        let element = event.currentTarget;
        element.classList.remove('dragover');
        element.classList.remove('invalidFiles');
    }

    static validateFiles(files, allowedMimeTypes = [], maxSize = null) {
        const allowedTypes = new Set(allowedMimeTypes);
        const wildcardTypes = [...allowedTypes].filter(type => type.includes('*'));
        const isTypeAllowed = (fileType) => {
            if (allowedTypes.size === 0) return true;
            else if (allowedTypes.has(fileType)) return true;

            // Wildcard match
            for (const wildcard of wildcardTypes) {
                const [prefix] = wildcard.split('*');
                if (fileType.startsWith(prefix)) {
                    return true;
                }
            }

            return false;
        };

        let newFiles = [];
        for (let file of files) {
            if (file && isTypeAllowed(file.type) && (maxSize == null || file.size <= maxSize)) {
                newFiles.push(file);
            } else {
                console.warn("Invalid file:", file.name);
            }
        }

        return newFiles;
    }

    static getMultiple(element) {
        let multiple = element.
            closest('.dropArea')?.
            querySelector('.dropInput')?.
            getAttribute('multiple') ?? false;

        if (isString(multiple) && multiple.trim() == '') multiple = true;
        return multiple;
    }


    static getAllowedMimeTypes(element) {
        return element.
            closest('.dropArea')?.
            getAttribute('allowed-mime-types')?.
            split(',').
            map(ext => ext.trim()).
            filter(a => a !== "") ?? [];
    }

    static getAccept(element) {
        return element.
            closest('.dropArea')?.
            querySelector('.dropInput')?.
            getAttribute('accept')?.
            split(',').
            map(ext => ext.trim()).
            filter(a => a !== "") ?? [];
    }

    static getMaxFileSize(element) {
        let maxSize = parseInt(element.closest('.dropArea')?.getAttribute('max-file-size'));
        if (isNaN(maxSize)) maxSize = null;
        return maxSize;
    }

    static getFilesFromSelect(event) {
        const input = event.srcElement;
        if (!input.files || input.files.length === 0) return;

        const files = [];
        for (let file of input.files) {
            if (file) files.push(file);
        }
        input.value = '';

        return DropAreaHelpers.validateFiles(files, DropAreaHelpers.getAllowedMimeTypes(input), DropAreaHelpers.getMaxFileSize(input));
    }

    static getFilesFromDrop(event) {
        event.preventDefault();

        if (!event.dataTransfer.items) return;

        const files = [];
        for (let item of event.dataTransfer.items) {
            const file = item.getAsFile();
            if (file) files.push(file);
        }

        const target = event.target;
        return DropAreaHelpers.validateFiles(files, DropAreaHelpers.getAllowedMimeTypes(target), DropAreaHelpers.getMaxFileSize(target));
    }

    static getFilesFromPaste(event) {
        event.preventDefault();
        if (!event.clipboardData?.items) return;

        const files = [];

        for (let item of event.clipboardData.items) {
            const file = item.getAsFile();
            if (file) files.push(file);
        }

        const target = event.target;
        return DropAreaHelpers.validateFiles(files, DropAreaHelpers.getAllowedMimeTypes(target), DropAreaHelpers.getMaxFileSize(target));
    }

    static create(settings = null) {
        const element = fromHTML(`<div class="w-100 largeElement bordered">`);
        const data = new StructuredDropAreaHtml(element, settings);

        const dropArea = fromHTML(`<div class="dropArea" tabIndex="0">`);
        dropArea.setAttribute('allowed-mime-types', data.allowedMimeTypes);
        if (data.maxSize) dropArea.setAttribute('max-file-size', data.maxSize);
        dropArea.addEventListener('drop', e => data.processFileInput(e));
        dropArea.addEventListener('paste', e => data.processFileInput(e));

        const dropDescriptionElement = fromHTML(`<div>`);
        dropDescriptionElement.textContent = data.dropDescription;
        dropArea.appendChild(dropDescriptionElement);
        dropArea.appendChild(hb(4));
        const selectFilesElement = fromHTML(`<input type="file" class="dropInput">`);
        if (data.multiple) selectFilesElement.setAttribute('multiple', '');
        selectFilesElement.setAttribute('accept', data.allowedExtensions);
        selectFilesElement.addEventListener('change', e => data.processFileInput(e));
        dropArea.appendChild(selectFilesElement);
        const dropButtonElement = fromHTML(`<button class="w-100 dropButton largeElement hoverable bordered">`);
        dropButtonElement.textContent = data.selectDescription;
        dropArea.appendChild(dropButtonElement);
        element.appendChild(dropArea);
        element.appendChild(hb(4));
        const filesDisplayElement = fromHTML(`<div class="divList hide">`);
        const noFileSelectedElement = fromHTML(`<i>`);
        noFileSelectedElement.textContent = data.noFileSelectedMessage;
        element.appendChild(noFileSelectedElement);
        element.appendChild(filesDisplayElement);

        data.noFileSelectedElement = noFileSelectedElement;
        data.filesDisplayElement = filesDisplayElement;
        data.dropArea = dropArea;
        data.dropDescriptionElement = dropDescriptionElement;
        data.selectFilesElement = selectFilesElement;
        data.dropButtonElement = dropButtonElement;
        return data;
    }

    static createJson(settings = null) {
        return this.create(StructuredDropAreaHtml.getJsonSettings(settings));
    }

    static createCsv() {
        return this.create(StructuredDropAreaHtml.getCsvSettings(settings));
    }
}

window.addEventListener('load', e => DropAreaHelpers.setupEventListeners())

class StructuredDropAreaHtml {
    noFileSelectedElement;
    filesDisplayElement;
    dropArea;
    dropDescriptionElement;
    selectFilesElement;
    dropButtonElement;

    constructor(element, settings = null) {
        this.element = element;

        settings ??= {};
        this.files = [];
        this.parsedContents = [];
        this.allowedMimeTypes = settings.allowedMimeTypes ?? [];
        this.allowedExtensions = settings.allowedExtensions ?? [];
        this.dropDescription = settings.dropDescription ?? ("Drag and drop or click and paste valid files (" + (this.allowedExtensions.length === 0 ? "any type" : this.allowedExtensions.join(', ')) + ").");
        this.selectDescription = settings.selectDescription ?? 'Or select files';
        this.noFileSelectedMessage = settings.noFileSelectedMessage ?? 'No file selected.';
        this.multiple = settings.multiple ?? false;
        this.maxSize = settings.maxSize;
        this.filterFile = settings.filterFile;
        this.parseFile = settings.parseFile;
        this.onChange = settings.onChange;
    }

    static getJsonSettings(settings = null) {
        return { ...(settings ?? {}), allowedMimeTypes: [commonMimeTypes.json], allowedExtensions: [".json"] };
    }

    static getCsvSettings(settings = null) {
        return { ...(settings ?? {}), allowedMimeTypes: [commonMimeTypes.csv], allowedExtensions: [".csv"] };
    }

    async processFileInput(e) {
        let files = getFilesFromEvent(e);
        await this.addFiles(files);
    }

    async addFiles(files) {
        if (files.length == 0) return;
        if (this.filterFile) files = files.filter(file => this.filterFile(file, this));
        if (this.parseFile) {
            let results = await parallel(files, async file => {
                let parsed;
                try {
                    parsed = await this.parseFile(file, this);
                } catch (e) {
                    console.warn(e);
                }
                return { file, parsed };
            });
            files = [];
            results.forEach(result => {
                if (!result.parsed) return;
                files.push(result.file);
                this.parsedContents.push(result.parsed);
            });
        }
        if (files.length == 0) return;

        this.files = this.files.concat(files);

        this.filesDisplayElement.innerHTML = '';
        this.noFileSelectedElement.classList.add('hide');
        this.filesDisplayElement.classList.remove('hide');


        for (let [index, file] of Object.entries(this.files)) {
            const fileDisplayElement = fromHTML(`<div class="listHorizontal">`);
            const fileNameElement = fromHTML(`<div>`);
            fileNameElement.textContent = file.name;
            fileDisplayElement.appendChild(fileNameElement);

            let deleteButton = fromHTML(`<button class="element hoverable" tooltip="Unselect file">`);
            fileDisplayElement.appendChild(deleteButton);
            deleteButton.addEventListener('click', () => this.removeFile(index));
            let deleteIcon = icons.close();
            deleteButton.appendChild(deleteIcon);
            deleteIcon.classList.add("minimalIcon");

            this.filesDisplayElement.appendChild(fileDisplayElement);
        }

        this.onChange?.();
    }

    removeFile(index) {
        this.files.splice(index, 1);
        spliceChildren(this.filesDisplayElement, index, 1);

        if (this.files.length == 0) {
            this.noFileSelectedElement.classList.remove('hide');
            this.filesDisplayElement.classList.add('hide');
        }

        this.onChange?.();
    }
}

function getFilesFromEvent(e) {
    if (e.srcElement?.files && e.srcElement.files.length !== 0) return DropAreaHelpers.getFilesFromSelect(e);
    else if (e.dataTransfer?.items) return DropAreaHelpers.getFilesFromDrop(e);
    else if (e.clipboardData?.items) return DropAreaHelpers.getFilesFromPaste(e);
}
