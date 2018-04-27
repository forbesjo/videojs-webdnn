import * as WebDNN from 'webdnn';
import videojs from 'video.js';

const style = async function ({ path: _modelPath }) {
  if (!_modelPath) return;

  let _newModelPath = _modelPath;

  const _player = this;
  let _running = false;
  const _video = _player.tech().el();
  const _playerWidth = _player.currentWidth();
  const _playerHeight = _player.currentHeight();
  const _width = 192;
  const _height = 144;
  const _canvas = document.createElement('canvas');
  _canvas.style = `
      object-fit: contain;
      width: 100%;
      height: 100%;
    `;

  _video.parentNode.insertBefore(_canvas, _video);

  const clear = () => {
    const context = _canvas.getContext('2d');
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    _video.style.display = 'inline';
  };

  let _runner;
  let _inputView;
  let _outputView;

  const transfer = async () => {
    // 1. Load image data from video element into input view
    const image = await WebDNN.Image.getImageArray(_video, {
      dstH: _height,
      dstW: _width,
      color: WebDNN.Image.Color.RGB,
      order: WebDNN.Image.Order.CHW
    });

    _inputView.set(image);

    // 2. Run DNN model
    await _runner.run();

    // 3. Set result into output canvas
    WebDNN.Image.setImageArrayToCanvas(
      _outputView, _width, _height,
      _canvas, {
        color: WebDNN.Image.Color.RGB,
        order: WebDNN.Image.Order.CHW
      });
  };

  const draw = async () => {
    if (!_running) {
      clear();
      return;
    }

    if (!_runner || _modelPath !== _newModelPath) {
      _modelPath = _newModelPath;
      _runner = await WebDNN.load(_modelPath);
      _inputView = _runner.inputs[0].toActual();
      _outputView = _runner.outputs[0].toActual();
    }

    if (!_canvas.width ||
      _canvas.width !== _video.videoWidth) {
      _canvas.width = _video.videoWidth;
      _canvas.height = _video.videoHeight;
    }

    await transfer();

    requestAnimationFrame(() => draw());
  };

  const toggle = () => {
    _running = !_running;
    if (_running) {
      _video.style.display = 'none';
      draw();
    }
  }

  _player.style = {
    toggle,
    model({
      path
    }) {
      _newModelPath = path;
    }
  };

  // add button to control bar that calls toggle()
  const Button = videojs.getComponent('Button');

  class StyleToggle extends Button {
    handleClick(event) {
      if (this.player_.style) this.player_.style.toggle();
    }
    buildCSSClass() {
      return `vjs-icon-circle-outline ${super.buildCSSClass()}`;
    }
  }

  videojs.registerComponent('StyleToggle', StyleToggle);
  _player.controlBar.addChild('StyleToggle', {},
    _player.controlBar.children_.length - 2);
};

videojs.registerPlugin('style', style);