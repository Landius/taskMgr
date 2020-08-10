Vue.component('task-container', taskContainer);
Vue.component('task-detail', taskDetail);
Vue.component('notify-container', notifyContainer);
// Vue.use(Vuex); // no need in if Vuex is declared via <script> element
let store;
chrome.runtime.sendMessage({cmd: 'getStorage'}, storage=>{

store = new Vuex.Store({
    strict: true,
    state: {
        storage: storage,
        app: {
            currentSection: storage.settings.firstSection
        },
        selected: {
            taskIds: []
        },
        taskDetail: {
            showPopup: false,
            taskId: -1
        },
        notify: {
            show: false,
            title: '',
            msg: '',
            type: '',
            confirmCallback: null,
            cancelCallback: null
        },
        timer: {
            state: {EMPTY: 0, EDITING: 1, RUNNING: 2, PAUSED: 3, FINISHED: 4},
            currentState: 0,
            totalSec: 0,
            timeStr: storage.settings.timer.default,
            beginTimeStamp: 0,
            taskId: -1,
            counterId: -1
        }
    },
    mutations: {
        switchSection: function (state, section){
            state.app.currentSection = section;
        },
        selectTask: function (state, id){
            state.selected.taskIds.push(id);
        },
        unselectTask: function(state, id){
            const index = state.selected.taskIds.indexOf(id);
            state.selected.taskIds.splice(index, 1);
        },
        doneTask: function(state, id){
            for(let task of state.storage.tasks){
                if(task.id == id){
                    task.done = (new Date ()).getTime();
                }
            }
        },
        markTask: function (state, id) {
            for(let task of state.storage.tasks){
                if(task.id == id){
                    task.bookmark = true;
                }
            }
        },
        takeNote: function (state, id) {
            // todo, show specified task with panel
        },
        showDetail: function (state, id){
            state.taskDetail.taskId = id;
            state.taskDetail.showPopup = true;
        },
        hideDetail: function (state){
            state.taskDetail.taskId = -1;
            state.taskDetail.showPopup = false;
        },
        modifyTask: function (state, payload){
            Vue.set(state.storage.tasks, payload.index, {...payload.task});
        },
        addTask: function (state, task){
            state.storage.tasks.push({...task});
            state.storage.settings.task.taskIndex += 1;
        },
        removeTask: function (state, id) {
            const tasks = state.storage.tasks;
            for(let i=0; i<tasks.length; i++){
                if(tasks[i].id == id){
                    tasks.splice(i, 1);
                }
            }
        },
        linkTimer: function (state, taskId) {
            state.timer.taskId = taskId;
        },
        editTimer: function (state) {
            state.timer.currentState = state.timer.state.EDITING;
        },
        addTimer: function (state, newTimer) {
            const timer = state.timer;
            timer.currentState = timer.state.EMPTY;
            timer.totalSec = newTimer.totalSec;
            timer.timeStr = newTimer.timeStr;
            timer.beginTimeStamp = 0;
        },
        startTimer: function (state, payload) {
            const timer = state.timer;
            if(payload.totalSec != undefined){
                timer.totalSec = payload.totalSec;
            }
            timer.counterId = payload.counterId;
            timer.beginTimeStamp = payload.beginTimeStamp;
            timer.currentState = timer.state.RUNNING;
        },
        updateTimer: function (state, timeStr) {
            const timer = state.timer;
            timer.timeStr = timeStr;
        },
        pauseTimer: function (state) {
            const timer = state.timer;
            timer.currentState = timer.state.PAUSED;
            clearInterval(timer.counterId);
        },
        removeTimer: function (state, id) {
            const timer = state.timer;
            timer.currentState = timer.state.EMPTY;
            timer.timeStr = state.storage.settings.timer.default;
            timer.totalSec = 0;
            timer.beginTimeStamp = 0;
            timer.taskId = -1;
            timer.timerId = -1;
        },
        finishTimer: function (state) {
            const timer = state.timer;
            clearInterval(timer.counterId);
            timer.counterId = -1;
            timer.currentState = timer.state.FINISHED;
            timer.totalSec = 0;
            timer.beginTimeStamp = 0;
        },
        submitTimer: function (state) {
            const timer = state.timer;
            timer.currentState = timer.state.EMPTY;
            timer.timeStr = state.storage.s.timer.default;
            timer.taskId = -1;
            timer.timerId = -1;
            // todo
        },
        showNotify: function (state, payload){
            const notify = state.notify;
            notify.title = payload.title || '';
            notify.msg = payload.msg;
            notify.type = payload.type || '';
            // only arrow function is allowed since its *this* won't change
            notify.confirmCallback = payload.confirmCallback || null;
            notify.cancelCallback = payload.cancelCallback || null;
            state.notify.show = true;
        },
        hideNotify: function (state, response){
            const notify = state.notify;
            if(response == 'confirm' && notify.confirmCallback){
                notify.confirmCallback();
                notify.confirmCallback = null;
            }else if(response == 'cancel' && notify.cancelCallback){
                notify.cancelCallback();
                notify.cancelCallback = null;
            }
            state.notify.show = false;
            state.notify.title = '';
            state.notify.msg = '';
            state.notify.type = '';
        }
    }
});

let app = new Vue({
    el: '#vue-app',
    store: store,
    computed: {
        sectionComponent: function (){return this.$store.state.app.currentSection},
        showAddBtn: function () {
            return this.$store.state.selected.taskIds.length == 0 && 
                this.sectionComponent == 'taskSection';
        },
        showRemoveBtn: function (){
            return show = this.$store.state.selected.taskIds.length > 0 && 
                (this.sectionComponent == 'taskSection' || this.sectionComponent == 'noteSection');
        }
    },
    methods: {
        switchSection: function (e){
            let t = e.target;
            if(t.tagName === 'BUTTON'){
                let section = null;
                switch (t.id) {
                    case 'switch-newtab':
                        section = 'newtabSection';
                        break;
                    case 'switch-task':
                        section = 'taskSection';
                        break;
                    case 'switch-note':
                        section = 'noteSection';
                        break;
                    case 'switch-timer':
                        section = 'timerSection';
                        break;
                    case 'switch-setting':
                        section = 'settingSection';
                        break;
                    default:
                        break;
                }
                this.$store.commit('switchSection', section);
            }
        },
        addTask: function () {
            this.$store.commit('showDetail', this.$store.state.storage.settings.task.taskIndex);
        },
        removeTasks: function (){
            let removeList = [];
            for(const task of this.$store.state.storage.tasks){
                if(this.$store.state.selected.taskIds.includes(task.id)){
                    // don't modify storage.task during iteration
                    removeList.push(task.id);
                    this.$store.commit('unselectTask', task.id);
                }
            }
            for(let id of removeList){
                this.$store.commit('removeTask', id);
            }
        }
    },
    components: {
        newtabSection: newtabSection,
        taskSection: taskSection,
        noteSection: noteSection,
        timerSection: timerSection,
        settingSection: settingSection
    }
});

});