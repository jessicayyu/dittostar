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
  timezone: String
});
var Member = mongoose.model('Member', memberSchema);

module.exports = {
  dbConnect,
  Member,
};