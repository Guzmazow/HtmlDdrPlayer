# HtmlDdrPlayer

[![Angular CI](https://github.com/Guzmazow/HtmlDdrPlayer/actions/workflows/angular.yml/badge.svg)](https://github.com/Guzmazow/HtmlDdrPlayer/actions/workflows/angular.yml)

### DEMO: https://guzmazow.github.io/

---

#### How to play?
- Use arrow keys
- Connect using serial port (button at the right corner of the website navigation bar) and continuously receive integer value that indicates pressed keys
  - 16 bit array (Uint8array) aka usinged int:
    | index | 15 |  14  |  13  |   12  |   11  |   10   |    9 .. 0    |
    |:-----:|:--:|:----:|:----:|:-----:|:-----:|:------:|:------------:|
    |  key  | UP | DOWN | LEFT | RIGHT | START | SELECT |      N/A     |
    | value |  1 |   2  |   4  |   8   |   16  |   32   |  64 .. 32768 |

---

### Goal of this project
- Create a web vesion of DDR/ITG game
### Main properties of this project
- Serverless
- Fast loading
- Media (songs, videos) stored on 3rd party servers
  - keeping media on youtube servers seams a lot more legal
- Play the standard simfile (.SM) format to leverage existing song base

---

## Used stuff (acknowledgements, honorable mentions)

- OutFox arrows, glow, judgement images - https://github.com/TeamRizu/OutFox 
- Stepmania default fallback mine image/sound - https://github.com/stepmania/stepmania
- JS Simfile parser from some old video (cannot find the link anymore)
  - Seems like Trumpet63-stream also rewrote it to typescript https://github.com/Trumpet63-stream/SimParser
    - For peace of mind I link his licence as well http://creativecommons.org/licenses/by/4.0/
    - As required by licence I mention that there is almost no original code left.

- Project includes simfiles from specific simfile pad packs:
  - Ace Of Arrows - http://aceofarrows.weebly.com/
  - chewi's simfiles - https://zenius-i-vanisher.com/v5.2/viewsimfilecategory.php?categoryid=842
  - Fraxtil - https://fra.xtil.net/simfiles/
  - Otaku's Dream Mix - https://www.otakusdream.com/news/?page_id=1320
  - Sudziosis - https://zenius-i-vanisher.com/v5.2/viewthread.php?threadid=5434
  - Valex's Magical 4-Arrow Adventure - https://search.stepmaniaonline.net/packs/Valex%27s+Magical+4-Arrow+Adventure
  - Vocaloid Project Pad Pack - https://search.stepmaniaonline.net/packs/Vocaloid+Project+Pad+Pack
  - Other - various other singles are included in seperate folder
  
- As of this writing all music/videos are stored in youtube
  - Missing songs were uploaded unlisted to my channel
  - Videos are played using https://www.npmjs.com/package/ngx-y2-player
    - Which in turn utilizes https://developers.google.com/youtube/iframe_api_reference