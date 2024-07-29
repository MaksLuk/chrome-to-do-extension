const main_block = document.getElementsByTagName('main')[0];                // основной блок main sections
const add_new_list_button = document.getElementById('new-list-btn');        // кнопка добавления новой страницы
const delete_task_buttons = document.getElementsByClassName('delete-task'); // кнопки удаления задач
let draggedItem = null;     // для drap-and-drop
let current_locale = null;  // текущий язык

// добавление новой страницы
add_new_list_button.addEventListener('click', async (event) => {
    const new_page_id = await get_max_page_id();
    const new_page_name = 'List ' + new_page_id;
    add_new_page(new_page_id, new_page_name, [], true);
    go_to_page(new_page_id);
    await add_page_to_storage(new_page_id, new_page_name);
});

function add_new_page(new_data_id, page_name, tasks, focus) {
    const new_page_input = document.createElement('input');
    new_page_input.className = 'tab-input';
    new_page_input.setAttribute('data-id', new_data_id);
    new_page_input.setAttribute('type', 'text');
    new_page_input.setAttribute('maxlength', '10');
    if (!focus) new_page_input.setAttribute('readonly', 'true');

    const new_page_button = document.createElement('button');
    new_page_button.className = 'tab-button';
    new_page_button.setAttribute('data-id', new_data_id);
    new_page_button.setAttribute('text', page_name);

    new_page_button.appendChild(new_page_input);
    tabs.insertBefore(new_page_button, add_new_list_button);

    if (focus) {
        new_page_input.setAttribute('placeholder', class_elements_placeholders['tab-input']);
        new_page_input.focus();
    }
    else {
        new_page_input.value = page_name;
        resize_input(new_page_input, new_page_button);
    }
    new_page_input.addEventListener('blur', blur_input);

    const new_page_section = document.createElement('section');
    new_page_section.setAttribute('data-id', new_data_id);

    if (tasks.length === 0) {
        new_page_section.appendChild(create_zero_task_text());
        new_page_section.classList.add('zero-tasks-section');
    }
    else {
        for (let task of tasks) {
            const new_task_container = create_new_task_element(
                task['header'], task['desc'], task['date'], task['time'], task['priority'], task['completed']
            );
            new_page_section.appendChild(new_task_container);
        }
    }
    main_block.appendChild(new_page_section);
}

// текст, если на странице ничего нет
function create_zero_task_text() {
    const zero_tasks_text = document.createElement('div');
    zero_tasks_text.className = 'zero-tasks';
    zero_tasks_text.textContent = class_elements_text['zero-tasks'];
    return zero_tasks_text;
}

// удаление задачи
async function delete_task(event) {
    var element = event.target;
    var container = element.parentElement.parentElement;
    var task_name = container.querySelector('.text').textContent;
    container.innerHTML = '';
    container.remove();
    await remove_task_from_storage(current_tab_id, task_name);
    await change_bage_text();

    const active_section = document.querySelector('section[data-id="'+current_tab_id+'"]');
    const containers = active_section.querySelectorAll('.container');
    if (containers.length === 0) {
        active_section.appendChild(create_zero_task_text());
        active_section.classList.add('zero-tasks-section');
    }
}

