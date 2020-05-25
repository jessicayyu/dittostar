## Bot Commands

### Config

The prefix can be set in the config.json file. Simply change the prefix to the desired character. The default is `!`

```"prefix": "!"```

[< Return to the ReadMe main page](./README.MD)

### Table of existing commands  
* Discord Commands
* Reference Commands
* Emoticons
* Moderator Commands

#### Discord Commands
| Command | Argument | Description |  
|-|-|-|  
| friendcode | [ *@user* ] | Can be used as `!fc` to return your own saved friend code, or you can ping a user to see their saved friend code. |  
| fc | [ *@user* ] | Same command as `friendcode` | Saves a friend code to be used in `!fc` |
| ga | [ *optional text* ] | Pings the people subscribed to @giveaways to announce a Discord-only giveaway, must have @giveawayaccess authorization |
| ping | | Responds with `pong!` |
| role | *raid* | Sets role to a specified role |  
| raid | [ *number* ] [ *text* ] | Alerts the `@raid` permission group and follows with whatever text was given as the arguments. If x number precedes text, it will output the raid as a `x★` raid tier. |  
| set | fc [ friend code text ] | Saves text for later retrieval. |  
| | time [ Region/City ] | Saves time zone for later retrieval, must be in correct format from http://worldtimeapi.org/timezones | 
| time | *location* \| *@user* \| *reddit* | Finds local time of any of the following: ```Amsterdam, Chicago, Miami, Portland, Sydney, Tokyo``` or the local time if the user in question has registered a time zone. Can query by Reddit username if registered. |  

#### Reference Commands
| Command | Argument | Description |  
|-|-|-|  
| ability | *pokemon name* | Returns the abilities for that Pokemon species in chat | 
| ha | *pokemon name* | Same as the `ability` command above, short for "hidden ability". |
| dex | *pokemon name \| num* | Returns a link to the Serebii Pokedex page for the specified Pokemon |  
| events | | Links to the /r/PokemonTrades's events wiki page |
| nature | *nature* | Returns the stats effect of the specified nature. |
| num | *pokemon name \| num* | `dex` command but with link previews off | 
| pokejobs | *task title* | Returns desired type and full description of PokeJob |  
| shiny | *pokemon name \| pokedex num* | Returns shiny sprite. Can also check for forms, such as `!sprite alolan Meowth` or `!sprite female Pikachu` |  
| sprite | *pokemon name \| pokedex num* | Returns Pokemon sprite. Can also check for forms, such as `!sprite alolan Meowth` or `!sprite female Pikachu` |  
| symbols | *symbol name* | Prints ★ ✚ \\♥ ✿ ♫ ♪ or the specified symbol |  
| sym | *symbol name* | Same as `symbols` |
| type | *pokemon name \| pokedex number \| typings* | Returns type weakness match-up | 
| vivillon || Shows a picture of all Vivillon patterns |
| viv || Shows a picture of all Vivillon patterns |

#### Emoticons 
| Command | Description |  
|-|-|  
| denko | (´・ω・\`) |
| lenny | ( ͡° ͜ʖ ͡°) |
| magic | (ﾉ◕ヮ◕)ﾉ:･ﾟ✧・ﾟ:・ﾟ  : :･ﾟ・ﾟ･✧:・ﾟ  ::･ﾟ:・ﾟ:・ﾟ  ･ﾟ✧: |
| stare | ಠ\_\_\_ಠ |
| shrug | ¯\_(ツ)_/¯ |
| tableflip | (╯°□°）╯︵ ┻━┻ |

#### Moderator-only commands

| Command | Argument | Description |  
|-|-|-|  
| loadga | | Manual check for giveaways within the last 10 posts. |
| pkgo | title, description, *image* | Pushes an embed with given title and description to 2 designated channels. Markup accepted. Title, description, and image must be separated by `<br>`, image is optional. Can use custom Pokemon Go emojis from other servers using `<rarecandy>` and `<egg>` placeholders. |
| pkgo2 | Same as `!pkgo` but only posts to the main server. |
| pushpost | urls \| post ids | Manual announcement of new subreddit post |


[< Return to the ReadMe main page](./README.MD)