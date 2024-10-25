const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: String,
    imageUrl: String,
    createdUsername: String,
    createdUserEmail: String,
    createdOn: { type: Date, default: Date.now }
  });

  module.exports = mongoose.model('Categories', categorySchema);