const mongoose = require('mongoose');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A TOUR MUST HAVE A NAME'],
      unique: true,
      minlength: [10, 'A TOUR NAME MUST BE A MINIMUM OF 10 CHARACTERS'],
      maxlength: [30, 'A TOUR NAME HAS A MAXIMUM OF ONLY 30 CHARACTERS'],
    },
    price: {
      type: Number,
      required: [true, 'A TOUR MUST HAVE A PRICE'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A TOUR ONLY HAVE EITHER [EASY  MEDIUM  DIFFICULT] VALUES',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.7,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
    },
    startDates: [Date],
    duration: {
      type: Number,
      required: [true, 'A TOUR MUST HAVE A DURATION'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A TOUR MUST HAVE A GROUP SIZE'],
    },
    summary: {
      type: String,
      required: [true, 'A TOUR MUST HAVE A SUMMARY'],
    },
    description: String,
    imageCover: String,
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//MODELING TOUR GUIDES ON TOURS (EMBEDING)
// tourSchema.pre('save', async function (next) {
//   const guides = this.guides.map(async (el) => await User.findById(el));
//   this.guides = await Promise.all(guides);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-_id -__v' });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
