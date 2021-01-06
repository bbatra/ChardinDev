/**
 * Created by bharatbatra on 11/10/17.
 */
function renderHTML(html,) {
  return `<!doctype html>
<html lang="en-US">
    <head>
    <title> Chardin internal systems request </title>
    <script>
        window.close();
    </script>
    </head>
    <body>
        ${html}
    </body>
 </html>`;
}

export default renderHTML;