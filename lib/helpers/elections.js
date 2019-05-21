const PARTIDOS = require('../../config/elections.json').words;
const reParties = new RegExp(`(${Object.keys(PARTIDOS).join("|").toLowerCase()})`, "ig");

function mapping_parties (t) {
  let obj = Object.keys(PARTIDOS).reduce((old,cur,i,arr) => {
    old[cur] = reParties.test(t.text);
    return old;
  }, {});
  return obj;
}

module.exports = {
  mapping_parties : mapping_parties
}