// добавление новой задачи на страницу
document.getElementById('create-task').addEventListener('click', async function() {
    if (current_tab_id === null) {
        document.getElementById('error-modal').style.display = 'flex';
        document.getElementById('tasklist-already-exists').style.display = 'none';
        document.getElementById('unknown-error').style.display = 'none';
        document.getElementById('did-not-specify-task-name').style.display = 'none';
        document.getElementById('task-already-exists').style.display = 'none';
        document.getElementById('no-one-list').style.display = 'block';
        return;
    }
    const new_task_header = document.getElementById('add-task-header').value;
    if (!new_task_header) {
        document.getElementById('error-modal').style.display = 'flex';
        document.getElementById('tasklist-already-exists').style.display = 'none';
        document.getElementById('unknown-error').style.display = 'none';
        document.getElementById('did-not-specify-task-name').style.display = 'block';
        document.getElementById('task-already-exists').style.display = 'none';
        document.getElementById('no-one-list').style.display = 'none';
        return;
    }
    if (! await is_task_name_free(current_tab_id, new_task_header)) {
        document.getElementById('error-modal').style.display = 'flex';
        document.getElementById('tasklist-already-exists').style.display = 'none';
        document.getElementById('unknown-error').style.display = 'none';
        document.getElementById('did-not-specify-task-name').style.display = 'none';
        document.getElementById('task-already-exists').style.display = 'block';
        document.getElementById('no-one-list').style.display = 'none';
        return;
    }

    const active_section = document.querySelector('section[data-id="'+current_tab_id+'"]');

    const priority = document.getElementById('priority-select').getAttribute('data-value');
    const date = document.getElementById('dateInput').value;
    const time = document.getElementById('timeInput').value;
    const desc = document.getElementById('add-task-description').value;
    const new_task_container = create_new_task_element(new_task_header, desc, date, time, priority, false);

    if (active_section.classList.contains('zero-tasks-section')) {
        active_section.classList.remove('zero-tasks-section');
        active_section.innerHTML = '';
    }
    active_section.appendChild(new_task_container);
    clear_add_task_modal();

    await add_task_to_storage(current_tab_id, new_task_header, desc, date, time, priority);
    await change_bage_text();
});

// изменение существующей задачи
document.getElementById('save-task').addEventListener('click', async function() {
    const new_task_header = document.getElementById('add-task-header').value;
    if (!new_task_header) {
        document.getElementById('error-modal').style.display = 'flex';
        document.getElementById('tasklist-already-exists').style.display = 'none';
        document.getElementById('unknown-error').style.display = 'none';
        document.getElementById('did-not-specify-task-name').style.display = 'block';
        document.getElementById('task-already-exists').style.display = 'none';
        document.getElementById('no-one-list').style.display = 'none';
        return;
    }
    const old_name = document.getElementById('add-task-header').getAttribute('data-text');
    if (new_task_header != old_name) {
        if (! await is_task_name_free(current_tab_id, new_task_header)) {
            document.getElementById('error-modal').style.display = 'flex';
            document.getElementById('tasklist-already-exists').style.display = 'none';
            document.getElementById('unknown-error').style.display = 'none';
            document.getElementById('did-not-specify-task-name').style.display = 'none';
            document.getElementById('task-already-exists').style.display = 'block';
            document.getElementById('no-one-list').style.display = 'none';
            return
        }
    }
    const active_section = document.querySelector('section[data-id="'+current_tab_id+'"]');

    const priority = document.getElementById('priority-select').getAttribute('data-value');
    const date = document.getElementById('dateInput').value;
    const time = document.getElementById('timeInput').value;
    const desc = document.getElementById('add-task-description').value;
    var displaied_desc = desc;
    if (desc.length > 100) {
        displaied_desc = displaied_desc.substring(0, 100) + '...';
    }

    clear_add_task_modal();

    const all_tasks = active_section.getElementsByClassName('container');
    for (let task of all_tasks) {
        if (task.querySelector('.text').textContent === old_name) {
            task.querySelector('.text').textContent = new_task_header;
            task.querySelector('.description').textContent = displaied_desc; 
            task.querySelector('.date').textContent = date + ' ' + time;
            if (priority == '0') task.querySelector('.emoji').textContent = '➖';
            else if (priority == '1') task.querySelector('.emoji').textContent = '🟢';
            else if (priority == '2') task.querySelector('.emoji').textContent = '🟡';
            else if (priority == '3') task.querySelector('.emoji').textContent = '🔴';
        }
    }

    await change_task_data_in_storage(current_tab_id, old_name, new_task_header, desc, date, time, priority);
});

