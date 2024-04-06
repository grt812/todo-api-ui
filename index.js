const endpoint = "https://todo.hackrpi.com";
const addListElement = document.getElementById("add-list");
const listContainerElement = document.getElementById('list-container');
const newListInputElement = document.getElementById('new-list-input');
const API_KEY = "2be3095525d52048f21cc456f6b4b584";

//Get status with /status GET endpoint
async function getStatus() {
    try {
        const response = await fetch(endpoint+'/status', {
            method: 'GET',
            headers: {
                'authorization': API_KEY,
                'Content-Type': 'application/json'
            }
        })
        const status = await response.json();
        document.getElementById("status").innerText = status.message;
    } catch(e){
        console.error('Error getting status:' + e);
    }
}


//Event listeners for menu
addListElement.addEventListener("click", function(){
    addList();
});

newListInputElement.onchange = function(){
    addList();
};


//Get all items from server and run the render function
async function fetchLists() {
    try {
        let lists = [];
        const getListResponse = await loopRequest("");
        async function loopRequest(newToken){
            //Query parameters include the next token if it is available form the previous request
            const response = await fetch(`${endpoint}/GetLists/` + (newToken !== "" ? "?"+new URLSearchParams({
                nextToken: newToken
            }) :""), {
                method: 'GET',
                headers: {
                    'authorization':API_KEY,
                    'Content-Type': 'application/json',
                }
            });
            const newLists = await response.json();
            if(newLists.status == "200"){
                lists = lists.concat(newLists.lists);
            }

            if (newLists.nextToken && newLists.nextToken !== "NULL" ){
                return loopRequest(newLists.nextToken);
            } else {
                return lists;
            }
        };
        await renderLists(getListResponse);
    } catch (error) {
        console.error('Error fetching lists:', error);
    }
}

//Adds list through /AddList POST endpoint
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
            //Render list if successful
            if(newList.status == "200"){
                renderList({
                    id: newList.list.listId,
                    listName: newList.list.listName,
                    items: []
                });
            }
            

            newListInputElement.value = '';
        } catch (error) {
            console.error('Error adding list:', error);
        }
    }
}

//Deletes list through /DeleteList DELETE endpoint
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


//Renders each list given an array of list objects
async function renderLists(lists) {
    //To preserve the sequence of lists, use for loop instead of forEach (which would run functions in parallel)
    let listItems;
    for (const e of lists){
        listItems = await getListItems(e.id);
        renderList({
            id: e.id,
            listName: e.listName,
            items: listItems
        });
    }
    let loadingEl=document.getElementById('loading');
    if(loadingEl!==null) loadingEl.remove();
    
}

//Get all list items using GetListItems GET endpoint until next token is exhausted
async function getListItems(listIdParam){
    try {
        let listItems = [];
        const getListResponse = await loopRequest("");

        async function loopRequest(newToken){
            //Query parameters include the next token if it is available form the previous request
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
            const newItems = await response.json();
            if(newItems.status == "200"){
                listItems = listItems.concat(newItems.listItems);
            }

            if (newItems.nextToken && newItems.nextToken !== "NULL" ){
                return loopRequest(newItems.nextToken);
            } else {
                return listItems;
            }
        }
        
        return getListResponse;
    } catch (error) {
        console.error('Error getting list items:', error);
    }
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
        <input id="task-input-${list.id}" type="text" value="" class="text-input">
        <button id="add-items-${list.id}">Add</button>
        <button id="delete-list-${list.id}">Delete List</button>
        <div class="item-list"></div>
    </div>
    `;

    let loadingEl=document.getElementById('loading');
    if(loadingEl!==null) loadingEl.remove();

    document.getElementById("list-container").insertAdjacentHTML("beforeend", tempHTML);
    document.getElementById(`delete-list-${list.id}`).onclick = () => deleteList(list.id);
    document.getElementById(`add-items-${list.id}`).onclick = () => addTask(list.id);
    document.getElementById(`task-input-${list.id}`).onchange = () => addTask(list.id);
    
    list.items.forEach(task => {
        createTaskElement(task, list.id);
    });

}

//Renders each to-do task
function createTaskElement(task, listId) {
    let tempHTML = `
    <div id="task-${task.id}" class="item${task.checked ? " completed":""}">
        <label class="checkbox-label">
            <input id="checkbox-${task.id}" type="checkbox" ${task.checked ? "checked":""}>
            <div class="checkbox-display"></div>
        </label>
        <input id="input-${task.id}" "type="text" value="${task.itemName}" class="text-input task-input">
        <button id="delete-${task.id}">Delete Item</button>
    </div>
    `;

    document.getElementById("list-"+listId).querySelector(".item-list").insertAdjacentHTML("beforebegin", tempHTML);
    document.getElementById(`input-${task.id}`).onchange = (e) => {
        renameTask(task.id, document.getElementById(`input-${task.id}`).value);
    };
    document.getElementById(`checkbox-${task.id}`).onchange = function(e){
        document.getElementById(`task-${task.id}`).classList.toggle('completed', e.target.checked);
        setCheckedTask(task.id, e.target.checked);
    };
    document.getElementById(`delete-${task.id}`).onclick = () => deleteTask(task.id);

}

//Adds task through /AddListItem post endpoint
async function addTask(listIdParam) {
    const taskInput = document.getElementById(`task-input-${listIdParam}`);
    const description = taskInput.value.trim();
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
            createTaskElement(newTask.listItem, listIdParam);
            taskInput.value = '';
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }
}

//Rename task through /RenameItem/ PATCH endpoint
async function renameTask(thisItemId, newName) {
    try {
        await fetch(`${endpoint}/RenameItem/?${new URLSearchParams({
            itemId: thisItemId,
            newItemName: newName
        })}`, {
            method: 'PATCH',
            headers: {
                'authorization':API_KEY,
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

//Set checked task through /SetChecked/ PATCH endpoint
async function setCheckedTask(thisItemId, newChecked) {
    try {
        const response = await fetch(`${endpoint}/SetChecked/?${new URLSearchParams({
            itemId: thisItemId,
            checked: newChecked
        })}`, {
            method: 'PATCH',
            headers:{
                'authorization':API_KEY,
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

//Deletes task through /DeleteListItem/ DELETE endpoint
async function deleteTask(taskId) {
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
getStatus();