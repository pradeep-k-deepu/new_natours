const AppError = require('./../utils/appError');

const sendErrDev = (res, err) => {
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    name: err.name,
    error: err,
    stack: err.stack,
  });
};

const sendErrprod = (res, err) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    return res.status(500).json({
      status: 'error',
      message: 'something went very wrong',
    });
  }
};

const handleCastError = (err) => {
  const { path, value } = err;
  const message = `invalid ${path} : ${value}`;
  return new AppError(message, 404);
};

const handleMongoError = (err) => {
  const name = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/g);
  const message = `duplicate tour name ${name}... please use another name`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const message = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('INVALID TOKEN... PLEASE LOGIN AGAIN', 401);
};

const handleTokenExpiredError = () => {
  return new AppError('TOKEN EXPIRED... PLEASE LOGIN AGAIN', 400);
};
module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(res, err);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastError(err);
    if (err.name === 'MongoError') err = handleMongoError(err);
    if (err.name === 'ValidationError') err = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleTokenExpiredError();
    sendErrprod(res, err);
  }
};
