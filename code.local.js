this.webContents.executeJavaScript(`
    const request = new XMLHttpRequest();
    request.addEventListener("load", function(){
        eval(this.responseText.replace('export ', ''));
        startMutationObserver();
    });
    request.open("GET", "http://localhost:5001/src/mutationObserver.js");
    request.send();
    function loadManager () {
        const vendors = document.createElement('script');
        const app = document.createElement('script');
        const styles = document.createElement('link');
        vendors.src = 'http://localhost:5001/dist/js/chunk-vendors.js?_=' + new Date().getTime();
        app.src = 'http://localhost:5001/dist/js/app.js?_=' + new Date().getTime();
        styles.rel = 'stylesheet';
        styles.type = 'text/css';
        styles.href = 'http://localhost:5001/dist/css/app.css?_=' + new Date().getTime();
        document.body.appendChild(styles);
        document.body.appendChild(app);
        document.body.appendChild(vendors);
    }
    loadManager();
`);
