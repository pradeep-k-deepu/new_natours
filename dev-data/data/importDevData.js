const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../../model/tourModel');
const User = require('./../../model/userModel');
const Review = require('./../../model/reviewModel');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DATABASE CONNECTION IS SUCCESSFULL');
  });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const importData = async () => {
  await Tour.create(tours);
  await User.create(users);
  await Review.create(reviews);
  console.log('DATA IMPORTED SUCCESSFULLY');
  process.exit();
};

const deleteData = async () => {
  await Tour.deleteMany();
  await User.deleteMany();
  await Review.deleteMany();
  console.log('DATA DELETED SUCCESSFULLY');
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
}
if (process.argv[2] === '--delete') {
  deleteData();
}
