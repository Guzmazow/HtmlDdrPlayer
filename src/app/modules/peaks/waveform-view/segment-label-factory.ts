import { Label, Tag } from 'konva/lib/shapes/Label';
import { Text } from 'konva/lib/shapes/Text';

import { CreateSegmentLabelOptions } from 'peaks.js';

export function createSegmentLabel(options: CreateSegmentLabelOptions): object | null {
  if (options.view === 'overview') {
    return null;
  }

  const label = new Label({
    x: 12,
    y: 16
  });

  label.add(new Tag({
    fill:             'black',
    pointerDirection: 'none',
    shadowColor:      'black',
    shadowBlur:       10,
    shadowOffsetX:    3,
    shadowOffsetY:    3,
    shadowOpacity:    0.3
  }));

  label.add(new Text({
    text:       options.segment.labelText,
    fontSize:   14,
    fontFamily: 'Calibri',
    fill:       'white',
    padding:    8
  }));

  return label;
}
