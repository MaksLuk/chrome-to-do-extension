async function get_data() {
    let data = await chrome.storage.local.get(['data']).then((result) => { return result.data; });
    return data;
}

async function set_data(data) {
    await chrome.storage.local.set({ data: data });
}

async function get_max_page_id() {
    let data = await chrome.storage.local.get(['data']).then((result) => { 
        let max_id = 0;
        if (data && data[0]) {
            result.data.forEach(item => {
                if (item['id'] > max_id) {
                    max_id = item['id'];
                }
            });
        }
        return max_id + 1;
    });
    return data;
}

async function is_task_name_free(page_id, task_name) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            for (let task of page['tasks']) {
                if (task['header'] == task_name)
                    return false;
            }
        }
    }
    return true;
}

async function is_list_name_free(name, old_name) {
    let data = await get_data();
    for (let page of data) {
        if (page['name'] != old_name && page['name'] == name) {
            return false;
        }
    }
    return true;
}

async function add_task_to_storage(page_id, header, desc, date, time, priority) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            page['tasks'].push({ header, desc, date, time, priority, completed: false });
            await set_data(data);
            return;
        }
    }
}

async function change_task_data_in_storage(page_id, old_name, header, desc, date, time, priority) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            for (let task of page['tasks']) {
                if (task['header'] === old_name) {
                    task['header'] = header;
                    task['desc'] = desc;
                    task['date'] = date;
                    task['time'] = time;
                    task['priority'] = priority;
                    await set_data(data);
                    return;
                }
            }
        }
    }
}

async function add_page_to_storage(page_id, page_name) {
    let data = await get_data();
    if (!data) data = [];
    data.push({id: page_id, name: page_name, tasks: []})
    await set_data(data);
}

async function rename_page_in_storage(page_id, page_name) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            page['name'] = page_name;
            await set_data(data);
            return;
        }
    }
}

async function remove_task_from_storage(page_id, task_name) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            page['tasks'] = page['tasks'].filter(item => item.header !== task_name);
            await set_data(data);
            return;
        }
    }
}

async function remove_completed_tasks_from_storage(page_id) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            page['tasks'] = page['tasks'].filter(item => item.completed == false);
            await set_data(data);
            return;
        }
    }
}

async function remove_tasklist_from_storage(page_id) {
    let data = await get_data();
    data = data.filter(item => item.id != page_id);
    await set_data(data);
}

async function change_task_status_in_storage(page_id, task_name) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            for (let task of page['tasks']) {
                if (task['header'] == task_name) {
                    task['completed'] = !task['completed'];
                    await set_data(data);
                    return;
                }
            }
        }
    }
}

async function get_task_data_from_storage(page_id, task_name) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            for (let task of page['tasks']) {
                if (task['header'] == task_name)
                    return task;
            }
        }
    }
    return false;
}

async function remove_all_tasks_from_storage(page_id) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            page['tasks'] = [];
            await set_data(data);
            return;
        }
    }
}

async function change_bage_text() {
    let data = await get_data();
    let count = 0;
    for (let page of data) {
        for (let task of page['tasks']) {
            if (!task.completed) count += 1;
        }
    }
    if (count == 0) count = '';
    chrome.action.setBadgeText({text: ''+count});
}

async function moveElement(page_id, firstName, secondName) {
    let data = await get_data();
    for (let page of data) {
        if (page['id'] == page_id) {
            const firstIndex = page['tasks'].findIndex(item => item.header === secondName);
            let secondIndex = page['tasks'].findIndex(item => item.header === firstName);
            const [elementToMove] = page['tasks'].splice(firstIndex, 1);
            page['tasks'].splice(secondIndex, 0, elementToMove);
            await set_data(data);
            return;
        }
    }
}

async function get_locale() {
    let data = await chrome.storage.local.get(['locale']).then((result) => { return result.locale; });
    if (!data) {
        data = 'en';
    }
    return data;
}

async function set_locale(locale) {
    await chrome.storage.local.set({ locale: locale });
}