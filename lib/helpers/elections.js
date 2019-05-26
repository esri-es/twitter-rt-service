const WORDS = require('../../config/elections.json').words;
const WORD_SEPARATOR = ",";
const PARTIES = Object.keys(WORDS);
const regexgen = require('regexgen');

const rePartiesMap = PARTIES.reduce((old,cur,i,arr) => {
  old[cur] = regexgen(WORDS[cur], "ig");
  return old;
}, {})

let PARTIES_EXTENDED = [
    ...PARTIES.map(k => [...WORDS[k]])
  ]
  .reduce((old,cur,i,arr) => {
    old.push(...cur);
    return old; },
  []);

const reParties = regexgen(PARTIES_EXTENDED, "ig");
var reTrackingWords;

function mapping_parties (t) {
  let matchWords = t.text.match(reTrackingWords);
  var markWords = new Set(matchWords);
  let obj = PARTIES.reduce((old,cur,i,arr) => {
    let test = rePartiesMap[cur].test(t.text)
    old[cur] = test;
    return old;
  }, {});
  obj.markWords = [...markWords];
  return obj;
}

function _setRegexWords (wordsStr){
  let trackingWords = wordsStr.split(WORD_SEPARATOR).filter(el => !reParties.test(el));
  reTrackingWords = regexgen(trackingWords, "ig");
}

module.exports =  function(words2track) {
  _setRegexWords(words2track);
  return mapping_parties;
}
