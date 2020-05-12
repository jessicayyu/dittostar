require('dotenv').config();

var mongoose = require('mongoose');
var mongoOptions = {
  user: 'dittostar',
  pass: process.env.DB_PASSWORD,
  useNewUrlParser: true, 
  useUnifiedTopology: true
};
mongoose.connect('mongodb://localhost:27017/ditto', mongoOptions)
  .catch(console.error);

var dbConnect = mongoose.connection;
dbConnect.on('error', console.error.bind(console, 'connection error:'));
dbConnect.once('open', function() {
  console.log('Mongo connected!')
});
var Schema = mongoose.Schema;
var memberSchema = new Schema({
  userid: String,
  friendcode: String,
  timezone: String,
  nick: String,
});
var Member = mongoose.model('Member', memberSchema);

const writeField = async function(field, textEntry, message) {
  let profile = await Member.findOne({userid: message.author.id});
  if (profile === null) {
    profile = new Member({
      userid: message.author.id,
      nick: message.member.nickname,
      [field]: textEntry
    });
  } else {
    profile[field] = textEntry;
  }
  await profile.save((err, saveData) => {
    if (err) return console.error(err);
    message.channel.send('\\*jots down notes\\* Okay, got it.');
  });
};

module.exports = {
  dbConnect,
  Member,
  writeField
};