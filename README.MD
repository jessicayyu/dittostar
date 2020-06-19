# DittoStar - Moderator tool bridging Reddit and Discord

DittoStar is a tool for subreddit moderators who also have a Discord presence. DittoStar retrieves information such as new modmail, relevant posts, etc and cross-posts them to Discord into specified channels.

## Prerequisites

* NodeJS 13.2.0
* NPM

### Installing
Enter your relevant authentication keys and configurations in the following files: `.env` and `config.json`. Example files `example.env` and `config.example.json` have been included.
  
Run the following commands: 

    npm install
    npm start

The Reddit Feed can be run separately, if config.json is set to `runFeedInApp: false`. In that case, run it using:
  
    npm run feed

## Commands
See [this page for the full bot commands and config](./commands.md), including moderator-only commands. Some of the supported commands include: 

| Command | Argument | Description |  
|-|-|-|  
| role | *raid* | Sets role to a specified role |  
| raid | *[number] [text]* | Alerts the `@raid` permission group and follows with whatever text was given as the arguments. If x number precedes text, it will output the raid as a `x★` raid tier. |  
| dex | *pokemon name or num* | Returns a link to the Serebii Pokedex page for the specified Pokemon |   
| type | *pokemon name OR pokedex number OR typings* | Returns type weakness match-up | 
| pokejobs | *task title* | Returns desired type and full description of PokeJob |  
| . . . | . . . | Additional commands on the full [commands page](./commands.md), including moderator commands. |

## Modules

### Dex Helper Functions
The Dex helper functions module handles Pokemon gameplay-related queries, such as Pokedex entries and type weaknesses.

### Watcher Helper Functions
The watcher helper functions primarily deal with the Discord command helper functions.
  
* checkKeywords(input,array) - Checks for text matches
* checkKeywordsRegex(input, array) - Check text matches using regex
* unmute(message, seconds) - Unmute user (Discord)

### Command Lines
This module contains the logic regarding the bot command line functionality. It references the helper functions in the `dex-helpers.js` and `watchers.js` modules.

## MongoDB
DittoStar uses MongoDB to store user information. 
* Database: ditto
* Collection: members

Start:
```
sudo service mongod start
mongo -u username -p --authenticationDatabase ditto
```

### Testing
The Dittostar app uses the Mochai and Chai testing framework.
```
npm test
```

## pm2
pm2 can be used to automatically restart the app if it goes down.  
  
    pm2 start app.js

The Reddit Feed can be run separately, if config.json is set to `runFeedInApp: false`. Optional: `--name feed` for display purposes in the pm2 console.
  
    pm2 start app-feed.js --name feed

File `ecosystem.config.js` specifies restart strategies and can be modified for static restart times.

## Authors

* **Jessica Yu** - [Github](https://github.com/jessicayyu)
  
## License
  
* No license.


