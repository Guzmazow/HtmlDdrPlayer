# HtmlDdrPlayer

[![Angular CI](https://github.com/Guzmazow/HtmlDdrPlayer/actions/workflows/angular.yml/badge.svg)](https://github.com/Guzmazow/HtmlDdrPlayer/actions/workflows/angular.yml)

### DEMO: https://guzmazow.github.io/
#### How to play?:
- Use arrow keys. Or connect using serial port and receive byte flag
- Connect using serial port and continuesly receive one integer that indicate pressed keys.
  - 16 bit array (Uint8array) aka usinged int
    | index | key    | value |
    | ----: | ------ | ----- |
    | 15    | UP     | 1     |
    | 14    | DOWN   | 2     |
    | 13    | LEFT   | 4     |
    | 12    | RIGHT  | 8     |
    | 11    | START  | 16    |
    | 10    | SELECT | 32    |
    | 09    | N/A    | 64    | 
    | 08    | N/A    | 128   |
    | 07    | N/A    | 256   |
    | 06    | N/A    | 512   |
    | 05    | N/A    | 1024  |
    | 04    | N/A    | 2048  |
    | 03    | N/A    | 4096  |
    | 02    | N/A    | 8192  |
    | 01    | N/A    | 16384 |
    | 00    | N/A    | 32768 |
### Things TODO moved to an issue

### Goals of this project
- Create a web vesion of DDR/ITG game
    - Serverless
    - Fast loading
    - Media (songs, videos) stored on 3rd party servers
    - Play the standard simfile (.SM) format to leverage existing song base

