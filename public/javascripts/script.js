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

    let alertBox = document.getElementById("alert_message");

    if (taskName === ""){
        alertBox.innerHTML = "Please enter a task name.";
        taskNameInput.focus();
        return;
    } else {
        alertBox.innerHTML = "";
        
        // push new task to server
        let task = new Task(taskName, taskType, taskPriority);
        console.log("Input", task);
        $.ajax({url: "/addTask", method: "PUT", data: JSON.stringify(task), contentType: "application/json; charset=utf-8"})
            .done(function(data, textStatus, jqXHR) {
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
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                alertBox.innerHTML = "Uh oh, server responded with an error " + jqXHR.status;
                taskNameInput.focus();
            });
    }
}

function deleteDoneTasks() {
    $.ajax({ url: "/deleteDoneTasks", method: "DELETE"})
        .done(function(data, textStatus, jqXHR) {
            displayTasks();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            alert("Uh oh, server responded with an error " + jqXHR.status);
        })
}

function displayTasks() {
    let table = document.getElementById("table");
    let getStartedBtn = document.getElementById("getStartedBtn2");
    let deleteDoneBtn = document.getElementById("deleteDoneTasksBtn");

    $.get("/getTasks")
        .done(function(data, textStatus, jqXHR) {
            let tasks = data;

            if (tasks.length > 0) {
                // create table, hide get started button, show delete done task button
                let processedTaskList = processTaskList(tasks);
                createTaskTable(table, processedTaskList);
                getStartedBtn.style = "display: none";
                deleteDoneBtn.style = "display: block";
            } else { // empty task list
                // replace table with empty message, show get started button, hide delete done task button
                table.innerHTML = "Uh oh, you don't have anything in your task list yet. Try adding one";
                getStartedBtn.style = "display: block";
                deleteDoneBtn.style = "display: none";
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            table.innerHTML = "Uh oh, server responded with an error " + jqXHR.status;
            getStartedBtn.style = "display: block";
            deleteDoneBtn.style = "display: none";
        });
}

function displayProperties() {
    let displayWindow = document.getElementById("propertyDisplay");
    displayWindow.innerHTML = "";

    $.get("/getTask/" + selectedTaskId)
        .done(function (data, textStatus, jqXHR) {
            let displayedTask = data;
            displayWindow.appendChild(Table.generateHeaderRow(["Property", "Value"]));
            displayWindow.appendChild(Table.generateSimpleTextRow(["Task Name", displayedTask.name]));
            displayWindow.appendChild(Table.generateSimpleTextRow(["Task Type", displayedTask.type]));
            displayWindow.appendChild(Table.generateSimpleTextRow(["Task Priority", displayedTask.priority]));
            displayWindow.appendChild(Table.generateSimpleTextRow(["Task Complete", displayedTask.done]));
            displayWindow.appendChild(Table.generateSimpleTextRow(["Internal ID", displayedTask.uuid]));
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            displayWindow.innerHTML = "Something went wrong";
            console.log("Could not find task of id: " + selectedTaskId);
        });
}

function processTaskList(tasks) {
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
        console.log("change fired");
        $.ajax({ url: "/updateTaskDone", method: "POST", data: JSON.stringify({ ID: task.uuid, done: task.done }), contentType: "application/json; charset=utf-8"})
            .done(function() {
                displayTasks();
            });
    });
    doneCell.appendChild(doneCheckbox);
    row.appendChild(doneCell);

    return row;
}

function createTaskTable(table, processedTaskList) {
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