'use strict';

const mongoose = require('mongoose');
const Category = require('./Category');

const transactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
