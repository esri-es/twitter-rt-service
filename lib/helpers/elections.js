const PARTIDOS = require('../../config/elections.json').words;

function mapping_parties (t) {
  let obj = Object.keys(PARTIDOS).reduce((old,cur,i,arr) => {
    reParties = new RegExp(`(${PARTIDOS[cur].join("|").toLowerCase()})`, "ig");
    old[cur] = reParties.test(t.text);
    return old;
  }, {});
  return obj;
}

module.exports = {
  mapping_parties : mapping_parties
}
