import Konva from 'konva';
import { Line } from 'konva/lib/shapes/Line';

import { CreatePointMarkerOptions, PointMarker } from 'peaks.js';

class SimplePointMarker implements PointMarker {
  private _options: CreatePointMarkerOptions;
  private _group?: Konva.Group;
  private _line?: Line;

  constructor(options: CreatePointMarkerOptions) {
    this._options = options;
  }

  init(group: object) {
    this._group = group as Konva.Group;

    // Vertical Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Line({
      x:           0,
      y:           0,
      stroke:      this._options.color,
      strokeWidth: 1
    });

    this._group.add(this._line);

    this.fitToView();
  }

  fitToView() {
    const height = this._options.layer.getHeight();

    this._line!.points([0.5, 0, 0.5, height]);
  }
}

export default SimplePointMarker;
