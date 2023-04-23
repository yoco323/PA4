const express = require('express');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const router = express.Router();

const isLoggedIn = (req,res,next) => {
    if (res.locals.loggedIn) {
      next()
    } else {
      res.redirect('/login')
    }
  }

router.get('/transactions/groupedByCategory', isLoggedIn, async (req, res, next) => {
  try {
    const transactions = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.render('transactionsByCategory', { user: req.user, transactionsByCategory: transactions });
  } catch (err) {
    next(err);
  }
});

// Main transactions list page
router.get('/transactions/', isLoggedIn, async (req, res, next) => {
  try {
    const { sortBy } = req.query;
    let transactions;

    // Fetch transactions and populate the 'category' field
    const unsortedTransactions = await Transaction.find({ userId: req.user._id }).populate('category');

    // Sort transactions in memory
    transactions = unsortedTransactions.sort((a, b) => {
      switch (sortBy) {
        case 'category':
          return a.category.name.localeCompare(b.category.name);
        case 'amount':
          return a.amount - b.amount;
        case 'description':
          return a.description.localeCompare(b.description);
        case 'date':
        default:
          return new Date(a.date) - new Date(b.date);
      }
    });
    const categories = await Category.find(); // Fetch categories using the Category model
    res.render('transactions', { user: req.user, transactions, categories, sortBy });
  } catch (err) {
    next(err);
  }
});

router.post('/transactions', isLoggedIn, async (req, res, next) => {
  try {
    const newTransactionData = {
      date: req.body.date,
      description: req.body.description,
      amount: req.body.amount,
      userId: req.user._id, // Change this line from "user" to "userId"
    };    

    if (req.body['new-category']) {
      const newCategory = new Category({ name: req.body['new-category'] });
      await newCategory.save();
      newTransactionData.category = newCategory._id; // Save the ID of the new category
    } else {
      // Check if the category is an empty string, set it to null
      newTransactionData.category = req.body['selected-category'] === "" ? null : req.body['selected-category'];
    }

    const newTransaction = new Transaction(newTransactionData);
    await newTransaction.save();
    res.redirect('/transactions');
  } catch (err) {
    next(err);
  }
});

// Delete transaction
router.delete('/transactions/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Transaction.findByIdAndDelete(id);
    res.redirect('/transactions'); // Redirect back to the transactions page
  } catch (err) {
    next(err);
  }
});


// Edit transaction (render form)
router.get('/transactions/:id/edit', 
    isLoggedIn,
    async (req, res, next) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id);
        const categories = await Category.find().sort('name'); // Fetch categories using the Category model
        res.render('edit-transaction', { transaction, id, categories }); // Pass categories to the view
    } catch (err) {
        next(err);
    }
});

// Edit transaction (submit form)
router.put('/transactions/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
        throw new Error('Transaction not found');
    }

    const updates = {
        date: req.body.date,
        description: req.body.description,
        amount: req.body.amount,
    };

    if (req.body['new-category']) {
        const newCategory = new Category({ name: req.body['new-category'] });
        await newCategory.save();
        updates.category = newCategory._id; // Save the ID of the new category
    } else {
        // Check if the category is an empty string, set it to null
        updates.category = req.body.category === "" ? null : req.body.category;
    }

    await Transaction.findByIdAndUpdate(id, updates);
    res.redirect('/transactions');
  } catch (err) {
    next(err);
  }
});


module.exports = router;