function formatDate(inputDate) {
    const [year, month, day] = inputDate.split('-');
    const formattedYear = year.slice(-2);
    return `${day}.${month}.${formattedYear}`;
}

function create_new_task_element(header, desc, date, time, priority, completed) {
    const new_task_container = document.createElement('div');
    new_task_container.className = 'container';
    new_task_container.setAttribute('draggable', 'true');
    new_task_container.addEventListener('dragstart', () => {
        draggedItem = new_task_container;
        setTimeout(() => {
            new_task_container.style.display = 'none';
        }, 0);
    });

    new_task_container.addEventListener('dragend', () => {
        setTimeout(() => {
            draggedItem = null;
            new_task_container.style.display = 'block';
        }, 0);
    });

    new_task_container.addEventListener('dragover', (event) => {
        event.preventDefault();
        new_task_container.classList.add('drag-over');
    });

    new_task_container.addEventListener('dragleave', () => {
        new_task_container.classList.remove('drag-over');
    });

    new_task_container.addEventListener('drop', async () => {
        new_task_container.classList.remove('drag-over');
        if (draggedItem !== new_task_container) {
            const active_section = document.querySelector('section[data-id="'+current_tab_id+'"]');
            const allRows = Array.from(active_section.querySelectorAll('.container'));
            if (!allRows) {
                return;
            }
            const draggedIndex = allRows.indexOf(draggedItem);
            const targetIndex = allRows.indexOf(new_task_container);

            if (draggedIndex < targetIndex) {
                new_task_container.after(draggedItem);
                await moveElement(
                    current_tab_id, new_task_container.querySelector('.text').textContent, 
                    draggedItem.querySelector('.text').textContent
                )
            } else {
                new_task_container.before(draggedItem);
                await moveElement(
                    current_tab_id, new_task_container.querySelector('.text').textContent, 
                    draggedItem.querySelector('.text').textContent
                )
            }
        }
    });

    const new_task_row1 = document.createElement('div');
    new_task_row1.className = 'row';
    const new_task_row2 = document.createElement('div');
    new_task_row2.className = 'row';

    const checkbox_wrapper = document.createElement('label');
    checkbox_wrapper.className = 'checkbox-wrapper';
    const checkbox = document.createElement('input');
    checkbox.className = 'real-checkbox';
    checkbox.setAttribute('type', 'checkbox');
    const fake_checkbox = document.createElement('span');
    fake_checkbox.className = 'custom-checkbox';

    checkbox_wrapper.appendChild(checkbox);
    checkbox_wrapper.appendChild(fake_checkbox);

    const header_element = document.createElement('div');
    header_element.className = 'text';
    header_element.textContent = header;

    const datetime = document.createElement('div');
    datetime.className = 'date';
    datetime.textContent = '';
    if (date) datetime.textContent += formatDate(date);
    if (date && time) datetime.textContent += ', ';
    if (time) datetime.textContent += time;

    const emoji = document.createElement('div');
    emoji.className = 'emoji';
    if (priority == '0') emoji.textContent = '➖';
    else if (priority == '1') emoji.textContent = '🟢';
    else if (priority == '2') emoji.textContent = '🟡';
    else if (priority == '3') emoji.textContent = '🔴';

    new_task_row1.appendChild(checkbox_wrapper);
    new_task_row1.appendChild(header_element);
    new_task_row1.appendChild(datetime);
    new_task_row1.appendChild(emoji);

    const description = document.createElement('div');
    description.className = 'description';
    if (desc.length > 100) {
        desc = desc.substring(0, 100) + '...';
    }
    description.textContent = desc;

    const delete_button = document.createElement('div');
    delete_button.className = 'delete-task hide';
    delete_button.textContent = class_elements_text['delete-task'];

    new_task_row2.appendChild(description);
    new_task_row2.appendChild(delete_button);

    new_task_container.appendChild(new_task_row1);
    new_task_container.appendChild(new_task_row2);

    if (completed) {
        checkbox.checked = true;
        fake_checkbox.classList.add('checked');
        header_element.classList.add('strikethrough');
        description.classList.add('strikethrough');
    }

    new_task_container.addEventListener('mouseenter', task_mouse_enter);
    new_task_container.addEventListener('mouseleave', task_mouse_leave);
    delete_button.addEventListener('click', delete_task);
    fake_checkbox.addEventListener('click', strike_checkbox);
    header_element.addEventListener('click', show_modal_change_task)

    return new_task_container;
}

