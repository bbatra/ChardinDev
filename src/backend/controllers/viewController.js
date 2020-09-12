/**
 * Created by bharatbatra on 11/10/17.
 */
import renderHTML from '../views/indexHTML.js';
import renderReactApp from '../views/reactApp';

function render(req, res, next) {
  res.send("Alive");
}

export default {
  render
}

