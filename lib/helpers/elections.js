const WORDS = require('../../config/elections.json').words;
const WORD_SEPARATOR = ",";
const PARTIES = Object.keys(WORDS);

let rePartiesMap = PARTIES.reduce((old,cur,i,arr) => {
    old[cur] = new RegExp(`\\b(${WORDS[cur].map(el => el.toLowerCase()).join("|")})\\b`, "ig")
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

const reParties = new RegExp(`\\b(${Object.keys(PARTIES_EXTENDED).join("|")})\\b`, "ig");
var reTrackingWords;

function mapping_parties (t) {
  let matchWords = t.text.match(reTrackingWords);
  var markWords = new Set(matchWords);
  let obj = PARTIES.reduce((old,cur,i,arr) => {
    let test = rePartiesMap[cur].test(t.text)
    old[cur] = test;
    // if (test) {
    //   markWords.add(cur.toLowerCase());
    // }
    return old;
  }, {});
  obj.markWords = [...markWords];
  return obj;
}

function _setRegexWords (wordsStr){
  let trackingWords = wordsStr.split(WORD_SEPARATOR).filter(el => !reParties.test(el));
  reTrackingWords = new RegExp(`\\b(${trackingWords.map(el => el.toLowerCase()).join("|")})\\b`, "ig");
}

module.exports =  function(words2track) {
    _setRegexWords(words2track);
    return mapping_parties;
}
