require('dotenv').config();

const snoowrap = require('snoowrap');
const Discord = require('discord.js');
const client = new Discord.Client();

var moment = require('moment');
moment().format();

const TOKEN = process.env.DISCORD_TOKEN;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const r = new snoowrap({
    userAgent: 'MoriConnect',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});

function rand(max, min = 0) {
    return min + Math.floor(Math.random() * Math.floor(max));
}

r.getSubreddit('pokemongiveaway')
    .getNewModmailConversations({limit:5})
    .map(modmail => {
        console.log("Subject: " + modmail.subject + "\nAuthor:" + modmail.participant.name + "\nhttps://mod.reddit.com/mail/all/" + modmail.id + "\nLast reply: " + modmail.messages[0].author.name.name + "\n ");
        if (modmail.messages[0].author.name.isMod) { 
            return; 
        } else {
            let body = "";
            if (modmail.messages[0].bodyMarkdown.length > 100) {
                body = modmail.messages[0].bodyMarkdown.slice(0,100) + " . . .";
            } else {
                body = modmail.messages[0].bodyMarkdown;
            }
            // let usernames = [];
            // for (let x = 0; x < 3; x++) {
            //     usernames.push(modmail.authors[x].name);
            // }
            // const participants = usernames.join(", ");
            const embed = new Discord.RichEmbed()
                .setTitle("Modmail: " + modmail.subject)
                .setAuthor("/u/" + modmail.participant.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${modmail.participant.name}`)
                .setDescription(body + "\nhttps://mod.reddit.com/mail/all/" + modmail.id);
            client.channels.get("423338578597380106").send(embed);
        }
    })
    .catch(console.error);

var checkPosts = function() {
    var options = { limit:3, sort: "new"};
    // check timestamp
    // only console log if newer than timestamp
    // update timestamp
    return function() {
        r.getNew('pokemongiveaway', options)
            .map(post => {
                // console.log(post);
                let timestamp = moment(post.created_UTC).format("dddd, MMMM Do YYYY h:mmA");
                console.log("post title: " + post.title + "\nauthor: /u/" + post.author.name + "\n" + post.permalink + "\n" + post.link_flair_css_class + "\n" + timestamp);
                if (post.link_flair_css_class === "giveaway" || post.link_flair_css_class === "hcgiveaway" || post.link_flair_css_class === "contest" || post.link_flair_css_class === "mod" || post.link_flair_css_class === "ddisc") {
                    const embed = new Discord.RichEmbed()
                        .setTitle(post.title)
                        .setAuthor("/u/" + post.author.name, "https://i.imgur.com/AvNa16N.png", `https://www.reddit.com/u/${post.author.name}`)
                        .setDescription("https://www.reddit.com" + post.permalink + "\n" + timestamp);
                    client.channels.get("423338578597380106").send(embed);
                }
                options.before = post.name;
            })
            .catch(console.error);
    }
}

var postFeed = checkPosts();
postFeed();
setInterval(postFeed, 90000);

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.find(ch => ch.name === 'chat-main');
    const greets = [
        `Hello, ${member}! So glad to have you here!`, 
        `Get back in the bag Neb--oh, hi ${member}!`, 
        `Let's have a champion time, ${member}! Ah ha ha, Leon is so corny, isn't he?`,
        `Joining us from Galar, ${member}?`,
        `It's dangerous to go alone, take this! \\*hands ${member} some expired coupons\\*`,
        `Hihi! Sword or Shield, ${member}? Or maybe another generation?`,
        `Hell~loo ${member}! Take a seat anywhere, this is the main room.`
    ];
    if (!channel) return;
    let greeting = greets[rand(6)];
    channel.send(greeting);
    console.log('New user joined server!' + member);
});

client.on('message', message => {
    if (message.type === "GUILD_MEMBER_JOIN") {
        message.delete();
    }
});

client.login(TOKEN);
