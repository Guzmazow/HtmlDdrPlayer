
interface PulseOptions {
    onComplete(event: OfflineAudioCompletionEvent): void;
    convertToMilliseconds?: boolean;
    removeDuplicates?: boolean;
    audioData: ArrayBuffer;
}

export class Pulse {

    options: PulseOptions;
    audioContext = this._getAudioContext();
    significantPeaks: number[] = [];
    extrapolatedPeaks: number[] = [];
    beat: { ms: number | null; bpm: number | null; } = {
        ms: null,
        bpm: null
    }

    constructor(options: PulseOptions) {
        // init options
        this.options = { ...this.getDefaultOptions(), ...options };
        this._process(this.options.audioData);
    };

    /**
     * @method Pulse#_getAudioContext
     * @access private
     * @description Get the audio context of the browser.
     * @returns {AudioContext|object} The audio context object or null if the browser is not supported Web Audio API.
     */
    _getAudioContext() {
        window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        return new window.AudioContext();
    };

    /**
     * @method Pulse#getDefaultOptions
     * @description Get the default options.
     * @returns {object} Options with default values
     */
    getDefaultOptions(): PulseOptions {
        return {
            onComplete: () => { },
            convertToMilliseconds: true,
            removeDuplicates: true,
            audioData: new ArrayBuffer(0)
        };
    };

    /**
     * @method Pulse#_process
     * @access private
     * @description Process to decode audio data, if fails it sends a DECODING_ERROR status.
     * @return {void}
     */
    _process(audioData: ArrayBuffer) {
        this.audioContext.decodeAudioData(
            audioData,
            this._processCallback.bind(this),
            () => {
                throw 'DECODING ERROR';
            }
        );
    };

    /**
     * @method Pulse#_getOfflineContext
     * @access private
     * @description Get the offline audio context and set nodes and filters.
     * @return {OfflineAudioContext}
     */
    _getOfflineContext(buffer: AudioBuffer) {
        var offlineContext = new window.OfflineAudioContext(1, buffer.length, buffer.sampleRate),
            source = offlineContext.createBufferSource(),
            filter = offlineContext.createBiquadFilter();

        source.buffer = buffer;
        filter.type = "lowpass";

        source.connect(filter);
        filter.connect(offlineContext.destination);

        source.start(0);
        return offlineContext;
    };

    /**
     * @method Pulse#_processCallback
     * @access private
     * @description Callback after audio data is decoded.
     * @return {void}
     */
    _processCallback(buffer: AudioBuffer) {
        if (!buffer) return;
        var offlineContext = this._getOfflineContext(buffer);

        offlineContext.oncomplete = (event: OfflineAudioCompletionEvent) => {
            this.getSignificantPeaks(event);
            this.getBeat();
            this.getExtrapolatedPeaks(event);
            // give a user callback
            this.options.onComplete(event);
        };

        offlineContext.startRendering();
    };

    /**
     * @method Pulse#_getChannelDataMinMax
     * @description Get the min/max of a channel data.
     * @return {object}
     */
    _getChannelDataMinMax(channelData: Float32Array) {
        var length = channelData.length,
            min = channelData[0],
            max = channelData[0],
            j;

        for (j = 1; j < length; j++) {
            min = Math.min(min, channelData[j]);
            max = Math.max(max, channelData[j]);
        }

        return {
            min: min,
            max: max
        };
    };

    /**
     * @method Pulse#getSignificantPeaks
     * @description Get the significant peaks.
     * @return {object}
     */
    getSignificantPeaks(event: OfflineAudioCompletionEvent) {

        var channelData = event.renderedBuffer.getChannelData(0);
        var limit = this._getChannelDataMinMax(channelData);
        var intervalMin = 230; // ms, max tempo = 260 bpm
        var amplitude = Math.abs(limit.min) + Math.abs(limit.max);
        var maxThreshold = limit.min + amplitude * 0.9; // 90% uppest beats
        var minThreshold = limit.min + amplitude * 0.3; // 30% uppest beats
        var threshold = maxThreshold;
        var acuracy = event.renderedBuffer.sampleRate * (intervalMin / 1000);
        var significantPeaks: number[] = [];
        var duration = event.renderedBuffer.duration;
        var length = channelData.length;

        // grab peaks
        while (
            threshold >= minThreshold &&
            significantPeaks.length <= duration
        ) {
            for (var j = 0; j < length; j++) {
                if (channelData[j] > threshold) {
                    significantPeaks.push(j);

                    j += acuracy;
                }
            }
            threshold -= 0.05; // -5% every interation
        }

        significantPeaks.sort(function (a, b) {
            return a - b;
        });

        if (this.options.convertToMilliseconds) {
            for (var i in significantPeaks) {
                significantPeaks[i] = Math.floor((significantPeaks[i] / event.renderedBuffer.sampleRate) * 1000);
            }
        }

        if (this.options.removeDuplicates) {
            // remove all duplicates and 0 values
            significantPeaks = significantPeaks.filter(function (item, pos) {
                return (!pos || item > significantPeaks[pos - 1]) && item > 0;
            });
        }

        this.significantPeaks = significantPeaks;
    };

