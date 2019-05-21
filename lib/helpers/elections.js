const PARTIDOS = require('../../config/elections.json').words;
const reParties = new RegExp(`(${Object.keys(PARTIDOS).join("|").toLowerCase()})`, "ig");

function mapping_parties (t) {
  let obj = Object.keys(PARTIDOS).reduce((old,cur,i,arr) => {
    obj[cur] = reParties.test(t.text);
    return old;
  }, {});
}

module.exports = {
  mapping_parties : mapping_parties
}
