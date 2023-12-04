const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var bodyParser = require("body-parser");
const mongoose = require('mongoose');
const dns = require('dns');


// Connect and setup Database with mongoose
const mongodbURI = process.env['databaseURI'];
mongoose.connect(mongodbURI);
var userSchema = new mongoose.Schema({
    username: String,
  _id: String
});
var exerciseSchema = new mongoose.Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
});
var userDocument = mongoose.model('User', userSchema);
var exerciseDocument = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/users', async function(req, res) {
  let users = await userDocument.find();
  res.json(users);
});

app.post('/api/users', async function(req, res) {
  console.log(req.body);
  var username = req.body.username;
  var id = new mongoose.Types.ObjectId();
  var user = new userDocument({
    username: username,
    _id: id
  });
  await user.save();
  res.json(user);
  console.log("user saved to db: " + user);
});

app.post('/api/users/:_id/exercises', async function(req, res) {
  var id = req.params._id;
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date;
  var user = await userDocument.findOne({_id: id}).exec();
  var exercise = new exerciseDocument({
    user_id: user._id,
    description: description,
    duration: duration,
    date: date ? new Date(date) : new Date(),
  });
  let savedExercise = await exercise.save();
  //let exerciseResponse = ;
  res.json({
            _id: user._id,
            username: user.username,
            description: savedExercise.description,
            duration: savedExercise.duration,
            date: new Date(savedExercise.date).toDateString()
          });
  console.log("exercise saved to db: " + savedExercise);
});

app.get('/api/users/:_id/logs', async function(req, res) {
  let {from, to, limit} = req.query;
  let id = req.params._id;
  let user = await userDocument.findOne({_id: id}).exec();
  if (!user) {
    res.send("user not found");
    return;
  }
  let dateObject = {};
  if (from) {dateObject["$gte"] = new Date(from)};
  if (to) {dateObject["$lte"] = new Date(to)};
  let filter = {user_id: id};
  if (from || to) {filter.date = dateObject};
  const exercises = await exerciseDocument.find(filter).limit(limit).exec();
  let log = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  }));
  let logResponse = {
      username: user.username,
      count: exercises.length,
      _id: id,
      log: log
    };
  console.log(logResponse);
  res.json(logResponse);
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
