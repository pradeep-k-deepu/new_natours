const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRoute');
const AppError = require('./utils/appError');
const globalErrorController = require('./controllers/globalErrorController');
const app = express();

//GLOBAL MIDDLEWARES

//SETTING SECURE HTTP HEADERS
app.use(helmet());

//SERVING STATIC FILES
app.use(express.static(`${__dirname}/public`));

//BODY PARSER
app.use(express.json());

//DATA SANITIZATION AGAINST NOSQL QUERY INJECTION
app.use(mongoSanitize());

//DATA SANITIZATION AGAINST XSS
app.use(xss());

//PREVENTING PARAMETER POLLUTION
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'price',
      'difficulty',
    ],
  })
);

//DEFINING THE API RATE LIMIT
const rateLimiter = rateLimit({
  windowMs: process.env.API_RATE_LIMIT * 60 * 1000,
  max: 100,
  message: 'TOO MANY REQUEST FROM THIS IP... PLEASE TRY AFTER AN HOUR',
});

app.use(rateLimiter);

//MOUNTING THE ROUTERS
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`canot get ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorController);

module.exports = app;
