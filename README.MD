# DittoStar - Moderator tool bridging Reddit and Discord

DittoStar is a tool for subreddit moderators who also have a Discord presence. DittoStar retrieves information such as new modmail, relevant posts, etc and cross-posts them to Discord into specified channels.

### Installing

    npm install
    npm start

## Prerequisites

* NodeJS 13.2.0

## Commands
See [this page for the bot commands and config](./commands.md). Currently supported commands include: 

| Command | Argument | Description |  
|-|-|-|  
| ping | | Responds with `pong!` |
| role | *raid* | Sets role to a specified role |  
| raid | *[number] [text]* | Alerts the `@raid` permission group and follows with whatever text was given as the arguments. If x number precedes text, it will output the raid as a `x★` raid tier. |  
| time | *location* | Finds local time of any of the following: ```Amsterdam, Chicago, Miami, Portland, Sydney, Tokyo``` |  
| dex | *pokemon name or num* | Returns a link to the Serebii Pokedex page for the specified Pokemon |  
| num | *pokemon name or num* | `dex` command but with link previews off | 
| ability | *pokemon name* | Returns the abilities for that Pokemon species in chat | 
| ha | *pokemon name* | Same as the `ability` command above. |
| type | *pokemon name OR pokedex number OR typings* | Returns type weakness match-up | 
| shiny | *pokemon name or pokedex num* | Returns shiny sprite |  
| sprite | *pokemon name or pokedex num* | Returns Pokemon sprite | 

## Helper Functions

### Watcher Helper Functions
* checkKeywords(input,array) - Checks for text matches
* checkKeywordsRegex(input, array) - Check text matches using regex
* unmute(message, seconds) - Unmute user (Discord)

## Authors

* **Jessica Yu** - [Github](https://github.com/jessicayyu)
  
## License
  
* No license.


