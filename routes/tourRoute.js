const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoute');
const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/top')
  .get(tourController.getCheapTours, tourController.getAllTours);

router.get('/get-tour-stats', tourController.getTourStats);
// router.get('/get-monthly-plan/:year', tourController.getMonthlyPlan);
router
  .route('/get-monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'leadGuide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'leadGuide'),
    tourController.deleteTour
  );

module.exports = router;
