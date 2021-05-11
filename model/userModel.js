const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'PLEASE TELL US YOUR NAME'],
  },
  email: {
    type: String,
    required: [true, 'PLEASE PROVIDE YOUR EMAIL'],
    unique: true,
    validate: [validator.isEmail, 'PLEASE PROVIDE A VALID EMAIL'],
  },
  photo: String,
  role: {
    type: String,
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'PLEASE PROVIDE A PASSWORD'],
    minlength: [8, 'A PASSWORD MUST BE OF 8 CHARACTERS'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'PLEASE CONFIRM YOUR PASSWORD'],
    //ONLY WORK ON CREATE AND SAVE
    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: 'BOTH THE PASSWORDS SHOULD BE SAME',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//ONLY WORKS ON CREATE AND SAVE
userSchema.pre('save', async function (next) {
  //ONLY RUN THIS FUNCTION IF  PASSWORD IS MODIFIED
  if (!this.isModified('password')) return next();

  //CREATE HASH WITH STRENGTH OF 12
  this.password = await bcrypt.hash(this.password, 12);

  //DELETE THE PASSWORD CONFIRM FIELD
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  //NOTE: SOMETIMES SAVING THE DOCUMENT TO THE DB BECOMES SLOW SO THAT HERE WE MINUS 1000MS (1 SEC)
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/g, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.checkPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    return JWTTimestamp < this.passwordChangedAt / 1000;
  }
  return false;
};

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
