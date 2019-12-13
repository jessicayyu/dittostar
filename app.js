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

r.getSubreddit('pokemongiveaway')
    // .getHot().map(post => post.title)
    .getNewModmailConversations({limit:3})
    .map(modmail => {
        let summary = [];
        summary.push(modmail.id, modmail.subject, modmail.messages[0].author.name.name);
        return summary;
    })
    .map(item => {
        console.log("Subject: " + item[1] + "\nAuthor:" + item[2] + "\nhttps://mod.reddit.com/mail/all/" + item[0] + "\n")
    });
