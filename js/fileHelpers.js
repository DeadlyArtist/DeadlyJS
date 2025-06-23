class FileHelpers {
    static async getText(file) {
        return await file.text();
    }
    static async getJson(file) {
        return JSON.parse(await this.getText(file));
    }
    static async getDataURL(file) {
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        })
    }

    static parseDataUrl(dataURL) {
        var BASE64_MARKER = ";base64,";
        if (dataURL.indexOf(BASE64_MARKER) == -1) {
            var parts = dataURL.split(",");
            var mimeType = parts[0].split(":")[1];
            var raw = decodeURIComponent(parts[1]);

            return { content: raw, mimeType };
        }

        var parts = dataURL.split(BASE64_MARKER);
        var mimeType = parts[0].split(":")[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;

        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return { content: uInt8Array, mimeType };
    }
}

class FakeFile {
    constructor(name, blob) {
        this.name = name;
        this.blob = blob;
    }

    download() {
        downloadBlob(this.blob, this.name);
    }

    static create(name, content, mimeType) {
        mimeType = mimeType || commonMimeTypes.plainText;
        return new FakeFile(name, createBlob(content, mimeType));
    }

    static createFromDataUrl(name, dataURL) {
        let parsed = FileHelpers.parseDataUrl(dataURL);
        return this.create(name, parsed.content, parsed.mimeType);
    }

    static createPlainText(name, content, addFileType = true) {
        const mimeType = commonMimeTypes.plainText;
        if (!name.endsWith(".txt") && addFileType) name += ".txt";
        return this.create(name, content, mimeType);
    }

    static createJson(name, content, addFileType = true) {
        const mimeType = commonMimeTypes.json;
        if (!name.endsWith(".json") && addFileType) name += ".json";
        content = JSON.stringify(content, null, 2);
        return this.create(name, content, mimeType);
    }

    static createCsv(name, content, addFileType = true) {
        const mimeType = commonMimeTypes.csv;
        if (!name.endsWith(".csv") && addFileType) name += ".csv";
        return this.create(name, content, mimeType);
    }

    static async createZip(name, files, addFileType = true) {
        if (!name.endsWith(".zip") && addFileType) name += ".zip";
        const zip = new JSZip();
        files.forEach(({ name, blob }) => {
            zip.file(name, blob);
        });

        const blob = await zip.generateAsync({ type: "blob" });
        return new FakeFile(name, blob);
    }
}

function escapeFileName(name) {
    return name.replace(/[^a-zA-Z0-9\. \-]/g, "_");
}

function escapeFileNameMinimal(name) {
    name = name.toLowerCase(); // Lowercase
    name = name.replace(/[^a-z0-9_]/g, '_'); // Replace non-alphanumeric characters with an underscore
    name = name.replace(/_+/g, '_'); // Replace multiple underscores with a single one
    name = name.replace(/_$/, ''); // Remove trailing underscore

    return name;
}

let commonMimeTypes = {
    plainText: "text/plain",
    json: "application/json",
    csv: "text/csv",
    html: "text/html",
}

function createBlob(content, mimeType) {
    return new Blob([content], { type: mimeType });
}

// source: https://github.com/ebidel/filer.js/blob/b7ab6f4cbb82a17565ff68227e5bc984a9934038/src/filer.js#L137-159
function createBlobFromDataUrl(dataURL) {
    let parsed = FileHelpers.parseDataUrl(dataURL);
    return createBlob(parsed.content, parsed.mimeType);
}

function downloadBlob(blob, name) {
    const linkElement = document.createElement('a');
    linkElement.download = name;
    linkElement.href = window.URL.createObjectURL(blob);
    linkElement.onclick = function (e) {
        // revokeObjectURL needs a delay to work properly
        setTimeout(function () {
            window.URL.revokeObjectURL(linkElement.href);
        }, 1500);
    };

    linkElement.click();
    linkElement.remove();
}

function downloadFile(name, content, mimeType) {
    FakeFile.create(name, content, mimeType).download();
}

function downloadPlainText(name, content, addFileType = true) {
    FakeFile.createPlainText(name, content, addFileType).download();
}

function downloadJson(name, content, addFileType = true) {
    FakeFile.createJson(name, content, addFileType).download();
}

function downloadCsv(name, content, addFileType = true) {
    FakeFile.createCsv(name, content, addFileType).download();
}

async function downloadZip(name, files, addFileType = true) {
    (await FakeFile.createZip(name, files, addFileType)).download();
}

function downloadDataURL(dataURL, fileName) {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function getFileNameFromUrl(url) {
    const nameWithExt = url.split('/')
        .pop()
        .split('#')[0]
        .split('?')[0];
    const dotSplit = nameWithExt.split(".");
    if (dotSplit.length > 1)
        dotSplit.length = dotSplit.length - 1;
    const fileName = dotSplit.join(".");
    return fileName;
}
