const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config()

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err)=>{
  if(err){
    console.log(err)
  }else{
    console.log("db connected")
  }
});

const userSchema = new mongoose.Schema({
  username: String,
  log: [{}]
});
const users = mongoose.model("users", userSchema); 

const urlEncodedParser = bodyParser.urlencoded({extended: false});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/exercise/new-user", urlEncodedParser, (req, res)=>{
  users.create({username: req.body.username}, (err, data)=>{
    if(err){
      console.log(err)
    }else{
      res.json(data)
    }
  });
})

app.get("/api/exercise/users", (req, res)=>{
  users.find({}, (err, data)=>{
    if(err){
      console.log(err)
    }else{
      res.json(data.map(user=>{
        return {_id: user._id, username: user.username};
      }));
    }
  })
})

app.post("/api/exercise/add", urlEncodedParser, (req, res)=>{
  users.findById(req.body.userId, (err, data)=>{
    if(err){
      console.log(err)
    }else{
      var log_entry = {"description": req.body.description, "duration": parseInt(req.body.duration)};
      log_entry['date']=("date" in req.body)?new Date(req.body.date).toString().slice(0,15):new Date().toString().slice(0,15);
      data.log.push(log_entry);
      data.save((err, data)=>{
        if(err){
          console.log(err)
        }else{
          res.json({
            username: data.username,
            _id: data._id,
            ...log_entry
          });
        }
      });
      
    }
  })
})

app.get("/api/exercise/log", (req, res)=>{
  users.findOne({_id: req.query.userId}, (err, data)=>{
    if(err){
      console.log(err)
    }else{
      if(req.query.from || req.query.to){
        var frm = new Date(0);
        var to = new Date();

        if(req.query.from){
          frm = new Date(req.query.from)
        };
        if(req.query.to){
          to = new Date(req.query.to)
        }

        frm=frm.getTime();
        to=to.getTime();

        data.log=data.log.filter(entry=>{
          let logged=new Date(entry.date).getTime();
          console.log(logged>=frm && logged<=to)
          return (logged>=frm && logged<=to);
        });
      }
      if(req.query.limit){
        data.log=data.log.slice(0, req.query.limit)
      };
      res.json({_id: data._id, username: data.username, log: data.log, count: data.log.length})
    }
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})