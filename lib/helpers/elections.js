const WORDS = require('../../config/elections.json').words;
const WORD_SEPARATOR = ",";
const PARTIES = Object.keys(WORDS);

let rePartiesMap = PARTIES.reduce((old,cur,i,arr) => {
    old[cur] = new RegExp(`(${WORDS[cur].join("|")})`, "ig")
    return old;
}, {})

let PARTIES_EXTENDED = [
    ...PARTIES.map(k => [...WORDS[k]])
  ]
  .reduce((old,cur,i,arr) => {
    old.push(...cur);
    return old; },
  []);
console.log(PARTIES_EXTENDED);

const reParties = new RegExp(`(${Object.keys(PARTIES_EXTENDED).join("|")})`, "ig");
var reTrackingWords;

function mapping_parties (t) {
  let matchWords = t.text.match(reTrackingWords);
  var markWords = new Set(matchWords);
  let obj = PARTIES.reduce((old,cur,i,arr) => {
    let test = rePartiesMap[cur].test(t.text)
    old[cur] = test;
    if (test) {
      markWords.add(cur);
    }
    return old;
  }, {});
  obj.markWords = [...markWords];
  return obj;
}

function _setRegexWords (wordsStr){
  let trackingWords = wordsStr.split(WORD_SEPARATOR).filter(el => !reParties.test(el));
  reTrackingWords = new RegExp(`(${trackingWords.join("|")})`, "ig");
}

module.exports =  function(words2track) {
    _setRegexWords(words2track);
    return mapping_parties;
}
