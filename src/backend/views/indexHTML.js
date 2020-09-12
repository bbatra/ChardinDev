/**
 * Created by bharatbatra on 11/10/17.
 */
function renderHTML(layoutOptions, html,  clientConfig) {
  return `<!doctype html>
<html lang="en-US">
<head>
<title> Boilerplate - Title goes here! </title>
</head>
<body>
 <div id="app">${html}</div>
    <script>
        window.__CLIENT_CONFIG__ = ${JSON.stringify(clientConfig)}
    </script>
  <script defer src=${layoutOptions.bundleJS}></script>
 </body>
 </html>`;
}

export default renderHTML;