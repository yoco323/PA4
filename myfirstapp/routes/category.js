const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// GET /category
// Show all categories
router.get('/category', async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.render('category/index', { categories });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

// GET /category/:id
// Show a specific category and its transactions
router.get('/category/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    const transactions = await Transaction.find({ category: category._id }).sort('date');
    res.render('category/show', { category, transactions });
  } catch (error) {
    console.error(error);
    res.redirect('/category');
  }
});

// GET /category/new
// Show form to create a new category
router.get('/category/new', (req, res) => {
    res.render('category/new');
  });
  

  isLoggedIn = (req,res,next) => {
    if (res.locals.loggedIn) {
      next()
    } else {
      res.redirect('/login')
    }
  }

  
  // Group by category page
router.get('/transactions/group-by-category', async (req, res, next) => {
    try {
      const result = await Transaction.aggregate([
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
      ]);
      res.render('group-by-category', { result });
    } catch (err) {
      next(err);
    }
  });

  // POST /category
  // Create a new category
  router.post('/category', async (req, res) => {
    try {
      const category = new Category({ name: req.body.name });
      await category.save();
      res.redirect('/category');
    } catch (error) {
      console.error(error);
      res.render('category/new', { category: req.body, error: 'Error creating category.' });
    }
  });
  
  // GET /category/:id/edit
  // Show form to edit a category
  router.get('/category/:id/edit', async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      res.render('category/edit', { category });
    } catch (error) {
      console.error(error);
      res.redirect(`/category/${req.params.id}`);
    }
  });
  
  // PUT /category/:id
  // Update a category
  router.put('/category/:id', async (req, res) => {
    try {
      const category = await Category.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
      res.redirect(`/category/${category._id}`);
    } catch (error) {
      console.error(error);
      res.render('category/edit', { category: req.body, error: 'Error updating category.' });
    }
  });
  
module.exports = router;
