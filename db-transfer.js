const db = require('./db.js');
const source = require('../DiscordBotPY/fc.json');
const data = source._default;

for (var num in data) {
  let temp = new db.Member({
    userid: data[num].id,
    nick: data[num].nick,
    friendcode: data[num].fc
  });
  temp.save(function (err, temp) {
    if (err) return console.error(err);
    console.log(temp.nick + ' saved.')
  })
}
