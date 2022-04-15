
const mongoose = require('mongoose');

const canvasSchema = new mongoose.Schema(
  {
    canvas: {
      type: Array,
      default: [],
      required: true
    }
  }
);

module.exports = mongoose.model("Canvas", canvasSchema);