// удаление всех/только выполненных задач на листе
document.getElementById('ok-delete-all').addEventListener('click', async function() {
    document.getElementById('delete-all-modal').style.display = 'none';
    const active_section = document.querySelector('section[data-id="'+current_tab_id+'"]');
    if (delete_flag) {                      // удаление всех
        active_section.innerHTML = '';
        active_section.appendChild(create_zero_task_text());
        active_section.classList.add('zero-tasks-section');
        await remove_all_tasks_from_storage(current_tab_id);
        await change_bage_text();
    }
    else {                                  // удаление выполенных
        const containers = active_section.querySelectorAll('.container');
        containers.forEach(function(container) {
            const checkbox = container.querySelector('.real-checkbox');
            if (checkbox.checked) {
                container.remove();
            }
        });
        const containers_after = active_section.querySelectorAll('.container');
        if (containers_after.length === 0) {
            active_section.appendChild(create_zero_task_text());
            active_section.classList.add('zero-tasks-section');
        }
        await remove_completed_tasks_from_storage(current_tab_id);
        await change_bage_text();
    }
})

document.addEventListener('DOMContentLoaded', async function() {
    // листы и задачи
    const data = await get_data();
    if (data && data[0]) {    
        for (let page of data) {
            add_new_page(page['id'], page['name'], page['tasks'], false)
        }
        go_to_page(data[0]['id'])
        current_tab_id = data[0]['id'];
    }
    // язык
    current_locale = await get_locale();
    for (let button of language_select_buttons) {
        if (button.getAttribute('data-value') == current_locale) {
            language_select_text.innerHTML = button.innerHTML;
        }
    }
    await set_locale_texts(current_locale);
});

// отметить задачу выполненной либо невыполненной
async function strike_checkbox(event) {
    var element = event.target;
    var checkbox = element.parentElement.querySelector('input');
    element.classList.toggle('checked', !checkbox.checked);

    var container = element.parentElement.parentElement.parentElement;
    var task_title = container.getElementsByClassName('text')[0];
    task_title.classList.toggle('strikethrough', !checkbox.checked);
    container.getElementsByClassName('description')[0].classList.toggle('strikethrough', !checkbox.checked);
    
    await change_task_status_in_storage(current_tab_id, task_title.textContent);
    await change_bage_text();
}

var class_elements_text = {};
var class_elements_placeholders = {};
async function set_locale_texts(current_locale) {
    const response = await fetch(chrome.runtime.getURL('locales/'+current_locale+'.json'));
    const response_data = await response.json();
    for (let text_data of response_data) {
        if (text_data.type == 'text')
            document.getElementById(text_data.id).textContent = text_data.text;
        else if (text_data.type == 'placeholder')
            document.getElementById(text_data.id).setAttribute('placeholder', text_data.text);
        else if (text_data.type == 'class') {
            class_elements_text[text_data.id] = text_data.text;
            const elements = document.getElementsByClassName(text_data.id);
            for (let element of elements) {
                element.textContent = text_data.text;
            }
        }
        else if (text_data.type == 'class-placeholder') {
            class_elements_placeholders[text_data.id] = text_data.text;
            const elements = document.getElementsByClassName(text_data.id);
            for (let element of elements) {
                element.setAttribute('placeholder', text_data.text);
            }
        }
    }
    document.getElementById('priority-select-text').textContent = document.getElementById('header-option').textContent;
    resize_priority_select();
}