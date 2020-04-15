# DittoStar - Moderator tool bridging Reddit and Discord

DittoStar is a tool for subreddit moderators who also have a Discord presence. DittoStar retrieves information such as new modmail, relevant posts, etc and cross-posts them to Discord into specified channels.

### Installing

    npm install
    npm start

## Prerequisites

* NodeJS 13.2.0

## Commands
See [this page for the bot commands and config](./commands.md), including moderator-only commands. Currently supported commands include: 

| Command | Argument | Description |  
|-|-|-|  
| role | *raid* | Sets role to a specified role |  
| raid | *[number] [text]* | Alerts the `@raid` permission group and follows with whatever text was given as the arguments. If x number precedes text, it will output the raid as a `x★` raid tier. |  
| dex | *pokemon name or num* | Returns a link to the Serebii Pokedex page for the specified Pokemon |   
| type | *pokemon name OR pokedex number OR typings* | Returns type weakness match-up | 
| pokejobs | *task title* | Returns desired type and full description of PokeJob |  
| time | *location* | Finds local time of any of the following: ```Amsterdam, Chicago, Miami, Portland, Sydney, Tokyo``` |  
| . . . | . . . | Additional commands on the full [commands page](./commands.md), including moderator commands. |

## Helper Functions

### Watcher Helper Functions
* checkKeywords(input,array) - Checks for text matches
* checkKeywordsRegex(input, array) - Check text matches using regex
* unmute(message, seconds) - Unmute user (Discord)

## Authors

* **Jessica Yu** - [Github](https://github.com/jessicayyu)
  
## License
  
* No license.


