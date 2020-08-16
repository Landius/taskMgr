Vue.component('task-container', taskContainer);
Vue.component('task-detail', taskDetail);
Vue.component('notify-container', notifyContainer);
// Vue.use(Vuex); // no need in if Vuex is declared via <script> element
let store;
chrome.runtime.sendMessage({cmd: 'getData'}, data=>{

store = new Vuex.Store({
    strict: true,
    state: {
        data: data,
        currentSection: data.settings.firstSection,
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
            timing: data.settings.timer.default,
            remainingSec: 0,
            beginTimeStamp: 0,
            taskId: -1,
            counterId: -1
        }
    },
    mutations: {
        switchSection: function (state, section){
            state.currentSection = section;
        },
        selectTask: function (state, id){
            state.selected.taskIds.push(id);
        },
        unselectTask: function(state, id){
            const index = state.selected.taskIds.indexOf(id);
            state.selected.taskIds.splice(index, 1);
        },
        doneTask: function(state, id){
            for(let task of state.data.tasks){
                if(task.id == id){
                    task.done = (new Date ()).getTime();
                }
            }
        },
        markTask: function (state, id) {
            for(let task of state.data.tasks){
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
            Vue.set(state.data.tasks, payload.index, {...payload.task});
        },
        addTask: function (state, task){
            state.data.tasks.push({...task});
            state.data.settings.task.taskIndex += 1;
        },
        removeTask: function (state, id) {
            const tasks = state.data.tasks;
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
        addTimer: function (state, timing) {
            const timer = state.timer;
            timer.timing = timing;
            timer.currentState = timer.state.EMPTY;
        },
        startTimer: function (state, payload) {
            const timer = state.timer;
            timer.counterId = payload.counterId;
            timer.beginTimeStamp = payload.beginTimeStamp;
            timer.currentState = timer.state.RUNNING;
        },
        pauseTimer: function (state, remainingSec) {
            const timer = state.timer;
            timer.currentState = timer.state.PAUSED;
            timer.remainingSec = remainingSec;
            clearInterval(timer.counterId);
        },
        removeTimer: function (state, id) {
            const timer = state.timer;
            timer.currentState = timer.state.EMPTY;
            timer.timing = state.data.settings.timer.default;
            timer.remainingSec= 0;
            timer.beginTimeStamp = 0;
            timer.taskId = -1;
            timer.timerId = -1;
        },
        finishTimer: function (state) {
            const timer = state.timer;
            clearInterval(timer.counterId);
            timer.counterId = -1;
            timer.currentState = timer.state.FINISHED;
            timer.remainingSec = 0;
            timer.beginTimeStamp = 0;
        },
        submitTimer: function (state) {
            const timer = state.timer;
            state.data.push({id: timer.timerId, timing: timer.timing, taskId: timer.taskId});
            timer.currentState = timer.state.EMPTY;
            timer.timing = state.data.s.timer.default;
            timer.taskId = -1;
            timer.timerId = -1;
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
        sectionComponent: function (){return this.$store.state.currentSection},
        showAddBtn: function () {
            console.log(this.$store.state.selected.taskIds.length == 0 && 
                this.sectionComponent == 'taskSection');
            return this.$store.state.selected.taskIds.length == 0 && 
                this.sectionComponent == 'taskSection';
        },
        showRemoveBtn: function (){
            return this.$store.state.selected.taskIds.length > 0 && 
                (this.sectionComponent == 'taskSection' || this.sectionComponent == 'noteSection');
        }
    },
    methods: {
        switchSection: function (e){
            let t = e.target;
            if(t.tagName === 'BUTTON'){
                let section = null;
                switch (t.id) {
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
            this.$store.commit('showDetail', this.$store.state.data.settings.task.taskIndex);
        },
        removeTasks: function (){
            let removeList = [];
            for(const task of this.$store.state.data.tasks){
                if(this.$store.state.selected.taskIds.includes(task.id)){
                    // don't modify data.task during iteration
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
        taskSection: taskSection,
        noteSection: noteSection,
        timerSection: timerSection,
        settingSection: settingSection
    }
});

});