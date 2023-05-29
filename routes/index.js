var express = require("express");
var router = express.Router();
var crypto = require("crypto");
var fs = require("fs");

console.log("server startup");

if (!crypto.randomUUID) {
  throw new Error("crypto.randomUUID() is not available, ensure that (node -v) is at least v15.6.0, switch using (nvm ls, nvm use v16)");
}

let serverTaskList = [];

let Task = function (taskName, taskType, taskPriority) {
  this.name = taskName;
  this.type = taskType;
  this.priority = taskPriority;
  this.done = false;
  this.timeAdded = Date.now();
  this.uuid = crypto.randomUUID();

  // priorityValue is used for sorting
  switch (this.priority) {
    case "High":
      this.priorityValue = 1;
      break;
    case "Medium":
      this.priorityValue = 2;
      break;
    default:
      this.priorityValue = 3;
      break;
  }
}

let fileManager = {
  read: function () {
    var rawdata = fs.readFileSync('taskListFile.json');
    let goodData = JSON.parse(rawdata);
    serverTaskList = goodData;
  },
  write: function () {
    let data = JSON.stringify(serverTaskList);
    fs.writeFileSync('taskListFile.json', data);
  },
  isEmpty: function () {
    var rawdata = fs.readFileSync('taskListFile.json');
    console.log(rawdata.length);
    return rawdata.length < 1;
  }
};

if (fileManager.isEmpty()) {
  serverTaskList.push(new Task("Apply for social security", "Life", "High"));
  serverTaskList.push(new Task("Buy groceries", "Life", "Low"));
  serverTaskList.push(new Task("Talk to coworker", "Work", "Low"));
  serverTaskList.push(new Task("Complain about pay", "Work", "Low"));
  serverTaskList.push(new Task("Check for response from support ticket", "Work", "High"));
  serverTaskList.push(new Task("Do Homework", "School", "Medium"));
  serverTaskList.push(new Task("Review class notes", "School", "Medium"));
  fileManager.write();
}

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/getTasks", function(req, res) {
  fileManager.read();
  res.status(200).json(serverTaskList);
});

router.get("/getTask/:ID", function (req, res) {
  fileManager.read();

  let task = serverTaskList.find(task => task.uuid === req.params.ID);

  if (task == undefined) {
    res.status(500).json({ status: "error - no task found with id " + req.params.ID});
  } else {
    res.status(200).json(task);
  }
});

router.put("/addTask", function(req, res) {
  let newTask = req.body;
  console.log(newTask);
  serverTaskList.push(newTask);
  console.log(serverTaskList);
  fileManager.write();
  res.status(200).json(newTask);
});

router.post("/updateTaskDone", function(req, res) {
  fileManager.read();
  let task = serverTaskList.find(task => task.uuid === req.body.ID);
  
  if (task == undefined) {
    res.status(500).json({ status: "error - no task found with id " + req.body.ID });
  } else {
    task.done = req.body.done;
    fileManager.write();
    res.status(200).json(task);
  }
});

router.delete("/deleteDoneTasks", function(req, res) {
  serverTaskList = serverTaskList.filter(task => !task.done);
  fileManager.write();
  res.status(200).json(serverTaskList);
});

module.exports = router;
