const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A TOUR MUST HAVE A RATING'],
    },
    rating: {
      type: Number,
      required: [true, 'A TOUR MUST HAVE A RATING'],
      min: [1, 'A TOUR MUST HAVE MINIMUM OF 1 RATING'],
      max: [5, 'A TOUR MUST HAVE MAXIMUM OF 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calculateAverage = async function (tourId) {
  const average = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        ratingsAverage: { $avg: '$rating' },
      },
    },
  ]);

  if (average.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: average[0].ratingsAverage,
      ratingsQuantity: average[0].nRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.7,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calculateAverage(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  console.log(this.r);
  await this.r.constructor.calculateAverage(this.r.tour);
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
