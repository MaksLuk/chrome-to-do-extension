const tabs = document.getElementById('tabs');                       // вкладки страниц
const tasks = document.getElementsByClassName('container');         // таски
const checkboxes = document.getElementsByClassName('checkbox');     // чекбоксы

const language_select = document.getElementById('language-select');                 // селект смены языка
const language_select_data = document.getElementById('select-buttons-container');   // выпадающее меню языков
const arrow = document.getElementById('arrow');                                     // стрелка у селекта смены языка
const language_select_text = document.getElementById('language-select-text');       // текст селекта смены языка

const priority_select = document.getElementById('priority-select');                 // селект смены приоритета
const priority_select_data = document.getElementById('priority-buttons-container'); // выпадающее меню приоритетов
const arrow2 = document.getElementById('arrow2');                                   // стрелка у селекта смены приоритета
const priority_select_text = document.getElementById('priority-select-text');       // текст селекта смены приоритета

var current_tab_id = null;

// обработчик события wheel для горизонтальной прокрутки
tabs.addEventListener('wheel', (event) => {
    event.preventDefault();
    tabs.scrollLeft += event.deltaY;
});

// изменение названия страницы
tabs.addEventListener('dblclick', (event) => {
    if (event.target.classList.contains('tab-input')) {
        var input = event.target;
        input.removeAttribute('readonly');
        input.focus();
        input.value = '';
    }
});

// переключение между вкладками
tabs.addEventListener('click', (event) => {
    if (event.target.classList.contains('tab-input') || event.target.classList.contains('tab-button')) {
        var data_id = event.target.getAttribute('data-id');
        go_to_page(data_id)
    }
});

// изменение названия страницы - проверка на пустое название и сохранение
async function blur_input(event) {
    var input = event.target;
    input.setAttribute('readonly', 'true');
    var data_id = input.getAttribute('data-id');
    var button = document.querySelector('.tab-button[data-id="'+data_id+'"]');
    input.removeAttribute('placeholder');
    if (!input.value) {
        input.value = button.getAttribute('text');
    }
    else {
        if (! await is_list_name_free(input.value, button.getAttribute('text'))) {
            document.getElementById('error-modal').style.display = 'flex';
            document.getElementById('tasklist-already-exists').style.display = 'block';
            document.getElementById('unknown-error').style.display = 'none';
            document.getElementById('did-not-specify-task-name').style.display = 'none';
            document.getElementById('task-already-exists').style.display = 'none';
            document.getElementById('no-one-list').style.display = 'none';
            input.value = button.getAttribute('text');
            return;
        }
        button.setAttribute('text', input.value);
        await rename_page_in_storage(data_id, input.value);
    }
    input.setAttribute('readonly', '');
    resize_input(input);
}

// переход на новую страницу
function go_to_page(data_id) {
    current_tab_id = data_id;
    var all_buttons = document.getElementsByClassName('tab-button');
    for (let element of all_buttons) {
        if (element.getAttribute('data-id') == data_id) {
            element.classList.add('selected');
        }
        else {
            if (element.classList.contains('selected')) {
                element.classList.remove('selected');
            }
        }
    }
    var all_sections = document.getElementsByTagName('section');
    for (let element of all_sections) {
        if (element.getAttribute('data-id') == data_id) {
            if (element.classList.contains('hide')) {
                element.classList.remove('hide');
            }
        }
        else {
            if (!element.classList.contains('hide')) {
                element.classList.add('hide');
            }
        }
    }
}

// наведение мыши на контейнер 
function task_mouse_enter(event) {
    var element = event.target;
    var delete_button = element.getElementsByClassName('delete-task')[0];
    delete_button.classList.remove('hide');
    element.style.backgroundColor = '#F2F4F8';
    delete_button.style.backgroundColor = '#F2F4F8';
	element.style.borderBottom = '1px solid #F2F4F8';
}

function task_mouse_leave(event) {
    var element = event.fromElement;
    var delete_button = element.getElementsByClassName('delete-task')[0];
    delete_button.classList.add('hide');
    element.style.backgroundColor = 'white';
    delete_button.style.backgroundColor = 'white';
	element.style.borderBottom = '1px solid #E0E8F1';
}

