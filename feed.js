require('dotenv').config();
process.env.UV_THREADPOOL_SIZE = 128;

const moment = require('moment');
moment().format();

var initStartupTimer = function () {
  let start;
  return function () {
    if (start) {
      let duration = process.hrtime(start);
      let output = `${moment().format("h:mm:ss A")}. \n\x1b[33mStartup took ${duration[0]} seconds\x1b[0m.`;
      return output;
    }
    start = process.hrtime();
    console.log('\x1b[33mStarting, ' + moment().format("MMM D h:mm:ss A") + '\x1b[0m.');
    return;
  };
};
let startupTimer = initStartupTimer();
startupTimer();

const snoowrap = require('snoowrap');
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const configJSON = require('./config.json');
const { subreddit, pokeGuild, theCompany } = configJSON;
const watch = require('./watchers.js');

const TOKEN = process.env.DISCORD_TOKEN;

var testingChannel;
var mainChannel;
var feedChannel;

client.on('error', console.error);

const cacheMessage = function(channelID, msgID) {
  let targetChannel = client.channels.get(channelID);
  targetChannel.fetchMessages({around: msgID, limit: 1})
    .catch(console.error);
};

client.on('ready', () => {
  let timeStart = startupTimer();
  console.log(`Logged in as ${client.user.tag} at ${timeStart}`);
  testingChannel = getChannel('423338578597380106');
  mainChannel = getChannel('232062367951749121');
  feedChannel = getChannel('690017722821640199');
  // pokeGuild cache
  cacheMessage('399407103959236618', '658214917027004436');
  // tamaGuild cache
  cacheMessage('723922819859218546', '724063851351638016');
  modmailFeed();
  postFeed();
  commentFeed();
});

client.login(TOKEN);


const r = new snoowrap({
  userAgent: 'MoriConnect',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USER,
  password: process.env.REDDIT_PASS
});

const getChannel = function(channel) {
  var target = null;
  var getChannelCounter = 0;
  return function () {
    while (!target) { 
      target = client.channels.get(channel);
      getChannelCounter++;
      console.log('Get channel attempt ' + getChannelCounter);
    }
    return target;
  }
};

/* RNG: random number generator */
function rand(max, min = 0) {
  return min + Math.floor(Math.random() * Math.floor(max));
}

var getModmail = function() {
  var timeNow = moment();
  return function() {
    r.getSubreddit(subreddit)
      .getNewModmailConversations({limit:5})
      .map((modmail) => {
        const timeCheck = moment(modmail.lastUserUpdate).isBefore(timeNow) || false;
        if (timeCheck) {
          return;
        } 
        if (modmail.messages[0].author.name.name !== "AutoModerator" && modmail.messages[0].author.name.isMod) { 
          return; 
        } 
        console.log("Subject: " + modmail.subject + "\nAuthor:" + modmail.participant.name + "\nhttps://mod.reddit.com/mail/all/" + modmail.id + "\nLast reply: " + modmail.messages[0].author.name.name + "\n ");
        const timestamp = moment(modmail.messages[0].date).format("dddd, MMMM Do YYYY h:mmA");
        let body = "";
        if (modmail.messages[0].bodyMarkdown.length > 100) {
          body = modmail.messages[0].bodyMarkdown.slice(0,100) + ". . .";
        } else {
          body = modmail.messages[0].bodyMarkdown;
        }
        const embed = new Discord.RichEmbed()
          .setTitle("Modmail: " + modmail.subject)
          .setURL("https://mod.reddit.com/mail/all/" + modmail.id)
          .setAuthor("/u/" + modmail.participant.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${modmail.participant.name}`)
          .setColor("#ff4500")
          .setDescription(body + "\n" + timestamp);
        testingChannel().send(embed);
        timeNow = moment();
      })
      .catch(console.error);
  }
};

const postColors = {
  'giveaway': '#1a9eb4', 
  'hcgiveaway': '#c894de',
  'contest': '#f479b5',
  'mod': '#fd0100',
  'ddisc':'#ff7d4d',
  'info': '#cccccc',
  'question':'#2852bc',
};

const postColorsEtc = {
  'request': '#349e48',
  'tradeback': '#349e48',
};

const postLinkClasses = Object.keys(postColors);
// Referenced for both post and comment keyword alerting. 
// postColors comment matches for Rule 2 words like shiny, legendary are ignored.

var checkPosts = function() {
  var options = { limit:5, sort: "new"};
  var last;
  return function() {
    r.getNew(subreddit, options)
      .then((posts) => {
        if (!last) {
          last = posts[0].name;
          return;
        }
        let now = moment();
        if (now.minute() % 2 === 0) {
          console.log(now.format("MMM D h:mm A") + ' ' + 'GA feed ' + last);
        }
        posts.filter(post => (post.name > last)).map((post, i) => {
          let timestamp = moment.utc(post.created_utc * 1000).fromNow();
          const embed = new Discord.RichEmbed()
          if (postLinkClasses.indexOf(post.link_flair_css_class) >= 0) {
            console.log("post title: " + post.title + "\nauthor: /u/" + post.author.name + "\n" + post.permalink + "\n" + timestamp + "\n");
            embed.setColor(postColors[post.link_flair_css_class])
              .setTitle(post.title)
              .setURL(post.url)
              .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
              .setThumbnail("https://i.imgur.com/71bnPgK.png")
              .setDescription(timestamp + " at [redd.it/" + post.id + "](https://redd.it/" + post.id + ")");
            if (post.link_flair_css_class !== 'question') { 
              mainChannel().send(embed);
              feedChannel().send(embed);
             }
          }
          if (!post.distinguished && !post.stickied) {
            let matchers = watch.checkKeywords(post.selftext, ["shiny","sparkly","legend","discord", "subscribe", "channel", "mod", "paypal", "ebay", "venmo", "instagram", "twitter", "youtube", "twitch", "tictoc", "tiktok"]);
            if (post.link_flair_css_class === 'info' || post.link_flair_css_class === 'question' || matchers) {
              let body = post.selftext.length > 150 ? post.selftext.slice(0,150) + ". . .": post.selftext;
              console.log("Post has watched keyword: " + post.url);
              console.log(i, post.selftext.slice(0, 150));
              /* Checks if post was previously picked up, ex: giveaways, announcements */
              if (postLinkClasses.indexOf(post.link_flair_css_class) >= 0) {
                embed.setThumbnail("https://i.imgur.com/vXeJfVh.png");
              } else {
                embed.setColor(postColorsEtc[post.link_flair_css_class])
                  .setTitle(post.title)
                  .setURL(post.url)
                  .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
                  .setThumbnail("https://i.imgur.com/vXeJfVh.png");
              }
              if (matchers) {
                embed.setDescription(`{ ${matchers} } at ${post.id} [${timestamp}](https://redd.it/${post.id})\n${body}`);
              } else {
                embed.setDescription(`[${timestamp} at redd.it/${post.id}](https://redd.it/${post.id})\n${body}`);
              }
              testingChannel().send(embed);
            }
          }
          if (i === 0) {
            last = post.name;
          }
          return post;
        })
      })
      .catch(console.error);
  }
};