    /**
     * @method Pulse#getBeat
     * @description Get the beat in milliseconds and beat per minute.
     * @return {object}
     */
    getBeat() {
        // count interval durations between each peak
        var intervals: number[] = [],
            square = 0,
            count = 0,
            max = 0,
            ms = 0,
            msBetween: { max: number; ms: number; }[] = [],
            avgCountInterval: number,
            referenceMs: { max: number; ms: number; }[],
            sumMargins: number[] = [],
            minMarginIndex = 0,
            minMargin: number = 0,
            tempo: number = 0,
            tempoMs: number = 0;

        var calcIntervals = () => {
            for (var i = 1; i < this.significantPeaks.length; i++) {
                for (var j = 0; j < i; j++) {

                    // assuming intervals must be less than 260 bpm (more than ~230 ms)
                    if (this.significantPeaks[i] - this.significantPeaks[j] >= 230) {
                        if (intervals[this.significantPeaks[i] - this.significantPeaks[j]] === undefined) {
                            intervals[this.significantPeaks[i] - this.significantPeaks[j]] = 0;
                        }
                        intervals[this.significantPeaks[i] - this.significantPeaks[j]]++;
                    }
                }
            }
        }

        calcIntervals();

        // quadratic mean to compute the average power
        for (const interval in intervals) {
            square += Math.pow(intervals[interval], 2);
            count++;
        }

        avgCountInterval = Math.sqrt(square / count);

        /**
         * TODO this needs to be improved
         */

        // get max beats between an interval (1000 ms)
        var getMaxBeats = () => {
            for (let i = 0; i < intervals.length; i++) {
                const interval = intervals[i];
                if (interval > avgCountInterval) {
                    if (interval > max) {
                        max = interval;
                        ms = i;
                    }

                    var segment = Math.floor(i / 500); // segmentation by 500, this needs to be computed
                    if (msBetween[segment] === undefined) {
                        msBetween.push({ max: 0, ms: i });
                    }

                    if (msBetween[segment] !== undefined && interval > msBetween[segment].max) {
                        msBetween[segment] = { max: interval, ms: i };
                    }
                }
            }
        };
        getMaxBeats();

        /**
         * TODO this needs to be improved
         */
        var getTempo = () => {
            // compare ms with all other time beats
            referenceMs = msBetween.slice(0, 3);
            for (var i = 0; i < referenceMs.length; i++) {
                sumMargins.push(0);
                for (var j = 0; j < msBetween.length; j++) {
                    sumMargins[i] += msBetween[j].ms % referenceMs[i].ms;
                }
            }

            /**
             * TODO this needs to be improved
             */
            minMarginIndex = 0;
            minMargin = sumMargins[minMarginIndex];
            for (var i = 1; i < sumMargins.length; i++) {
                if (minMargin > sumMargins[i]) {
                    minMargin = sumMargins[i];
                    minMarginIndex = i;
                }
            }

            // find the start beat of tempo
            tempo = Math.round(60000 / referenceMs[minMarginIndex].ms);
            tempoMs = referenceMs[minMarginIndex].ms;
        }
        getTempo();
        this.beat.ms = tempoMs;
        this.beat.bpm = tempo;
    };

    /**
     * @method Pulse#getExtrapolatedPeaks
     * @description Get the extrapolated peaks regarding the computed beat.
     * @return {object}
     */
    getExtrapolatedPeaks(event: OfflineAudioCompletionEvent) {
        const beatMs = this.beat.ms ?? 0;
        var playbackTempo: number[] = [],
            chainedKeys: number[] = [],
            chainedKeysMax: number[] = [],
            errorMs = 2,
            extrapolatedPeaks: number[] = [];

        for (var i = 0; i < this.significantPeaks.length; i++) {
            for (var j = 0; j < i; j++) {
                if (this.significantPeaks[i] - this.significantPeaks[j] == beatMs) {
                    playbackTempo.push(this.significantPeaks[i]);
                    playbackTempo.push(this.significantPeaks[j]);
                }
            }
        }

        playbackTempo.sort(function (a, b) {
            return a - b;
        });

        playbackTempo = playbackTempo.filter(function (item, pos) {
            return (!pos || item > playbackTempo[pos - 1] + 230) && item > 0;
        });

        // detect chained
        for (i = 0; i < playbackTempo.length - 1; i++) {
            if (playbackTempo[i] + beatMs <= playbackTempo[i + 1] + errorMs && playbackTempo[i] + beatMs >= playbackTempo[i + 1] - errorMs) {
                chainedKeys.push(i);
            } else {
                if (chainedKeysMax.length < chainedKeys.length) {
                    chainedKeysMax = chainedKeys;
                }

                chainedKeys = [];
            }
        }

        if (chainedKeysMax.length) {
            var minChained = playbackTempo[chainedKeysMax[0]];
            while (minChained > beatMs) {
                minChained -= beatMs;
            }

            var maxChained = playbackTempo[chainedKeysMax.length - 1];
            while (maxChained < event.renderedBuffer.duration * 1000) {
                maxChained += beatMs;
            }

            for (i = minChained; i <= maxChained; i += beatMs) {
                extrapolatedPeaks.push(i);
            }
        }

        this.extrapolatedPeaks = extrapolatedPeaks;
    };
}