// открытие модального окна добавления задачи
document.getElementById('add-task').onclick = function() {
    document.getElementById('add-task-modal').style.display = 'block';
    document.getElementById('add-task-header').focus();
    document.getElementById('save-task').style.display = 'none';
    document.getElementById('create-task').style.display = 'block';
};

// открытие модального окна задачи (изменение + просмотр)
async function show_modal_change_task_from_header(event) {
	var task_header = event.target.textContent;
	await show_modal_change_task(task_header);
}

async function show_modal_change_task_from_desc(event) {
	var task_container = event.target.parentElement.parentElement;
	var task_header = task_container.querySelector('.text').textContent;
	await show_modal_change_task(task_header);
}

async function show_modal_change_task(task_header) {
    var task_data = await get_task_data_from_storage(current_tab_id, task_header);
    if (task_data === false) {
        document.getElementById('error-modal').style.display = 'flex';
        document.getElementById('tasklist-already-exists').style.display = 'none';
        document.getElementById('unknown-error').style.display = 'block';
        document.getElementById('did-not-specify-task-name').style.display = 'none';
        document.getElementById('task-already-exists').style.display = 'none';
        document.getElementById('no-one-list').style.display = 'none';
        return;
    }
    document.getElementById('add-task-modal').style.display = 'block';
    document.getElementById('add-task-header').focus();
    document.getElementById('save-task').style.display = 'block';
    document.getElementById('create-task').style.display = 'none';

    document.getElementById('dateInput').value = task_data['date'];
    document.getElementById('timeInput').value = task_data['time'];
    document.getElementById('priority-select').setAttribute('data-value', task_data['priority']);
    if (task_data['priority'] == '0') 
        document.querySelector('#priority-select-text').textContent = document.querySelector('#header-option').textContent;
    else if (task_data['priority'] == '1') 
        document.querySelector('#priority-select-text').textContent = document.querySelector('#high-prority-option').textContent;
    else if (task_data['priority'] == '2') 
        document.querySelector('#priority-select-text').textContent = document.querySelector('#medium-prority-option').textContent;
    else if (task_data['priority'] == '3') 
        document.querySelector('#priority-select-text').textContent = document.querySelector('#low-prority-option').textContent;
    document.getElementById('add-task-header').value = task_data['header'];
    document.getElementById('add-task-header').setAttribute('data-text', task_data['header']);
    document.getElementById('add-task-description').value = task_data['desc'];
    resize_priority_select();
}

// навели и убрали мышь с селекта языков
language_select.addEventListener('mouseenter', () => {
	language_select.style.backgroundColor = '#F2F4F8';
	language_select.style.borderColor = '#E0E8F1';
});

language_select.addEventListener('mouseleave', () => {
	language_select.style.backgroundColor = 'white';
	language_select.style.borderColor = 'white';
});

window.onclick = function(event) {
    document.getElementById('context-menu').style.display = 'none';
    if (event.target === document.getElementById('add-task-modal')) {
        clear_add_task_modal();
    }
    if (language_select.contains(event.target)) {
        if (language_select_data.style.display != 'flex') {
            language_select_data.style.display = 'flex';
            language_select.style.backgroundColor = '#F2F4F8';
            language_select.style.border = '1px solid #E0E8F1';
            arrow.style.transform = 'rotate(0deg)';
        }
        else {
            language_select_data_hide();
        }
    }
    else {
        if (language_select_data.style.display == 'flex') {
            language_select_data_hide();
        }
    }
    if (priority_select.contains(event.target)) {
        if (priority_select_data.style.display != 'flex') {
            priority_select_data.style.display = 'flex';
            priority_select.style.border = '1px solid #183DAE';
            arrow2.style.transform = 'rotate(0deg)';
        }
        else {
            priority_select_data_hide();
        }
    }
    else {
        if (priority_select_data.style.display == 'flex') {
            priority_select_data_hide();
        }
    }
};

// кнопки смены языка
const language_select_buttons = document.querySelectorAll('#select-buttons-container .select-button');
language_select_buttons.forEach(button => {
    button.addEventListener('click', async function() {
        language_select_text.innerHTML = this.innerHTML;
        const current_locale = this.getAttribute('data-value');
        await set_locale_texts(current_locale);
        await set_locale(current_locale);
        language_select_data_hide();
    });
});

