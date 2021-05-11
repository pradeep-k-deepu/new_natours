const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), userController.getAllUsers)
  .post(authController.restrictTo('admin'), userController.createUser);

router.route('/updatemypassword').patch(authController.updatePassword);

router.route('/me').get(userController.getMe, userController.getUser);

router.route('/updateme').patch(authController.updateMe);

router
  .route('/deleteme')
  .patch(authController.protect, authController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
