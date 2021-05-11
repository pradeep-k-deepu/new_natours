const User = require('./../model/userModel');
const handleFactory = require('./handleFactory');

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.getAllUsers = handleFactory.getAll(User);
exports.getUser = handleFactory.getOne(User);
exports.createUser = handleFactory.createOne(User);
exports.updateUser = handleFactory.updateOne(User);
exports.deleteUser = handleFactory.deleteOne(User);