function language_select_data_hide() {
    language_select_data.style.display = 'none';
    language_select.style.backgroundColor = 'white';
    language_select.style.border = 'none';
    arrow.style.transform = 'rotate(180deg)';
}

// кнопки смены приоритета
const priority_select_buttons = document.querySelectorAll('#priority-buttons-container .select-button');
priority_select_buttons.forEach(button => {
    button.addEventListener('click', async function() {
        priority_select_text.textContent = this.textContent;
        priority_select.setAttribute('data-value', this.getAttribute('data-value'));
        priority_select_data_hide();
        resize_priority_select();
    });
});

function priority_select_data_hide() {
    priority_select_data.style.display = 'none';
    priority_select.style.border = '1px solid #93A4B9';
    arrow2.style.transform = 'rotate(180deg)';
}

// а это у названий страниц
function resize_input(input) {
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.style.fontSize = '12px';
    tempSpan.innerText = input.value;
    tabs.appendChild(tempSpan);
    console.log('tempSpan.offsetWidth');
    input.style.width = (tempSpan.offsetWidth + 16) + 'px';
    tabs.removeChild(tempSpan);
}

// а это у селекта приоритетов
function resize_priority_select() {
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.style.fontSize = '12px';
    tempSpan.innerText = priority_select_text.textContent;
    tabs.appendChild(tempSpan);
    priority_select.style.width = (tempSpan.offsetWidth + 34) + 'px';
    tabs.removeChild(tempSpan);
}

function clear_add_task_modal() {
    document.getElementById('add-task-modal').style.display = 'none';
    document.getElementById('dateInput').value = '';
    document.getElementById('timeInput').value = '';
    document.getElementById('priority-select').setAttribute('data-value', '0');
    document.getElementById('priority-select-text').textContent = document.querySelector('#header-option').textContent;
    document.getElementById('add-task-header').value = '';
    document.getElementById('add-task-description').value = '';
    document.getElementById('error-modal').style.display = 'none';
}

document.getElementById('cancel-task').addEventListener('click', clear_add_task_modal);

document.getElementById('close-error').onclick = function() {
    document.getElementById('error-modal').style.display = 'none';
};

var delete_flag = false;    // true - удалить все, false - удалить завершенные

// удаление всех задач на листе - показать подтверждение
document.getElementById('clear-all').addEventListener('click', function() {
    document.getElementById('delete-all-modal').style.display = 'block';
    document.getElementById('delete-all-text').style.display = 'block';
    document.getElementById('delete-completed-text').style.display = 'none';
    delete_flag = true;
})

document.getElementById('clear-completed').addEventListener('click', function() {
    document.getElementById('delete-all-modal').style.display = 'block';
    document.getElementById('delete-all-text').style.display = 'none';
    document.getElementById('delete-completed-text').style.display = 'block';
    delete_flag = false;
})

// отказ от удаления всех задач
document.getElementById('cancel-delete-all').onclick = function() {
    document.getElementById('delete-all-modal').style.display = 'none';
};

var current_page_input = undefined;     // вкладка страницы, из которой выбрали выпадающее меню

// правый клик мыши - контекстное меню
document.body.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    if (event.target.classList.contains('tab-button') || event.target.classList.contains('tab-input')) {
        document.getElementById('context-menu').style = 'display: flex;top: '+event.y+'px;left: '+event.x+'px;';
        if (event.target.classList.contains('tab-button'))
            current_page_input = event.target.querySelector('.tab-input');
        else
            current_page_input = event.target;
    }
});

// изменение названия страницы по клику на кнопку в выпадающем меню
document.getElementById('rename-list').addEventListener('click', () => {
    current_page_input.removeAttribute('readonly');
    current_page_input.focus();
    current_page_input.value = '';
});

// удаление страницы по клику на кнопку в выпадающем меню
document.getElementById('delete-list').addEventListener('click', async () => {
    const deleting_page_id = current_page_input.getAttribute('data-id');
    await remove_tasklist_from_storage(deleting_page_id);
    if (deleting_page_id === current_tab_id) {
        const data = await get_data();
        if (!(data && data[0])) current_tab_id = null;
        else {
            current_tab_id = data[0]['id'];
            go_to_page(current_tab_id);
        }
    }
    current_page_input.parentElement.remove();
    const page_section = document.querySelector('section[data-id="'+deleting_page_id+'"]');
    page_section.remove();
    await change_bage_text();
});