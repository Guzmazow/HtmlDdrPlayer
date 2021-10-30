# HtmlDdrPlayer

[![Angular CI](https://github.com/Guzmazow/HtmlDdrPlayer/actions/workflows/angular.yml/badge.svg)](https://github.com/Guzmazow/HtmlDdrPlayer/actions/workflows/angular.yml)

### DEMO: https://guzmazow.github.io/
#### How to play?:
- Use arrow keys
- Connect using serial port (button at the right corner of the website navigation bar) and continuously receive integer value that indicates pressed keys
  - 16 bit array (Uint8array) aka usinged int:
    | index | 15 |  14  |  13  |   12  |   11  |   10   |    9 .. 0    |
    |:-----:|:--:|:----:|:----:|:-----:|:-----:|:------:|:------------:|
    |  key  | UP | DOWN | LEFT | RIGHT | START | SELECT |      N/A     |
    | value |  1 |   2  |   4  |   8   |   16  |   32   |  64 .. 32768 |
### Things TODO moved to an issue

### Goals of this project
Create a web vesion of DDR/ITG game
- Serverless
- Fast loading
- Media (songs, videos) stored on 3rd party servers
  - keeping media on youtube servers seams a lot more legal
- Play the standard simfile (.SM) format to leverage existing song base
