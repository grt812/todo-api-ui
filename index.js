const endpoint = "https://todo.hackrpi.com";
const addListElement = document.getElementById("add-list");


addListElement.addEventListener("click", function(){
    addList();
});

const listContainerElement = document.getElementById('list-container');
const newListInputElement = document.getElementById('new-list-input');

//Get all items from server
async function fetchLists() {
    try {
        const response = await fetch(endpoint+'/GetLists', {headers:{"authorization":"4b07c4ccaf003eb706298571326bda19"}});
        const lists = await response.json();
        renderLists(lists);
    } catch (error) {
        console.error('Error fetching lists:', error);
    }
}

//Modifies DOM and sends post request
async function addList() {
    const title = newListInputElement.value.trim();
    if (title) {
        try {
            const response = await fetch(endpoint+'/AddList', {
                method: 'POST',
                headers:{"authorization":"4b07c4ccaf003eb706298571326bda19"},
                body: {
                    listName: title
                },
            });
            const newList = await response.json();
            renderList(newList);
            newListInputElement.value = '';
        } catch (error) {
            console.error('Error adding list:', error);
        }
    }
}

//Modifies DOM and sends delete request
async function deleteList(listIdParam) {
    try {
    await fetch(`${endpoint}/DeleteList` + new URLSearchParams({
        listId: listIdParam,
    }), {
        method: 'DELETE',
    });
    const listElement = document.getElementById(`list-${listIdParam}`);
    listContainerElement.removeChild(listElement);
    } catch (error) {
    console.error('Error deleting list:', error);
    }
}


//Only renders each list
function renderLists(lists) {
    listContainerElement.innerHTML = '';
    lists.forEach(renderList);
}

const listHTML = `
<div class="list">
    <h2 class="list-header"></h2>
    <input type="text">
    <button>Add</button>
    <button>Delete List</button>
    <div class="item-list"></div>
</div>
`;

//Renders list
function renderList(list) {
    let tempHTML = `
    <div id="list-${list.id}" class="list">
        <h2 class="list-header">${list.title}</h2>
        <input type="text">
        <button>Add</button>
        <button id="delete-list-${list.id}">Delete List</button>
        <div class="item-list"></div>
    </div>
    `;

    document.getElementById("list-container").insertAdjacentHTML("beforeend", tempHTML);
    document.getElementById(`delete-list-${list.id}`).onclick = () => deleteList(list.id);

    list.tasks.forEach(task => {
        createTaskElement(task, list.id);
    });

}

//Only renders
function createTaskElement(task, listId) {
    let tempHTML = `
    <div id="task-${task.id}" class="item ${task.completed ? "completed":""}">
        <input type="text" value=${task.description}>
        <button id="delete-${task.id}">Delete Item</button>
        <label>
            <input id="checkbox-${task.id}" type="checkbox" ${task.completed ? "checked":""}>
        </label>
    </div>
    `;

    document.getElementById("list-container").insertAdjacentHTML("beforeend", tempHTML);
    
    document.getElementById(`checkbox-${task.id}`).onclick = () => updateTask(listId, task.id, !task.completed);
    document.getElementById(`delete-${task.id}`).onclick = () => deleteTask(listId, task.id);

}

async function addTask(listIdParam) {
    const taskInput = document.getElementById(`newTaskInput-${listId}`);
    const description = taskInput.value.trim();
    if (description) {
        try {
            const response = await fetch(`${endpoint}/AddListItem/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                listId: listIdParam,
                itemName: taskInput.value
            },
            });
            const newTask = await response.json();
            // const listElement = document.getElementById(`list-${listId}`);
            // const taskList = listElement.querySelector('ul');
            createTaskElement(newTask, listId);
            taskInput.value = '';
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }
}

async function updateTask(listId, taskId, completed) {
    try {
        await fetch(`${endpoint}/${listId}/tasks/${taskId}`, {
            method: 'PUT',
            headers:{"authorization":"4b07c4ccaf003eb706298571326bda19"},
            body: JSON.stringify({ completed }),
        });
        const taskElement = document.getElementById(`task-${taskId}`);
        taskElement.classList.toggle('completed', completed);
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(listId, taskId) {
    try {
    await fetch(`/api/lists/${listId}/tasks/${taskId}`, {
        method: 'DELETE',
    });
    const taskElement = document.getElementById(`task-${taskId}`);
    const listElement = document.getElementById(`list-${listId}`);
    const taskList = listElement.querySelector('.item-list');
    taskList.remove(taskElement);
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

fetchLists();