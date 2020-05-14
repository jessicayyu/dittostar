const feed = require('./feed.js');

const modmailFeed = feed.getModmail();
const postFeed = feed.checkPosts();
const commentFeed = feed.checkComments();

setTimeout(modmailFeed, 10000);
setInterval(modmailFeed, 180000);

setTimeout(postFeed, 10000);
setInterval(postFeed, 90000);

setTimeout(commentFeed, 15000);
setInterval(commentFeed, 60000);

