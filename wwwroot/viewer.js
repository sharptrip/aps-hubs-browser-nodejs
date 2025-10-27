let lastToken;
async function getAccessToken(callback) {
    while (true) {
        try {
            const resp = await fetch('/api/auth/token');
            if (!resp.ok)
                throw new Error(await resp.text());
            const { access_token, expires_in } = await resp.json();
            lastToken = `Bearer ${access_token}`;
            console.log(`Obtained access token: ${access_token}`);
            callback(access_token, 5); // make it valid for 5 seconds
            return;
        } catch (err) {
            console.error(err);        
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

let globalHeaders;
export function initViewer(container) {
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.FeatureFlags.set('DS_ENDPOINTS', true);
        Autodesk.Viewing.Initializer({ env: 'AutodeskProduction', getAccessToken }, function () {
            globalHeaders = Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS;
            const config = {
                extensions: ['Autodesk.DocumentBrowser']
            };
            const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
            viewer.start();
            viewer.setTheme('light-theme');
            resolve(viewer);
        });
    });
}

export function loadModel(viewer, urn) {
    function onDocumentLoadSuccess(doc) {
        if (Autodesk.Viewing.endpoint._endpoints) {
            Autodesk.Viewing.endpoint._endpoints.HTTP_REQUEST_HEADERS = Object.assign(globalHeaders, Autodesk.Viewing.endpoint._endpoints.HTTP_REQUEST_HEADERS);
        }
        if (Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS.Authorization === lastToken && Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS.Authorization === Autodesk.Viewing.endpoint._endpoints.HTTP_REQUEST_HEADERS.Authorization) {
            console.warn("TOKEN OK");
        } else {
            console.warn("TOKEN NOT OK");
        }
        viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
    }
    function onDocumentLoadFailure(code, message) {
        alert('Could not load model. See console for more details.');
        console.error(message);
    }
    Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
}
