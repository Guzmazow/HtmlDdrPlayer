export default interface MyAudioContext {
  context?: AudioContext,
  buffer?: AudioBuffer,
  audioElem?: HTMLAudioElement
  url?: string,
  loaded?: () => void
}