var checkComments = function() {
  var options = { limit:20, sort: "new"};
  var last;
  return function() {
    r.getNewComments(subreddit, options)
      .then((comments) => {
        if (!last) {
          last = comments[0].id;
          return;
        }
        let now = moment();
        if (now.minute() % 1 === 0) {
          console.log(now.format("MMM D h:mm A") + ' comment feed ' + last);
        }
        comments.filter(comment => comment.id > last)
        .map((comment, i) => {
          let timestamp = moment.utc(comment.created_utc * 1000).local().format("MMM D h:mm A");
          if (!comment.distinguished) {
            let alwaysAlert = watch.checkKeywords(comment.body, ["mod","paypal","ebay","venmo"]);
            let rule2Match = watch.checkKeywords(comment.body, ["shiny","legend","mythical"]);
            if (alwaysAlert || rule2Match) {
              let linkID = comment.link_id.split('_')[1];
              r.getSubmission(linkID).fetch()
                .then((submission) => {
                  return submission.link_flair_css_class;
                })
                .then((flair) => {
                  // If mods or any other alwaysAlert word is mentioned, always show comment.
                  // Otherwise, show comment if it's not from one of the approved post types.
                  let matchers = alwaysAlert ? alwaysAlert : rule2Match;
                  if (alwaysAlert || (rule2Match && postLinkClasses.indexOf(flair) < 0)) {
                    let body = comment.body.length > 150 ? comment.body.slice(0,150) + ". . .": comment.body;
                    console.log("Comment match: " + matchers + " " + comment.permalink);
                    const embed = new Discord.RichEmbed()
                      .setAuthor("/u/" + comment.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${comment.author.name}`)
                      .setThumbnail("https://i.imgur.com/vXeJfVh.png")
                      .setDescription(body + "\n[" + matchers + " mentioned at " + timestamp + "](https://www.reddit.com" + comment.permalink + "?context=5)");
                    testingChannel().send(embed);
                  }
                })
                .catch(console.error);
            } 
          }
          if (i === 0) {
            last = comment.id;
          }
          return comment;
        })
      })
      .catch(console.error);
  }
}

var pushPost = function(ids) {
  ids.forEach(id => {
    if (id !== '' && id.match(/\w{6}/i)) {
      r.getSubmission(id).fetch()
        .then((post) => {
          let timestamp = moment.utc(post.created_utc * 1000).fromNow();
          let embed = new Discord.RichEmbed()
            .setColor(postColors[post.link_flair_css_class])
            .setTitle(post.title)
            .setURL(post.url)
            .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
            .setThumbnail("https://i.imgur.com/71bnPgK.png")
            .setDescription(timestamp + " at [redd.it/" + post.id + "](https://redd.it/" + post.id + ")");
          mainChannel().send(embed);
          feedChannel().send(embed);
        })
        .catch(console.error);
    } else {
      console.log(`${id} not a valid post`)
    }
  })
};

const modmailFeed = getModmail();
const postFeed = checkPosts();
const commentFeed = checkComments();

module.exports = {
  client: client,
  testingChannel: getChannel('423338578597380106'),
  mainChannel: getChannel('232062367951749121'),
  feedChannel: getChannel('690017722821640199'),
  getChannel: getChannel,
  modmailFeed: modmailFeed,
  postFeed: postFeed,
  commentFeed: commentFeed,
  pushPost: pushPost,
};
