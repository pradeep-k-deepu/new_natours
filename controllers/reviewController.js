const catchAsync = require('./../utils/catchAsync');
const Review = require('../model/reviewModel');
const handleFactory = require('./handleFactory');

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getAllReviews = handleFactory.getAll(Review);
exports.createReview = handleFactory.createOne(Review);
exports.getReview = handleFactory.getOne(Review);
exports.updateReview = handleFactory.updateOne(Review);
exports.deleteReview = handleFactory.deleteOne(Review);
