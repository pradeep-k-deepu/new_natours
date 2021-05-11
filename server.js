const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT REJECTION SHUTTING DOWN... BYE BYE');
  process.exit(1);
});

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

const port = process.env.PORT;
const server = app.listen(port, (req, res) => {
  console.log(`LISTENING TO THE SERVER ON PORT ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION SHUTTING DOWN... BYE BYE');
  server.close(() => {
    process.exit(1);
  });
});
