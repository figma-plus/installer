this.webContents.executeJavaScript(`
    const request = new XMLHttpRequest();
    request.addEventListener("load", function(){
        eval(this.responseText.replace('export ', ''));
        startMutationObserver();
    });
    request.open("GET", "https://jachui.github.io/figma-plugin-manager/src/mutationObserver.js");
    request.send();
    function loadManager () {
        const vendors = document.createElement('script');
        const app = document.createElement('script');
        const styles = document.createElement('link');
        vendors.src = 'https://jachui.github.io/figma-plugin-manager/dist/js/chunk-vendors.js?_=' + new Date().getTime();
        app.src = 'https://jachui.github.io/figma-plugin-manager/dist/js/app.js?_=' + new Date().getTime();
        styles.rel = 'stylesheet';
        styles.type = 'text/css';
        styles.href = 'https://jachui.github.io/figma-plugin-manager/dist/css/app.css?_=' + new Date().getTime();
        document.body.appendChild(styles);
        document.body.appendChild(app);
        document.body.appendChild(vendors);
    }
    loadManager();
`);
