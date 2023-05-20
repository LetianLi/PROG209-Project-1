let tasks = [];
let selectedTaskId = undefined;

let Task = function(taskName, taskType, taskPriority) {
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

// prepush tasks
tasks.push(new Task("Apply for social security", "Life", "High"));
tasks.push(new Task("Buy groceries", "Life", "Low"));
tasks.push(new Task("Talk to coworker", "Work", "Low"));
tasks.push(new Task("Complain about pay", "Work", "Low"));
tasks.push(new Task("Check for response from support ticket", "Work", "High"));
tasks.push(new Task("Do Homework", "School", "Medium"));
tasks.push(new Task("Review class notes", "School", "Medium"));

document.addEventListener("DOMContentLoaded", function (event) {
    // functional buttons
    document.getElementById("addTaskBtn").addEventListener("click", createArrayObj);
    document.getElementById("deleteDoneTasksBtn").addEventListener("click", deleteDoneTasks);

    // redirect buttons
    document.getElementById("getStartedBtn").addEventListener("click", () => window.location = "#AddPage");
    document.getElementById("getStartedBtn2").addEventListener("click", () => window.location = "#AddPage");
    document.getElementById("returnToListBtn").addEventListener("click", () => window.location = "#DisplayPage");

    // regenerate table whenever sort/filter settings change
    let regenDisplayElements = Array.from(document.getElementsByClassName("regenDisplay"));
    regenDisplayElements.forEach(element => element.addEventListener("change", displayTasks));
});

$(document).on("pagebeforeshow", "#DisplayPage", function (event) { 
    displayTasks();
});

$(document).on("pagebeforeshow", "#PropertyPage", function (event) { 
    displayProperties();
});

function createArrayObj() {
    let taskNameInput = document.getElementById("taskNameInput");

    let taskName = document.getElementById("taskNameInput").value;
    let taskType = document.getElementById("taskTypeInput").value;
    let taskPriority = document.getElementById("taskPriorityInput").value;

    if (taskName === ""){
        document.getElementById("alert_message").innerHTML = "Please enter a task name.";
        taskNameInput.focus();
        return;
    } else {
        document.getElementById("alert_message").innerHTML = "";
        
        // push to task array
        let task = new Task(taskName, taskType, taskPriority);
        tasks.push(task);

        // display success message
        let successMessage = document.getElementById("successMessage");
        successMessage.innerHTML = "Task added successfully!";
        // timeout sucess message (2.0 seconds)
        setTimeout(() => {
            successMessage.innerHTML = '';  
        }, 2000);

        // empty name box and put focus in name box
        taskNameInput.value = "";
        taskNameInput.focus();
    }
}

function displayProperties() {
    let displayWindow = document.getElementById("propertyDisplay");
    displayWindow.innerHTML = "";

    let displayedTask = tasks.find(task => task.uuid === selectedTaskId);

    if (displayedTask == undefined) {
        displayWindow.innerHTML = "Something went wrong";
        console.log("Could not find task of id: " + selectedTaskId);
    } else {
        displayWindow.appendChild(Table.generateHeaderRow(["Property", "Value"]));
        displayWindow.appendChild(Table.generateSimpleTextRow(["Task Name", displayedTask.name]));
        displayWindow.appendChild(Table.generateSimpleTextRow(["Task Type", displayedTask.type]));
        displayWindow.appendChild(Table.generateSimpleTextRow(["Task Priority", displayedTask.priority]));
        displayWindow.appendChild(Table.generateSimpleTextRow(["Task Complete", displayedTask.done]));
        displayWindow.appendChild(Table.generateSimpleTextRow(["Internal ID", displayedTask.uuid]));
    }
}

function deleteDoneTasks() {
    tasks = tasks.filter(task => !task.done);
    displayTasks();
}

function displayTasks() {
    if (tasks.length > 0) {
        // create table, hide get started button, show delete done task button
        let processedTaskList = processTaskList();
        createTaskTable(processedTaskList);
        document.getElementById("getStartedBtn2").style = "display: none";
        document.getElementById("deleteDoneTasksBtn").style = "display: block";
    } else {
        // replace table with empty message, show get started button, hide delete done task button
        document.getElementById("table").innerHTML = "Uh oh, you don't have anything in your task list yet. Try adding one";
        document.getElementById("getStartedBtn2").style = "display: block";
        document.getElementById("deleteDoneTasksBtn").style = "display: none";
    }
}

function processTaskList() {
    // Filter task list
    let allowedTypes = Array.from(document.getElementsByClassName("filterTypeSetting")).filter(checkbox => checkbox.checked).map(checkedBoxes => checkedBoxes.value);
    let allowedPriorities = Array.from(document.getElementsByClassName("filterPrioritySetting")).filter(checkbox => checkbox.checked).map(checkedBoxes => checkedBoxes.value);
    
    let filteredTasks = tasks.filter(task => {
        // pass checks if nothing in allowed or task is in allowed
        let passesTypeCheck = allowedTypes.length === 0 || allowedTypes.includes(task.type);
        let passesPriorityCheck = allowedPriorities.length === 0 || allowedPriorities.includes(task.priority);

        return passesTypeCheck && passesPriorityCheck;
    });

    // Sort task list
    let sortProperty = document.getElementById("sortSetting").value;
    let sortAscending = document.getElementById("sortAscendingCheckBox").checked;
    let sortedTasks = Array.from(filteredTasks);
    sortedTasks.sort((taskA, taskB) => {
        let propA = taskA[sortProperty];
        let propB = taskB[sortProperty];
        
        let sortValue;
        // compare differently for strings and numbers
        if (typeof propA === "string") {
            sortValue = propA.localeCompare(propB);
        } else if (typeof propA === "number") {
            sortValue = propA - propB;
        }

        return sortValue;
    });

    // Reverse array if descending
    if (!sortAscending) {
        sortedTasks.reverse();
    }

    return sortedTasks;
}

function generateTaskRow(task) {
    // create task row
    let row = document.createElement("tr");

    // task name col
    let nameCell = document.createElement("td"); // td = table data
    nameCell.innerHTML = task.name;
    nameCell.addEventListener("click", () => {
        selectedTaskId = task.uuid;
        window.location = "#PropertyPage";
    });
    row.appendChild(nameCell);

    // task type col
    let typeCell = document.createElement("td");
    typeCell.innerHTML = task.type;
    row.appendChild(typeCell);

    // task priority col
    let priorityCell = document.createElement("td");
    priorityCell.innerHTML = task.priority;
    row.appendChild(priorityCell);

    // task done col and checkbox
    let doneCell = document.createElement("td"); 
    let doneCheckbox = document.createElement("input");
    doneCheckbox.type = "checkbox";
    doneCheckbox.checked = task.done;
    doneCheckbox.addEventListener("change", function(){
        task.done = this.checked;
    });
    doneCell.appendChild(doneCheckbox);
    row.appendChild(doneCell);

    return row;
}

function createTaskTable(processedTaskList) {
    let table = document.getElementById("table");

    // clear table
    table.innerHTML = "";

    // add header row
    let headerRow = Table.generateHeaderRow(["Name", "Type", "Priority", "Done"]);
    table.appendChild(headerRow);

    // set up rows for every task
    processedTaskList.forEach(task => {
        let taskRow = generateTaskRow(task);
        table.appendChild(taskRow);
    });
}