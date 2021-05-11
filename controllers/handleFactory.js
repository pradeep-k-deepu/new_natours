const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const ApiFeatures = require('./../utils/apiFeatures');

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    if (!doc) {
      return next(new AppError('no doc found with that id', 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('no doc found with that id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('no doc found with that id', 404));
    }
    res.status(204).json({
      status: 'success',
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let doc;
    if (popOptions) {
      doc = await Model.findById(req.params.id).populate(popOptions);
    } else {
      doc = await Model.findById(req.params.id);
    }

    if (!doc) {
      return next(new AppError('no doc found with that id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

// exports.getAll = (Model) =>
//   catchAsync(async (req, res, next) => {
//     console.log(await User.find());
//     const features = new ApiFeatures(User.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .pagination();
//     const docs = await features.query;
//     console.log(docs);
//     res.status(200).json({
//       status: 'success',
//       data: {
//         results: docs.length,
//         docs,
//       },
//     });
//   });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) {
      filter.tour = req.params.tourId;
    }
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const docs = await features.query;
    res.status(200).json({
      status: 'success',
      data: {
        results: docs.length,
        docs,
      },
    });
  });
