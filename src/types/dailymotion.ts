declare global {
    interface Window {
        dailymotion: dailymotion;
    }
}

export interface DailymotionPlayerSettings {
    video?: string;
    playlist?: string;
    customConfig?: any;
    syndicationKey?: string;
    scaleMode?: "fit" | "fill" | "fillLeft" | "fillRight" | "fillTop" | "fillBottom";
    mute?: boolean;
    startTime?: number;
    loop?: boolean;
}

export interface DailymotionPlayer {
    getSettings: () => DailymotionPlayerSettings;
    getState: () => Promise<DailymotionPlayerState>;
    loadContent: (data: { video: String, playlist: String, startTime: Number }) => void;
    off: (event: string, listener: ((state: any) => any)) => void;
    on: (event: string, listener: ((state: any) => any), once?: Boolean) => void;
    pause: () => void;
    play: () => void;
    seek: (to: number) => void;
    setAspectRatio: (aspectRation: string) => void;
    setControls: (enabled: boolean) => void;
    setCustomConfig: (config: any) => void;
    setFullscreen: (enabled: boolean) => void;
    setLoop: (enabled: boolean) => void;
    setMute: (enabled: boolean) => void;
    setQuality: (quality: VideoQuality) => void;
    setScaleMode: (scaleMode: ScaleMode) => void;
    setSubtitles: (language: string) => void;
    setVolume: (volume: number) => void;
    updateParams: (config: DailymotionPlayerSettings) => void;
}

type ScaleMode = "fit" | "fill" | "fillLeft" | "fillRight" | "fillTop" | "fillBottom";
type VideoQuality = "240" | "380" | "480" | "720" | "1080" | "1440" | "2160" | "default";
type PlayerPresentationMode = "inline" | "nativePip" | "pip" | "fullscreen";
type PlayerPlaybackPermissionReason = "allowedFallbackMuted" | "allowed" | "rejectedInactiveTab" | "rejectedByBrowser";
type PlayerPipStatus = "enabled" | "disabled" | "closed";
type PlayerPipDisplay = "largeViewport" | "smallViewport";
type PlayerAspectRatio = "inherit" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
type AdPosition = "preroll" | "midroll" | "postroll" | null;
type AdEndReason = "error" | "stopped" | "skipped" | null;

export interface DailymotionPlayerState {
    adAdvertiserName: string | null,
    adCompanion: string,
    adCreativeAdId: string,
    adCreativeId: string,
    adDescription: string | null,
    adDuration: number,
    adEndedReason: AdEndReason,
    adError: string | null,
    adId: string,
    adIsPlaying: boolean,
    adIsSkippable: boolean,
    adPosition: AdPosition;
    adSkipOffset: number,
    adTime: number,
    adTitle: string | null,
    playerAreControlsEnabled: boolean,
    playerAspectRatio: PlayerAspectRatio;
    playerError: string,
    playerIsAlertDialogDisplayed: boolean,
    playerIsBuffering: boolean,
    playerIsCriticalPathReady: boolean,
    playerIsMuted: boolean,
    playerIsNavigationEnabled: boolean,
    playerIsPipNativeSupported: boolean,
    playerIsPlaybackAllowed: boolean,
    playerIsPlaying: boolean,
    playerIsReplayScreen: boolean,
    playerIsStartScreen: boolean,
    playerIsViewable: boolean,
    playerNextVideo: string,
    playerPipDisplay: PlayerPipDisplay;
    playerPipIsExpanded: boolean,
    playerPipStatus: PlayerPipStatus;
    playerPlaybackPermissionReason: PlayerPlaybackPermissionReason;
    playerPresentationMode: PlayerPresentationMode,
    playerPrevVideo: string,
    playerScaleMode: ScaleMode,
    playerVolume: number,
    videoCreatedTime: number,
    videoDuration: number,
    videoId: string,
    videoIsPasswordRequired: boolean,
    videoOwnerId: string,
    videoOwnerScreenname: string,
    videoOwnerUsername: string,
    videoQualitiesList: VideoQuality[],
    videoQuality: string,
    videoSubtitles: string,
    videoSubtitlesList: string[],
    videoTime: number,
    videoTitle: string,
};

export interface dailymotion {
    createPlayer: (playerContainerId: string, settings: DailymotionPlayerSettings) => Promise<DailymotionPlayer>;
    events: {
        AD_CLICK: "ad_click"
        AD_COMPANIONSREADY: "ad_companions"
        AD_DURATIONCHANGE: "ad_durationchange"
        AD_END: "ad_end"
        AD_ERROR: "ad_error"
        AD_IMPRESSION: "ad_impression"
        AD_LOADED: "ad_loaded"
        AD_PAUSE: "ad_pause"
        AD_PLAY: "ad_play"
        AD_START: "ad_start"
        AD_TIMECHANGE: "ad_timeupdate"
        PLAYER_ASPECTRATIOCHANGE: "pes_aspectratiochange"
        PLAYER_CONTROLSCHANGE: "controlschange"
        PLAYER_CRITICALPATHREADY: "playback_ready"
        PLAYER_END: "end"
        PLAYER_ERROR: "error"
        PLAYER_HEAVYADSINTERVENTION: "player_heavyadsintervention"
        PLAYER_PIPEXPANDEDCHANGE: "pes_pipexpandedchange"
        PLAYER_PLAYBACKPERMISSION: "playback_resolution"
        PLAYER_PRESENTATIONMODECHANGE: "pes_presentationmodechange"
        PLAYER_SCALEMODECHANGE: "pes_scalemodechange"
        PLAYER_START: "start"
        PLAYER_VIDEOCHANGE: "videochange"
        PLAYER_VIDEOLISTCHANGE: "videolistchange"
        PLAYER_VIEWABILITYCHANGE: "pes_viewabilitychange"
        PLAYER_VOLUMECHANGE: "volumechange"
        VIDEO_BUFFERING: "waiting"
        VIDEO_DURATIONCHANGE: "durationchange"
        VIDEO_END: "video_end"
        VIDEO_PAUSE: "pause"
        VIDEO_PLAY: "play"
        VIDEO_PLAYING: "playing"
        VIDEO_PROGRESS: "progress"
        VIDEO_QUALITIESREADY: "qualitiesavailable"
        VIDEO_QUALITYCHANGE: "qualitychange"
        VIDEO_SEEKEND: "seeking"
        VIDEO_SEEKSTART: "seeked"
        VIDEO_START: "video_start"
        VIDEO_SUBTITLESCHANGE: "subtitlechange"
        VIDEO_SUBTITLESREADY: "subtitlesavailable"
        VIDEO_TIMECHANGE: "timeupdate"
    }
}