require('dotenv').config();

const snoowrap = require('snoowrap');
const { SubmissionStream, CommentStream } = require('snoostorm');

const r = new snoowrap({
    userAgent: 'MoriConnect',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

// const submissions = new SubmissionStream(client, {
//     subreddit: 'pokemongiveaway',
//     limit: 10,
//     pollTime: 5000
// });
// submissions.on("submission", console.log);

const comments = new CommentStream(client, {
    subreddit: 'testingground4bots',
    limit: 10,
    pollTime: 5000
});
comments.on("comment", (item) => {
    console.log(item)
});