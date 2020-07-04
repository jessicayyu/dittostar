
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

// set maintenance display status for Discord bot
function setStatus(bool) {
  if (bool) {
    client.user.setPresence({
      status: "idle", // online, idle
      game: {
          name: "Maintenance",  //The message shown
          type: "PLAYING" 
      }
    });
  }
}

const mildMoriGifs = [
    "https://media1.tenor.com/images/a3ba0942fdaf264d6562206a178c3ab6/tenor.gif", 
    "https://media1.tenor.com/images/a0cbd8c05bb9bf57ce383f87ed871b69/tenor.gif", 
    "https://media1.tenor.com/images/1f8c7736a46059a800df67a2779b3a86/tenor.gif", 
    "https://media1.tenor.com/images/a0f4fd87fc81b190e0614398bc9839f2/tenor.gif", 
    "https://media1.tenor.com/images/9ade64bf319c3153577e5454760aaed5/tenor.gif",
    "https://media1.tenor.com/images/a2bf82f2af1f8f9298b102b04de5b7a9/tenor.gif?itemid=16648576",
    "https://media1.tenor.com/images/872da3ec5bb0565e58608ac693222bf8/tenor.gif?itemid=12851514",
    "https://media1.tenor.com/images/60e5e37934f3b46da7de59671b8c9b3a/tenor.gif?itemid=13117096",
    "https://media1.tenor.com/images/7977d60bceb2028d2746a04124d9a5fd/tenor.gif?itemid=4517332",
    "https://cdn.discordapp.com/attachments/455186424484986890/695801247739019344/cosplay-gravity-falls-bill-cipher-illuminati-dorito-01a.gif",
    "https://cdn.discordapp.com/attachments/455186424484986890/695801490987810816/maidnothanksbye.gif",
    "https://cdn.discordapp.com/attachments/455186424484986890/695801953153843331/toradora.gif",
    "https://cdn.discordapp.com/attachments/421909994938826752/721560982345875516/CatWithNailFile.gif",
    "https://i.imgur.com/J0cwSpZ.gif",
    "https://i.imgur.com/NxYf7pr.gif",
    "https://i.imgur.com/TAyAFH8.gif",
    "https://i.imgur.com/pPLCl0G.gif",
    "https://i.imgur.com/gQqME9p.gif",
    "https://i.imgur.com/buylAuf.gif",
    "https://i.imgur.com/Ke7K3ea.gif",
    "https://i.imgur.com/JmmiTpN.gif",
    "https://i.imgur.com/BZrl5Jq.gif",
    "https://i.imgur.com/1b4qgIV.gif",
    "https://i.imgur.com/ivp5Zwj.gif",
    "https://i.imgur.com/M4SQKgG.gif",
    "https://i.imgur.com/psdndIq.gif",
    "https://i.imgur.com/i1zLLzU.gif"
];