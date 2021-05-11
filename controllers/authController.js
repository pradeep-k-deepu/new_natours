const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../model/userModel');
const sendMail = require('../utils/mail');

const sendToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    // expiresIn: process.env.JWT_EXPIRES_IN,
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (res, statusCode, user) => {
  const token = sendToken(user._id);

  //STORE TOKEN IN A COOKIE
  let cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  res.cookie('jwt', token, cookieOptions);

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //HIDING THE PASSWORD DATA
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const filterObj = (obj, ...fields) => {
  let newObj = {};
  fields.forEach((el) => {
    if (obj[el]) newObj[el] = obj[el];
  });
  return newObj;
};

exports.signUp = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  const token = sendToken(user._id);

  createSendToken(res, 201, user);
});

exports.logIn = catchAsync(async (req, res, next) => {
  //1. CHECK EMAIL AND PASSWORD EXIST
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('PLEASE PROVIDE EMAIL OR PASSWORD', 400));
  }
  //2. CHECK IF USER EXISTS BASED ON THE POSTED EMAIL, AND PASSWORD IS CORRECT
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('INVALID EMAIL OR PASSWORD', 401));
  }
  //3.IF EVERYTHING IS OK, THEN SEND TOKEN TO THE CLIENT
  createSendToken(res, 200, user);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1.GETTING TOKEN AND CHECK IT'S THERE OR NOT
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('YOU ARE NOT LOGGED IN...PLEASE LOGIN TO GET ACCESS', 401)
    );
  }

  //2. VERIFY TOKEN
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //3. CHECK IF USER STILL EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('THE USER BELONGING TO THIS TOKEN IS NO LONGER EXIST', '404')
    );
  }

  //4. CHECK IF THE USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        'THE USER HAS RECENTLY CHANGED HIS PASSWORD... PLEASE LOGIN AGAIN',
        401
      )
    );
  }

  //GRANT ACCESS
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('YOU ARE NOT ALLOWED TO PERFORM THIS ACTION', 401)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. GET USER BASED ON THE POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('NO USER FOUND WITH THAT EMAIL ID', 404));
  }

  //2. GENERATE RANDOM PASSWORD RESET TOKEN
  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  //3. SEND IT TO MAIL
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`;

  try {
    await sendMail({
      email: user.email,
      subject: 'PASSWORD RESET TOKEN (VALID FOR 10 MIN)',
      message: `FORGOT YOUR PASSWORD... PLEASE DO PATCH REQUEST TO THIS URL ${resetUrl}... IF U DONT FORGOT YOUR PASSWORD ...PLEASE IGNORE THIS MESSAGE...`,
    });
    res.status(200).json({
      status: 'success',
      message: 'TOKEN SENT TO MAIL',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'THERE WAS AN ERROR SENDING THE MAIL...PLEASE TRY AGAIN',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. GET THE USER WITH THE TOKEN
  const { token } = req.params;

  //2. CHECK USER EXISTS AND TOKEN IS EXPIRED OR NOT
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('THE TOKEN WAS INVALID OR EXPIRED', 401));
  }

  //3. RESET THE PASSWORD AND UPDATE PASSWORD CHANGED AT PROPERTY
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //4. SEND TOKEN TO CLIENT (LOGIN)
  createSendToken(res, 200, user);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. GET THE USER FROM CURRENT LOGED IN USER ID
  const user = await User.findById(req.user._id).select('+password');

  //2. CHECK THE CURRENT PASSWORD ENTERED IS CORRECT
  if (!(await user.checkPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('CURRENT PASSWORD WAS INVALID', 401));
  }

  //3. IF SO, THEN UPDATE THE PASSWORD AND SEND TOKEN TO THE CLIENT
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(res, 200, user);
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. GET THE USER FROM THE CURRENT USER LOGED IN ID
  const user = await User.findById(req.user._id);
  //2. FILTER OUT FOR PASSWORD FIELD
  if (req.body.password) {
    return next(
      new AppError(
        'IF U UPDATE YOUR PASSWORD PLEASE USE /updatemypassword Route'
      ),
      400
    );
  }

  //3. UPDATE DATA
  const filteredObj = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(user._id, filteredObj, {
    new: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
