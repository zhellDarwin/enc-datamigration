const inquirer = require("inquirer");
var CryptoJS = require("crypto-js");
const mongoose = require("mongoose");

var questions = [
  {
    type: "input",
    name: "Key",
    message: "Enter Your Key",
  },
  {
    type: "input",
    name: "ConnectionString",
    message: "Enter Your ConnectionString",
  },
  {
    type: "input",
    name: "companyId",
    message: "Enter Your Organization Id",
  },
];

inquirer.prompt(questions).then((answers) => {
  let key = answers.Key;
  let connectionString = answers.ConnectionString;
  count = 0;
  connectToDB(connectionString).then((db) => {
    console.log("connected to db");
    getProjects(answers.companyId).then((projects) => {
      console.log("projects", projects.length);
      projects.forEach((project) => {
        encryptProject(project, key).then((encryptedProject) => {
          count++;
          console.log(`Project ${count} Encrypted`);
          updateProject(project._id, encryptedProject).then(() => {
            console.log(`Project ${count} updated`);
            if (count === projects.length) {
              console.log("Encryption Completed");
            }
          });
        });
      });
    });
  });
});

const connectToDB = async (connectionString) => {
  return await mongoose.connect(connectionString);
};

const getProjects = async (companyId) => {
  return await mongoose.connection.db
    .collection("projects")
    .find({
      companyid: companyId,
    })
    .toArray();
};

const updateProject = async (projectId, project) => {
  return await mongoose.connection.db
    .collection("projects")
    .updateOne({ _id: projectId }, { $set: project });
};

const encryptProject = async (project, key) => {
  project.title = encryptionAES(project.title, key);
  project.details = encryptionAES(project.details, key);
  project.group = project?.group?.map((group) => {
    group.title = encryptionAES(group.title, key);
    group.details = encryptionAES(group.details, key);
    if (group.type === "subproject") {
      group.group = group?.group?.map((task) => {
        task.title = encryptionAES(task.title, key);
        task.details = encryptionAES(task.details, key);
        task.comments = task?.comments?.map((comment) => {
          comment.comment = encryptionAES(comment.comment, key);
          return comment;
        });
        return task;
      });
    } else if (group.type === "task") {
      group.comments = group?.comments?.map((comment) => {
        comment.comment = encryptionAES(comment.comment, key);
        return comment;
      });
    }
    return group;
  });
  return project;
};

const encryptionAES = (msg, key) => {
  if (msg && key) {
    return CryptoJS.AES.encrypt(msg, key).toString();
  } else {
    return msg;
  }
};
