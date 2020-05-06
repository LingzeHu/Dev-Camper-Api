const express = require('express');
const { 
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview
} = require('../controller/review');

const Review = require('../models/Review');

const router = express.Router({mergeParams: true});

const avdancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(avdancedResults(Review, {
        path: 'bootcamp',
        select: 'name description'
    }),
    getReviews)
    .post(protect, authorize('user', 'admin'), addReview);

router
    .route('/:id')
    .get(getReview)
    .put(protect, authorize('admin', 'user'), updateReview)
    .delete(protect, authorize('admin', 'user'), deleteReview);

module.exports = router;