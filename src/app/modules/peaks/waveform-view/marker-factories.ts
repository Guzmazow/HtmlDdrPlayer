import CustomPointMarker from './custom-point-marker';
import SimplePointMarker from './simple-point-marker';
import CustomSegmentMarker from './custom-segment-marker';

import { CreatePointMarkerOptions, CreateSegmentMarkerOptions } from 'peaks.js';

export function createPointMarker(options: CreatePointMarkerOptions): SimplePointMarker | CustomPointMarker {
  if (options.view === 'zoomview') {
    return new CustomPointMarker(options);
  }
  else {
    return new SimplePointMarker(options);
  }
}

export function createSegmentMarker(options: CreateSegmentMarkerOptions): CustomSegmentMarker | null {
  if (options.view === 'zoomview') {
    return new CustomSegmentMarker(options);
  }

  return null;
}
