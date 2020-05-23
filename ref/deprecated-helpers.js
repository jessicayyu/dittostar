
const findFormObj = function(query, dexResult) {
  /*  purpose: finds the first matching Pokemon obj out of an array of results for a specific species.
      param query: string
      param dexResult: array of obj from the pokdexjs search
      output: obj matching form name
  */  
  let queryFormatted = capitalize(query);
  if (queryFormatted === 'Alolan') {
    queryFormatted = 'Alola';
  }
  console.log('queryFormatted: ' + queryFormatted);
  for (let i = 0; i < dexResult.length; i++) {
    let dexResultForm = dexResult[i].formName;
    if (!dexResultForm) {
      dexResultForm = generations[dexResult[i].generation];
    }
    if (dexResultForm.startsWith(queryFormatted)) {
      return dexResult[i];
    }
  }
  return false;
};