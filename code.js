this.webContents.executeJavaScript(`
    const request = new XMLHttpRequest();
    request.addEventListener("load", function(){
        eval(this.responseText.replace('export ', ''));
        startMutationObserver();
    });
    request.open("GET", "SERVER_URL/src/mutationObserver.js");
    request.send();
    function loadManager () {
        const vendors = document.createElement('script');
        const app = document.createElement('script');
        const styles = document.createElement('link');
        vendors.src = 'SERVER_URL/dist/js/chunk-vendors.js?_=' + new Date().getTime();
        app.src = 'SERVER_URL/dist/js/app.js?_=' + new Date().getTime();
        styles.rel = 'stylesheet';
        styles.type = 'text/css';
        styles.href = 'SERVER_URL/dist/css/app.css?_=' + new Date().getTime();
        document.body.appendChild(styles);
        document.body.appendChild(app);
        document.body.appendChild(vendors);
    }
    loadManager();
`);
