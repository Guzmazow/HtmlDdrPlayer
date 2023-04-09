import Konva from 'konva';
import { Label, Tag } from 'konva/lib/shapes/Label';
import { Line } from 'konva/lib/shapes/Line';
import { Text } from 'konva/lib/shapes/Text';

import { CreateSegmentMarkerOptions, SegmentMarker } from 'peaks.js';

class CustomSegmentMarker implements SegmentMarker {
  private _options: CreateSegmentMarkerOptions;
  private _group?: Konva.Group;
  private _label?: Label;
  private _tag?: Tag;
  private _text?: Text;
  private _line?: Line;

  constructor(options: CreateSegmentMarkerOptions) {
    this._options = options;
  }

  init(group: object) {
    this._group = group as Konva.Group;

    this._label = new Label({
      x: 0.5,
      y: 0.5
    });

    const color = this._options!.segment.color;

    this._tag = new Tag({
      fill:             color as string,
      stroke:           color as string,
      strokeWidth:      1,
      pointerDirection: 'down',
      pointerWidth:     10,
      pointerHeight:    10,
      lineJoin:         'round',
      shadowColor:      'black',
      shadowBlur:       10,
      shadowOffsetX:    3,
      shadowOffsetY:    3,
      shadowOpacity:    0.3
    });

    this._label.add(this._tag);

    let labelText = this._options.segment.labelText;

    if (labelText) {
      labelText += ' ';
    }

    labelText += this._options.startMarker ? 'Start' : 'End';

    this._text = new Text({
      text:       labelText,
      fontFamily: 'Calibri',
      fontSize:   14,
      padding:    5,
      fill:       'white'
    });

    this._label.add(this._text);

    // Vertical Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Line({
      x:           0,
      y:           0,
      stroke:      color as string,
      strokeWidth: 1
    });

    this._group.add(this._label);
    this._group.add(this._line);

    this.fitToView();

    this.bindEventHandlers();
  }

  bindEventHandlers() {
    this._group!.on('mouseenter', () => {
      document.body.style.cursor = 'move';
    });

    this._group!.on('mouseleave', () => {
      document.body.style.cursor = 'default';
    });
  };

  fitToView() {
    const height = this._options.layer.getHeight();

    const labelHeight = this._text!.height() + 2 * this._text!.padding();
    const offsetTop = 14;
    const offsetBottom = 26;

    this._group!.y(offsetTop + labelHeight + 0.5);

    this._line!.points([0.5, 0, 0.5, height - labelHeight - offsetTop - offsetBottom]);
  }
}

export default CustomSegmentMarker;
