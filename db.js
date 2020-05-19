require('dotenv').config();
const { mongoURI } = require('./config.json');

var mongoose = require('mongoose');
var mongoOptions = {
  user: 'dittostar',
  pass: process.env.DB_PASSWORD,
  useNewUrlParser: true, 
  useUnifiedTopology: true
};
mongoose.connect(mongoURI, mongoOptions)
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
  reddit: String
});
var Member = mongoose.model('Member', memberSchema);

const writeField = async function(field, textEntry, message) {
  /*
  param field: string, the field that will be updated in the database entry
  param textEntry: string, what will be entered in the specified field
  param message: message object 
  */
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