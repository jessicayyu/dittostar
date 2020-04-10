## Bot Commands

### Config

The prefix can be set in the config.json file. Simply change the prefix to the desired character. The default is `!`

```"prefix": "!"```

[< Return to the ReadMe main page](./README.MD)

### Table of existing commands

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
| pokejobs | *task title* | Returns desired type and full description of PokeJob |  

### Moderator-only commands

| Command | Argument | Description |  
|-|-|-|  
| giveaways | | Manual check for giveaways within the last 10 posts. |
| pkgo | *title \<br\> description* | Pushes an embed with given title and description to 2 designated channels. Markup accepted. |
| pushpost | *urls or post ids* | Manual announcement of new subreddit post |

[< Return to the ReadMe main page](./README.MD)