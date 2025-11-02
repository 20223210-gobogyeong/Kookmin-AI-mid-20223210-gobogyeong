// 데이터 관리 유틸리티
const DataManager = {
    // Tasks
    getTasks: () => {
        const data = localStorage.getItem('archsync_tasks');
        return data ? JSON.parse(data) : [];
    },
    saveTasks: (tasks) => {
        localStorage.setItem('archsync_tasks', JSON.stringify(tasks));
    },

    // Resources
    getResources: () => {
        const data = localStorage.getItem('archsync_resources');
        return data ? JSON.parse(data) : [];
    },
    saveResources: (resources) => {
        localStorage.setItem('archsync_resources', JSON.stringify(resources));
    },

    // Feeds
    getFeeds: () => {
        const data = localStorage.getItem('archsync_feeds');
        return data ? JSON.parse(data) : [];
    },
    saveFeeds: (feeds) => {
        localStorage.setItem('archsync_feeds', JSON.stringify(feeds));
    },

    // Events
    getEvents: () => {
        const data = localStorage.getItem('archsync_events');
        return data ? JSON.parse(data) : [];
    },
    saveEvents: (events) => {
        localStorage.setItem('archsync_events', JSON.stringify(events));
    },

    // User Profile
    getUserProfile: () => {
        const data = localStorage.getItem('archsync_userProfile');
        return data ? JSON.parse(data) : { name: '사용자' };
    },
    saveUserProfile: (profile) => {
        localStorage.setItem('archsync_userProfile', JSON.stringify(profile));
    }
};

// ID 생성기
function generateId(prefix) {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 날짜 유틸리티
const DateUtils = {
    formatDate: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    getDaysUntil: (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        const diff = targetDate - today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    },
    isToday: (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        const date = new Date(dateString);
        return today.toDateString() === date.toDateString();
    }
};

// 네비게이션
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.dataset.view;

            // 활성 버튼 변경
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 활성 뷰 변경
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`${targetView}-view`).classList.add('active');

            // 뷰별 데이터 로드
            loadViewData(targetView);
        });
    });
}

// 뷰별 데이터 로드
function loadViewData(viewName) {
    switch (viewName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'tasks':
            renderKanbanBoard();
            break;
        case 'resources':
            renderResources();
            break;
        case 'feeds':
            renderFeeds();
            break;
        case 'events':
            renderEvents();
            break;
    }
}

