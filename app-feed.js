const feed = require('./feed.js');

setInterval(feed.modmailFeed, 180000);

setInterval(feed.postFeed, 90000);

setInterval(feed.commentFeed, 60000);

setInterval(feed.postFeedTama, 300000);

