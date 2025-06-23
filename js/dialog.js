class DialogHelpers {
    static create(elementProvider) {
        let container = fromHTML(`<div class="dialog hide">`);
        let structuredDialog = new StructuredDialogHtml(container);

        let contentElement = fromHTML(`<div class="dialogContent">`);
        container.appendChild(contentElement);
        let innerContentElement = fromHTML(`<div class="dialogInnerContent largeElement bordered">`);
        contentElement.appendChild(innerContentElement);

        let overlayElement = fromHTML(`<div class="dialogOverlay">`);
        container.appendChild(overlayElement);
        overlayElement.addEventListener('click', () => {
            if (structuredDialog.closeOnOverlayClick) structuredDialog.close()
        });

        structuredDialog.contentElement = contentElement;
        structuredDialog.innerContentElement = innerContentElement;
        structuredDialog.overlayElement = overlayElement;

        let element = elementProvider(structuredDialog);
        innerContentElement.appendChild(element);

        dialogsElement.appendChild(container);
        return structuredDialog;
    }
}

class StructuredDialogHtml {
    constructor(container) { 
        container._structuredDialog = this;
        this.container = container;
        this.closeOnOverlayClick = false;
    }

    addCloseButton(button) {
        button.classList.add('dialogCloseButton');
        button.addEventListener('click', () => this.close());
    }

    open() {
        this.container.classList.remove('hide');
    }

    close() {
        this.container.classList.add('hide');
    }
}

function closeAllDialogs() {
    let dialogs = document.getElementsByClassName("dialog");
    for (let dialog of dialogs) {
        const closeButton = dialog.querySelector('.dialogCloseButton');
        if (closeButton) closeButton.click();
        else dialog.classList.add("hide");
    }
}

function escapeDialogs(e) {
    if (e.key == "Escape") {
        closeAllDialogs();
    }
}

window.addEventListener("keyup", e => escapeDialogs(e));

let dialogsElement;
onBeforeScriptsAfterHtml(() => dialogsElement = document.getElementById('dialogs'));