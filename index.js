const endpoint = "https://todo.hackrpi.com";
const addListElement = document.getElementById("add-list");
const API_KEY = "2be3095525d52048f21cc456f6b4b584";

addListElement.addEventListener("click", function(){
    addList();
});

const listContainerElement = document.getElementById('list-container');
const newListInputElement = document.getElementById('new-list-input');

//Get all items from server
async function fetchLists() {
    try {
        const response = await fetch(endpoint+'/GetLists', {
            headers:{
                'authorization':API_KEY,
                'Content-Type': 'application/json',
            }
        });
        const lists = await response.json();
        console.log(lists);
        console.log(JSON.stringify(lists));
        await renderLists(lists.lists);
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
                headers:{
                    'authorization':API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    listName: title
                })
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
    await fetch(`${endpoint}/DeleteList?` + new URLSearchParams({
        listId: listIdParam,
    }), {
        method: 'DELETE',
        headers: {
            'authorization':API_KEY,
            'Content-Type': 'application/json',
        }
    });
    const listElement = document.getElementById(`list-${listIdParam}`);
    listElement.remove();
    } catch (error) {
    console.error('Error deleting list:', error);
    }
}


//Only renders each list
async function renderLists(lists) {
    console.log("render lists: "+JSON.stringify(lists));
    listContainerElement.innerHTML = '';
    lists.forEach(async function(e){
        //request items from specific list
        //render list
        console.log("element id: "+e.id);
        const listItems = await getListItems(e.id);
        console.log(listItems);
        renderList({
            id: e.id,
            listName: e.listName,
            items: listItems
        });
    });
}

async function getListItems(listIdParam){
    try {
        let listItems = [];

        const getListResponse = await loopRequest("");

        async function loopRequest(newToken){
            const response = await fetch(`${endpoint}/GetListItems/?` + (newToken !== "" ? new URLSearchParams({
                listId: listIdParam,
                nextToken: newToken
            }) : new URLSearchParams({
                listId: listIdParam
            })), {
                method: 'GET',
                headers: {
                    'authorization':API_KEY,
                    'Content-Type': 'application/json',
                }
            });
            console.log("getting list "+ listIdParam);
            const newItems = await response.json();
            console.log("new items to add: "+ JSON.stringify(newItems));
            listItems = listItems.concat(newItems.listItems);
            console.log("list item iteration: " + JSON.stringify(listItems));

            if (newItems.tempToken && newItems.tempToken !== "NULL" ){
                return loopRequest(newItems.tempToken);
            } else {
                console.log(newItems.tempToken);
                return listItems;
            }
        }

        console.log("list items returned: " + getListResponse);
        
        return getListResponse;
        // const listElement = document.getElementById(`list-${listId}`);
        // const taskList = listElement.querySelector('ul');
    } catch (error) {
        console.error('Error getting list items:', error);
    }
    console.log("Returning null");
    return null;
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
        <h2 class="list-header">${list.listName}</h2>
        <input id="task-input-${list.id}" type="text">
        <button id="add-items-${list.id}">Add</button>
        <button id="delete-list-${list.id}">Delete List</button>
        <div class="item-list"></div>
    </div>
    `;

    document.getElementById("list-container").insertAdjacentHTML("beforeend", tempHTML);
    document.getElementById(`delete-list-${list.id}`).onclick = () => deleteList(list.id);
    document.getElementById(`add-items-${list.id}`).onclick = () => addTask(list.id);

    console.log("current list: " + JSON.stringify(list));
    list.items.forEach(task => {
        console.log("task: ");
        console.log(task);
        createTaskElement(task, list.id);
    });

}

//Only renders
function createTaskElement(task, listId) {
    let tempHTML = `
    <div id="task-${task.id}" class="item ${task.checked ? "completed":""}">
        <input id="input-${task.id}" "type="text" value=${task.itemName}>
        <button id="delete-${task.id}">Delete Item</button>
        <label>
            <input id="checkbox-${task.id}" type="checkbox" ${task.checked ? "checked":""}>
        </label>
    </div>
    `;

    document.getElementById("list-"+listId).querySelector(".item-list").insertAdjacentHTML("beforeend", tempHTML);
    document.getElementById(`checkbox-${task.id}`).onchange = (e) => {
        renameTask(listId, task.id, document.getElementById(`input-${task.id}`).value);
    };
    document.getElementById(`checkbox-${task.id}`).onchange = function(){
        console.log("this value: "+this.value === "on" ? true : false);
        setCheckedTask(listId, task.id, this.value === "on" ? true : false);
    };
    document.getElementById(`delete-${task.id}`).onclick = () => deleteTask(listId, task.id);

}

async function addTask(listIdParam) {
    const taskInput = document.getElementById(`task-input-${listIdParam}`);
    const description = taskInput.value.trim();
    console.log("adding current text: " + description);
    if (description) {
        try {
            const response = await fetch(`${endpoint}/AddListItem/`, {
                method: 'POST',
                headers: {
                    'authorization':API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    listId: listIdParam,
                    itemName: description
                })
            });
            const newTask = await response.json();
            // const listElement = document.getElementById(`list-${listId}`);
            // const taskList = listElement.querySelector('ul');
            createTaskElement(newTask.listItem, listIdParam);
            taskInput.value = '';
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }
}

async function renameTask(listId, thisItemId, newName) {
    try {
        await fetch(`${endpoint}/RenameItem`, {
            method: 'PATCH',
            headers: {
                'authorization':API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId: thisItemId,
                newItemName: newName
            })
        });
        const taskElement = document.getElementById(`task-${taskId}`);
        taskElement.classList.toggle('completed', completed);
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function setCheckedTask(listId, thisItemId, newChecked) {
    try {
        console.log(newChecked);
        await fetch(`${endpoint}/SetChecked`, {
            method: 'PATCH',
            headers:{
                'authorization':API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId: thisItemId,
                checked: newChecked
            })
        });
        const taskElement = document.getElementById(`task-${thisItemId}`);
        taskElement.classList.toggle('completed', newChecked);
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(listIdParam, taskId) {
    try {
        await fetch(`${endpoint}/DeleteListItem/?${new URLSearchParams({
            itemId: taskId,
        })}`, {
            method: 'DELETE',
            headers:{
                'authorization':API_KEY,
                'Content-Type': 'application/json',
            },
        });
        const taskElement = document.getElementById(`task-${taskId}`);
        taskElement.remove();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

fetchLists();