// 대시보드 렌더링
function renderDashboard() {
    renderDashboardCalendar();
    
    const tasks = DataManager.getTasks();
    const events = DataManager.getEvents();
    const feeds = DataManager.getFeeds();

    // 다가오는 일정 (최대 5개, 날짜순 정렬)
    const upcomingEvents = events
        .filter(e => {
            const days = DateUtils.getDaysUntil(e.date);
            return days !== null && days >= 0;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    const eventsListEl = document.getElementById('upcoming-events');
    if (upcomingEvents.length === 0) {
        eventsListEl.innerHTML = '<p class="empty-message">일정이 없습니다.</p>';
    } else {
        eventsListEl.innerHTML = upcomingEvents.map(event => {
            const days = DateUtils.getDaysUntil(event.date);
            const daysText = days === 0 ? '오늘' : days === 1 ? '내일' : `D-${days}`;
            return `
                <div class="event-item">
                    <strong><i class="fas fa-calendar-check"></i> ${event.eventName}</strong>
                    <div class="event-date"><i class="far fa-clock"></i> ${DateUtils.formatDate(event.date)} (${daysText})</div>
                </div>
            `;
        }).join('');
    }

    // 오늘 할 일
    const todayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        return DateUtils.isToday(t.dueDate);
    });

    const tasksListEl = document.getElementById('today-tasks');
    if (todayTasks.length === 0) {
        tasksListEl.innerHTML = '<p class="empty-message">오늘 할 일이 없습니다.</p>';
    } else {
        tasksListEl.innerHTML = todayTasks.map(task => {
            return `
                <div class="task-item">
                    <strong><i class="fas fa-check-square"></i> ${task.taskName}</strong>
                    ${task.assigneeName ? `<div class="task-assignee"><i class="fas fa-user"></i> 담당: ${task.assigneeName}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // 최근 메모/피드백 (최대 5개, 날짜순 정렬)
    const recentFeeds = feeds
        .sort((a, b) => {
            // id에 타임스탬프가 포함되어 있으므로 이를 기준으로 정렬
            return b.id.localeCompare(a.id);
        })
        .slice(0, 5);

    const feedsListEl = document.getElementById('recent-feeds');
    if (recentFeeds.length === 0) {
        feedsListEl.innerHTML = '<p class="empty-message">메모가 없습니다.</p>';
    } else {
        feedsListEl.innerHTML = recentFeeds.map(feed => {
            return `
                <div class="feed-item">
                    <span class="feed-type">${feed.type === '피드백' ? '<i class="fas fa-comment-dots"></i>' : feed.type === '회의록' ? '<i class="fas fa-users"></i>' : '<i class="fas fa-lightbulb"></i>'} ${feed.type}</span>
                    <div><strong>${feed.title}</strong></div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                        ${feed.content.substring(0, 50)}${feed.content.length > 50 ? '...' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 칸반 보드 렌더링
function renderKanbanBoard() {
    const tasks = DataManager.getTasks();
    const statuses = ['대기', '진행중', '완료'];

    statuses.forEach(status => {
        const columnEl = document.getElementById(`tasks-${status}`);
        const columnTasks = tasks.filter(t => t.status === status);

        if (columnTasks.length === 0) {
            columnEl.innerHTML = '';
        } else {
            columnEl.innerHTML = columnTasks.map(task => `
                <div class="kanban-task" draggable="true" data-task-id="${task.id}">
                    <h4>${task.taskName}</h4>
                    ${task.assigneeName ? `<div class="task-meta">담당: ${task.assigneeName}</div>` : ''}
                    ${task.dueDate ? `<div class="task-meta">마감: ${DateUtils.formatDate(task.dueDate)}</div>` : ''}
                    <div class="task-actions">
                        <button class="btn btn-secondary" onclick="editTask('${task.id}')"><i class="fas fa-edit"></i> 수정</button>
                        <button class="btn btn-danger" onclick="deleteTask('${task.id}')"><i class="fas fa-trash"></i> 삭제</button>
                    </div>
                </div>
            `).join('');
        }
    });

    initDragAndDrop();
}

// 드래그 앤 드롭 초기화
function initDragAndDrop() {
    const tasks = document.querySelectorAll('.kanban-task');
    const columns = document.querySelectorAll('.kanban-column');

    tasks.forEach(task => {
        task.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.dataset.taskId);
            task.classList.add('dragging');
        });

        task.addEventListener('dragend', () => {
            task.classList.remove('dragging');
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.dataset.status;
            moveTask(taskId, newStatus);
        });
    });
}

// 할 일 이동
function moveTask(taskId, newStatus) {
    const tasks = DataManager.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        DataManager.saveTasks(tasks);
        renderKanbanBoard();
    }
}

// 할 일 추가/수정 모달
function openTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const title = document.getElementById('task-modal-title');

    if (taskId) {
        // 수정 모드
        const tasks = DataManager.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            title.innerHTML = '<i class="fas fa-tasks"></i> 할 일 수정';
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-name').value = task.taskName;
            document.getElementById('task-assignee').value = task.assigneeName || '';
            document.getElementById('task-status').value = task.status;
            document.getElementById('task-due-date').value = task.dueDate || '';
        }
    } else {
        // 추가 모드
        title.innerHTML = '<i class="fas fa-tasks"></i> 할 일 추가';
        form.reset();
        document.getElementById('task-id').value = '';
    }

    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
}

function saveTask(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const tasks = DataManager.getTasks();
    const taskId = formData.get('id');

    const taskData = {
        id: taskId || generateId('t'),
        taskName: formData.get('taskName'),
        assigneeName: formData.get('assigneeName') || '',
        status: formData.get('status'),
        dueDate: formData.get('dueDate') || ''
    };

    if (taskId) {
        // 수정
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = taskData;
        }
    } else {
        // 추가
        tasks.push(taskData);
    }

    DataManager.saveTasks(tasks);
    closeTaskModal();
    renderKanbanBoard();
    renderDashboard();
}

function editTask(taskId) {
    openTaskModal(taskId);
}

function deleteTask(taskId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        const tasks = DataManager.getTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        DataManager.saveTasks(filtered);
        renderKanbanBoard();
        renderDashboard();
    }
}

// 리소스 렌더링
function renderResources(categoryFilter = 'all') {
    const resources = DataManager.getResources();
    const filtered = categoryFilter === 'all' 
        ? resources 
        : resources.filter(r => r.category === categoryFilter);

    const listEl = document.getElementById('resources-list');
    
    if (filtered.length === 0) {
        listEl.innerHTML = '<p class="empty-message">리소스가 없습니다.</p>';
    } else {
        listEl.innerHTML = filtered.map(resource => `
            <div class="resource-card">
                <h4>${resource.resourceName}</h4>
                <span class="resource-category">${resource.category}</span>
                <a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="resource-url">${resource.url}</a>
                ${resource.version ? `<div class="resource-meta">버전: ${resource.version}</div>` : ''}
                ${resource.registrant ? `<div class="resource-meta">등록자: ${resource.registrant}</div>` : ''}
                <div class="resource-actions">
                    <button class="btn btn-secondary" onclick="editResource('${resource.id}')"><i class="fas fa-edit"></i> 수정</button>
                    <button class="btn btn-danger" onclick="deleteResource('${resource.id}')"><i class="fas fa-trash"></i> 삭제</button>
                </div>
            </div>
        `).join('');
    }
}

// 리소스 필터 초기화
function initResourceFilters() {
    const filterButtons = document.querySelectorAll('#resources-view .filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderResources(btn.dataset.category);
        });
    });
}

function openResourceModal(resourceId = null) {
    const modal = document.getElementById('resource-modal');
    const form = document.getElementById('resource-form');
    const title = document.getElementById('resource-modal-title');

    if (resourceId) {
        const resources = DataManager.getResources();
        const resource = resources.find(r => r.id === resourceId);
        if (resource) {
            title.innerHTML = '<i class="fas fa-link"></i> 링크 수정';
            document.getElementById('resource-id').value = resource.id;
            document.getElementById('resource-name').value = resource.resourceName;
            document.getElementById('resource-url').value = resource.url;
            document.getElementById('resource-category').value = resource.category;
            document.getElementById('resource-registrant').value = resource.registrant || '';
            document.getElementById('resource-version').value = resource.version || '';
        }
    } else {
        title.innerHTML = '<i class="fas fa-link"></i> 링크 추가';
        form.reset();
        document.getElementById('resource-id').value = '';
    }

    modal.classList.add('active');
}

function closeResourceModal() {
    document.getElementById('resource-modal').classList.remove('active');
}

function saveResource(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const resources = DataManager.getResources();
    const resourceId = formData.get('id');

    const resourceData = {
        id: resourceId || generateId('r'),
        resourceName: formData.get('resourceName'),
        url: formData.get('url'),
        category: formData.get('category'),
        registrant: formData.get('registrant') || '',
        version: formData.get('version') || ''
    };

    if (resourceId) {
        const index = resources.findIndex(r => r.id === resourceId);
        if (index !== -1) {
            resources[index] = resourceData;
        }
    } else {
        resources.push(resourceData);
    }

    DataManager.saveResources(resources);
    closeResourceModal();
    renderResources();
}

function editResource(resourceId) {
    openResourceModal(resourceId);
}

function deleteResource(resourceId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        const resources = DataManager.getResources();
        const filtered = resources.filter(r => r.id !== resourceId);
        DataManager.saveResources(filtered);
        renderResources();
    }
}

// 피드 렌더링
function renderFeeds(typeFilter = 'all') {
    const feeds = DataManager.getFeeds();
    const filtered = typeFilter === 'all'
        ? feeds
        : feeds.filter(f => f.type === typeFilter);

    const listEl = document.getElementById('feeds-list');
    
    if (filtered.length === 0) {
        listEl.innerHTML = '<p class="empty-message">메모가 없습니다.</p>';
    } else {
        listEl.innerHTML = filtered.sort((a, b) => b.id.localeCompare(a.id)).map(feed => `
            <div class="feed-card">
                <span class="feed-type-badge">${feed.type}</span>
                <h4>${feed.title}</h4>
                <div class="feed-content">${feed.content}</div>
                ${feed.authorName ? `<div class="feed-meta">작성자: ${feed.authorName}</div>` : ''}
                <div class="feed-actions">
                    <button class="btn btn-secondary" onclick="editFeed('${feed.id}')"><i class="fas fa-edit"></i> 수정</button>
                    <button class="btn btn-danger" onclick="deleteFeed('${feed.id}')"><i class="fas fa-trash"></i> 삭제</button>
                </div>
            </div>
        `).join('');
    }
}

function initFeedFilters() {
    const filterButtons = document.querySelectorAll('#feeds-view .filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFeeds(btn.dataset.type);
        });
    });
}

function openFeedModal(feedId = null) {
    const modal = document.getElementById('feed-modal');
    const form = document.getElementById('feed-form');
    const title = document.getElementById('feed-modal-title');

    if (feedId) {
        const feeds = DataManager.getFeeds();
        const feed = feeds.find(f => f.id === feedId);
        if (feed) {
            title.innerHTML = '<i class="fas fa-sticky-note"></i> 메모 수정';
            document.getElementById('feed-id').value = feed.id;
            document.getElementById('feed-title').value = feed.title;
            document.getElementById('feed-content').value = feed.content;
            document.getElementById('feed-type').value = feed.type;
            document.getElementById('feed-author').value = feed.authorName || '';
        }
    } else {
        title.innerHTML = '<i class="fas fa-sticky-note"></i> 메모 추가';
        form.reset();
        document.getElementById('feed-id').value = '';
    }

    modal.classList.add('active');
}

function closeFeedModal() {
    document.getElementById('feed-modal').classList.remove('active');
}

function saveFeed(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const feeds = DataManager.getFeeds();
    const feedId = formData.get('id');

    const feedData = {
        id: feedId || generateId('f'),
        title: formData.get('title'),
        content: formData.get('content'),
        type: formData.get('type'),
        authorName: formData.get('authorName') || ''
    };

    if (feedId) {
        const index = feeds.findIndex(f => f.id === feedId);
        if (index !== -1) {
            feeds[index] = feedData;
        }
    } else {
        feeds.push(feedData);
    }

    DataManager.saveFeeds(feeds);
    closeFeedModal();
    renderFeeds();
    renderDashboard();
}

function editFeed(feedId) {
    openFeedModal(feedId);
}

function deleteFeed(feedId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        const feeds = DataManager.getFeeds();
        const filtered = feeds.filter(f => f.id !== feedId);
        DataManager.saveFeeds(filtered);
        renderFeeds();
        renderDashboard();
    }
}

// 달력 렌더링을 위한 현재 월 관리 (대시보드용)
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// 일정 렌더링 (리스트만)
function renderEvents() {
    renderEventsList();
}

// 대시보드 달력 렌더링
function renderDashboardCalendar() {
    const events = DataManager.getEvents();
    const calendarDaysEl = document.getElementById('dashboard-calendar-days');
    const monthYearEl = document.getElementById('dashboard-calendar-month-year');
    
    // 현재 월/년도 표시
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                       '7월', '8월', '9월', '10월', '11월', '12월'];
    monthYearEl.textContent = `${currentCalendarYear}년 ${monthNames[currentCalendarMonth]}`;
    
    // 달력 시작일 계산
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // 일요일로 맞춤
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let html = '';
    
    // 35일 표시 (5주, 대시보드용으로 작은 사이즈)
    for (let i = 0; i < 35; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const isOtherMonth = currentDate.getMonth() !== currentCalendarMonth;
        const isToday = currentDate.getTime() === today.getTime();
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // 해당 날짜의 일정 찾기
        const dayEvents = events.filter(e => e.date === dateStr);
        
        // 디데이 계산 및 긴급 여부 확인
        let urgentEvent = false;
        if (dayEvents.length > 0) {
            dayEvents.forEach(event => {
                const days = DateUtils.getDaysUntil(event.date);
                if (days !== null && days <= 3 && days >= 0) {
                    urgentEvent = true;
                }
            });
        }
        
        const dayClasses = [
            'dashboard-calendar-day',
            isOtherMonth ? 'other-month' : '',
            isToday ? 'today' : '',
            dayEvents.length > 0 ? 'has-event' : '',
            urgentEvent ? 'urgent' : ''
        ].filter(c => c).join(' ');
        
        const onClickHandler = dayEvents.length > 0 
            ? `if(event.target.closest('.dashboard-calendar-event-item')) { return; } openEventModal('${dayEvents[0].id}')`
            : '';
        html += `<div class="${dayClasses}" data-date="${dateStr}" ${onClickHandler ? `onclick="${onClickHandler}" style="cursor: pointer;"` : ''}>`;
        html += `<div class="dashboard-calendar-day-number">${currentDate.getDate()}</div>`;
        
        if (dayEvents.length > 0) {
            html += '<div class="dashboard-calendar-day-events">';
            dayEvents.slice(0, 2).forEach(event => {
                const days = DateUtils.getDaysUntil(event.date);
                const isUrgent = days !== null && days <= 3 && days >= 0;
                
                html += `<div class="dashboard-calendar-event-item ${isUrgent ? 'urgent' : ''}" 
                              onclick="event.stopPropagation(); openEventModal('${event.id}')" 
                              title="${event.eventName}">
                            ${event.eventName.length > 8 ? event.eventName.substring(0, 8) + '...' : event.eventName}
                         </div>`;
            });
            if (dayEvents.length > 2) {
                html += `<div style="font-size: 0.6rem; color: var(--text-secondary);">+${dayEvents.length - 2}</div>`;
            }
            html += '</div>';
            
            // 디데이 표시
            const firstEventDays = DateUtils.getDaysUntil(dayEvents[0].date);
            if (firstEventDays !== null && firstEventDays >= 0) {
                const daysText = firstEventDays === 0 ? '오늘' : firstEventDays === 1 ? '내일' : `D-${firstEventDays}`;
                const urgentClass = firstEventDays <= 3 ? 'urgent' : '';
                html += `<div class="dashboard-calendar-dday ${urgentClass}">${daysText}</div>`;
            }
        }
        
        html += '</div>';
    }
    
    calendarDaysEl.innerHTML = html;
}

// 대시보드 달력 월 변경
function changeCalendarMonth(direction) {
    currentCalendarMonth += direction;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderDashboardCalendar();
}

// 일정 리스트 렌더링
function renderEventsList() {
    const events = DataManager.getEvents();
    const sorted = events.sort((a, b) => new Date(a.date) - new Date(b.date));

    const listEl = document.getElementById('events-list');
    
    if (sorted.length === 0) {
        listEl.innerHTML = '<p class="empty-message">일정이 없습니다.</p>';
    } else {
        listEl.innerHTML = sorted.map(event => {
            const days = DateUtils.getDaysUntil(event.date);
            const daysText = days === 0 ? '오늘' : days === 1 ? '내일' : days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
            const isUrgent = days !== null && days <= 3 && days >= 0;
            
            return `
                <div class="event-card ${isUrgent ? 'urgent' : ''}">
                    <h4><i class="fas fa-calendar-check"></i> ${event.eventName}</h4>
                    <div class="event-date"><i class="far fa-clock"></i> ${DateUtils.formatDate(event.date)}</div>
                    <span class="event-days ${isUrgent ? 'urgent' : ''}">${daysText}</span>
                    <div class="event-actions">
                        <button class="btn btn-secondary" onclick="editEvent('${event.id}')"><i class="fas fa-edit"></i> 수정</button>
                        <button class="btn btn-danger" onclick="deleteEvent('${event.id}')"><i class="fas fa-trash"></i> 삭제</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function openEventModal(eventId = null) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-modal-title');

    if (eventId) {
        const events = DataManager.getEvents();
        const event = events.find(e => e.id === eventId);
        if (event) {
            title.innerHTML = '<i class="fas fa-calendar-alt"></i> 일정 수정';
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-name').value = event.eventName;
            document.getElementById('event-date').value = event.date;
        }
    } else {
        title.innerHTML = '<i class="fas fa-calendar-alt"></i> 일정 추가';
        form.reset();
        document.getElementById('event-id').value = '';
    }

    modal.classList.add('active');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
}

function saveEvent(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const events = DataManager.getEvents();
    const eventId = formData.get('id');

    const eventData = {
        id: eventId || generateId('e'),
        eventName: formData.get('eventName'),
        date: formData.get('date')
    };

    if (eventId) {
        const index = events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            events[index] = eventData;
        }
    } else {
        events.push(eventData);
    }

    DataManager.saveEvents(events);
    closeEventModal();
    renderEvents();
    renderDashboard();
}

function editEvent(eventId) {
    openEventModal(eventId);
}

function deleteEvent(eventId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        const events = DataManager.getEvents();
        const filtered = events.filter(e => e.id !== eventId);
        DataManager.saveEvents(filtered);
        renderEvents();
        renderDashboard();
    }
}


// 모달 외부 클릭시 닫기
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// 샘플 데이터 초기화 (최초 실행시에만)
function initSampleData() {
    // 사용자 프로필이 없으면 샘플 데이터 초기화
    if (!localStorage.getItem('archsync_userProfile')) {
        DataManager.saveUserProfile({ name: '김지수' });

        // 샘플 Tasks
        DataManager.saveTasks([
            {
                id: 't1',
                taskName: '모델 제작',
                assigneeName: '이철민 (메모용)',
                status: '진행중',
                dueDate: new Date().toISOString().split('T')[0]
            },
            {
                id: 't2',
                taskName: '패널 레이아웃 수정',
                assigneeName: '김지수',
                status: '대기',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ]);

        // 샘플 Resources
        DataManager.saveResources([
            {
                id: 'r1',
                resourceName: 'v3 최종 패널',
                url: 'https://docs.google.com/document/d/example',
                category: '패널 링크',
                registrant: '김지수 (메모용)',
                version: 'v3'
            },
            {
                id: 'r2',
                resourceName: '레퍼런스 사이트',
                url: 'https://www.pinterest.com/example',
                category: '리서치 사이트',
                registrant: '이철민',
                version: ''
            }
        ]);

        // 샘플 Feeds
        DataManager.saveFeeds([
            {
                id: 'f1',
                title: '2차 크리틱 피드백',
                content: '매스 재검토 필요...',
                type: '피드백',
                authorName: '김지수 (메모용)'
            },
            {
                id: 'f2',
                title: '팀 회의록',
                content: '다음 주까지 모델 작업 완료하기',
                type: '회의록',
                authorName: '김지수'
            }
        ]);

        // 샘플 Events
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        DataManager.saveEvents([
            {
                id: 'e1',
                eventName: '2차 크리틱',
                date: nextWeek.toISOString().split('T')[0]
            },
            {
                id: 'e2',
                eventName: '최종 마감',
                date: nextMonth.toISOString().split('T')[0]
            }
        ]);
    }
}

// 초기화
function init() {
    initSampleData();
    initNavigation();
    initResourceFilters();
    initFeedFilters();
    renderDashboard();
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', init);

