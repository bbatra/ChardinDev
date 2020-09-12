/**
 * Created by bharatbatra on 11/10/17.
 */
  // Import the "app" object that has been "decorated" by the
  // steps in the "pipeline" folder
const app = require('./pipeline/finalStep.js');
const config = require('config');
const port = config.PORT || 8080;
const path = require('path');
const fs = require('fs');

var server;

if(process.env.NODE_ENV === 'loc') {
  const certOptions = {
    key: fs.readFileSync(path.resolve('../server.key')),
    cert: fs.readFileSync(path.resolve('../server.crt'))
  }

  server = require('https').createServer(certOptions, app);
}
else {
  server = require('http').createServer(app);
}
app.listen(port, () => {
  console.log('Server listening on port', port);
});