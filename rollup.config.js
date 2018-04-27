export default {
  input: 'src/index.js',
  output: {
    file: 'dist/videojs-webdnn.js',
    format: 'iife',
    globals: {
        'video.js': 'videojs'
    }
  }
};