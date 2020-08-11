// components
const newtabSection = {
    mounted: function (){
        this.updateTime();
        const i = setInterval(this.updateTime, 1000);
        document.querySelector('#search-input').focus();
    },
    data: function (){
        return {
            time: '00:00',
            searchText: ''
        }
    },
    computed: {
        engines: function (){
            return this.$store.state.storage.settings.newtab.engines;
        }
    },
    methods:{
        search: function (e){
            console.log(e.type);
            if(e.type == 'click' && e.target.tagName === 'BUTTON'){
                const name = e.target.innerText;
                const url = this.engines[name].replace('%s', this.searchText);
                window.location.href = url;
            }else if(e.type == 'keyup' && e.key == 'Enter'){
                for(let name in this.engines){
                    const url = this.engines[name].replace('%s', this.searchText);
                    window.location.href = url;
                    break;
                }
            }
        },
        updateTime: function (){
            const date = new Date();
            let h = date.getHours();
            let m = date.getMinutes();
            h = (h < 10 ? '0' + h : '' + h);
            m = (m < 10 ? '0' + m : '' + m);
            this.time = (this.time.includes(':') ? (h + ' ' + m) : (h + ':' + m));
        }
    },
    template: `
        <section id="newtab">
            <div id="time-widget">
                <time>{{time}}</time>
            </div>
            <div id="search-form" @click="search">
                <input type="text" placeholder="some text" id="search-input" v-model="searchText" @keyup="search">
                <div id="engine-buttons">
                    <button class="small-btn" v-for="(engine, name) of engines">
                        {{name}}
                    </button>
                </div>
            </div>
        </section>`
};
const taskSection = {
    computed: {
        taskData: function (){
            let taskData = {
                'quadrant-0': [],
                'quadrant-1': [],
                'quadrant-2': [],
                'quadrant-3': []
            };
            for(let task of this.$store.state.storage.tasks){
                if(task.done == 0){
                    let key = 'quadrant-' + task.quadrant;
                    taskData[key].push(task);
                }
            }
            return taskData;
        }
    },
    template: `
        <section id="task">
            <div v-for="(tasks, name) of taskData"
                :id="name" 
                class="quadrant">
                <div is="task-container" :tasks="tasks"></div>
            </div>
        </section>`
};
const noteSection = {
    computed: {
        markedTasks: function () {
            console.log('markedTasks: data changed');
            return this.$store.state.storage.tasks.filter(task=>{
                return task.done > 0 && task.bookmark;
            }).sort((a, b)=>{
                return b.done - a.done;
            });
        },
        leftTasks: function () {
            return this.$store.state.storage.tasks.filter(task=>{
                return task.done > 0 && !task.bookmark;
            }).sort((a, b)=>{
                return b.done - a.done;
            });
        }
    },
    template: `
        <section id="note">
        <div id="marked-tasks-wr">
            <div is="task-container" :tasks="markedTasks"></div>
        </div>
        <div id="left-tasks-wr">
            <div is="task-container" :tasks="leftTasks"></div>
        </div>
        </section>`
};
const timerSection = {
    data: function () {
        return {
            timeInput: ''
        };
    },
    computed: {
        timeStr: function () {
            return this.$store.state.timer.timeStr;
        },
        showEditBtn: function () {
            const timer = this.$store.state.timer;
            return timer.currentState == timer.state.EMPTY 
                || timer.currentState == timer.state.PAUSED;
        },
        showStartBtn: function(){
            const timer = this.$store.state.timer;
            return timer.currentState == timer.state.PAUSED 
                || timer.currentState == timer.state.EMPTY;
        },
        showPauseBtn: function () {
            const timer = this.$store.state.timer;
            return timer.currentState == timer.state.RUNNING;
        },
        showTrashBtn: function () {
            const timer = this.$store.state.timer;
            return timer.currentState == timer.state.PAUSED;
        },
        showDoneBtn: function () {
            const timer = this.$store.state.timer;
            return timer.currentState == timer.state.EDITING;
        },
        showSubmitBtn: function () {
            const timer = this.$store.state.timer;
            return timer.currentState == timer.state.FINISHED;
        },
        unfinishTasks: function () {
            const tasks = [];
            for(const task of this.$store.state.storage.tasks){
                if(task.done == 0){
                     tasks.push(task);
                }
            }
            return tasks;
        },
        linkedTask: function () {
            for(const task of this.$store.state.storage.tasks){
                if(task.id == this.$store.state.timer.taskId){
                    return [task];
                }
            }
        }

    },
    methods: {
        editTimer: function (){
            this.$store.commit('editTimer');
            this.focusTimeInput();
        },
        doneEditing: function () {
            let totalSec = this.str2Time(this.timeInput || this.timeStr);
            let timeStr = this.time2Str(totalSec);
            this.timeInput = '';
            if(totalSec == null){
                this.$store.commit('showNotify', {
                    msg:'时间格式错误',
                    confirmCallback: this.focusTimeInput,
                    cancelCallback: this.focusTimeInput
                });
            }else if(totalSec <= 0){
                this.$store.commit('showNotify', {
                    msg:'时间须大于零', 
                    confirmCallback: this.focusTimeInput,
                    cancelCallback: this.focusTimeInput
                });
            }else{
                let newTimer = {timeStr, totalSec};
                this.$store.commit('addTimer', newTimer);
            }
        },
        startTimer: function () {
            const timer = this.$store.state.timer;
            const totalSec = this.str2Time(timer.timeStr);
            const beginTimeStamp = (new Date()).getTime();
            const counterId = setInterval(()=>{
                const elapsed = Math.round(((new Date()).getTime() - beginTimeStamp)/1000);
                let timeStr = this.time2Str(totalSec - elapsed);
                if(timer.timeStr.includes(':')){
                    timeStr = timeStr.replace(':', ' ');
                }
                this.$store.commit('updateTimer', timeStr);
                if(timeStr == '00:00' || timeStr == '00 00'){
                    this.$store.commit('finishTimer');
                }
            }, 1000);
            if(timer.currentState == timer.state.PAUSED){
                this.$store.commit('startTimer', {beginTimeStamp, counterId});
            }else{
                // init timer.totalSec if not start after paused
                this.$store.commit('startTimer', {beginTimeStamp, counterId, totalSec});
            }
        },
        pauseTimer: function () {
            this.$store.commit('pauseTimer');
        },
        removeTimer: function () {
            this.$store.commit('removeTimer');
        },
        submitTimer: function () {
            this.$store.commit('submitTimer');
        },
        str2Time: function (timerStr) {
            let time = null;
            let arr = timerStr.replace(' ', ':').split(':');
            if(arr.length == 1 && 
                isNaN(parseFloat(arr[0])) == false){
                time = Math.round(parseFloat(arr[0]) * 60);
            }else if(arr.length == 2 && 
                isNaN(parseFloat(arr[0])) == false &&
                isNaN(parseFloat(arr[1])) == false){
                    time = Math.round(parseFloat(arr[0]) * 60);
                    time += Math.round(parseFloat(arr[1]));
            }
            return time;
        },
        time2Str: function (time) {
            let min = Math.floor(time / 60);
            let sec = time % 60;
            min = min < 10 ? '0' + min : min;
            sec = sec < 10 ? '0' + sec : sec;
            return min + ':' + sec;
        },
        focusTimeInput: function () {
            setTimeout(()=>{
                document.querySelector('#time-container>input.editing').focus();
            }, 0);
        }
    },
    template: `
        <div id="timer">
            <div id="time-container">
                <time v-show="!showDoneBtn">{{timeStr}}</time>
                <input v-show="showDoneBtn" v-model="timeInput" :style="'width:'+timeStr.length+'ch'" class="editing" :placeholder="timeStr"></input>
            </div>
            <div id="timer-controllers">
                <button v-show="showEditBtn" @click="editTimer" id="edit-timer" class="edit-icon medium-btn"></button>
                <button v-show="showStartBtn" @click="startTimer" id="start-timer" class="play-icon medium-btn"></button>
                <button v-show="showPauseBtn" @click="pauseTimer" id="pause-timer" class="pause-icon medium-btn"></button>
                <button v-show="showTrashBtn" @click="removeTimer" id="remove-timer" class="trash-icon medium-btn"></button>
                <button v-show="showDoneBtn" @click="doneEditing" id="finish-edit-timer" class="checked-icon medium-btn"></button>
                <button v-show="showSubmitBtn" @click="submitTimer" id="submit-timer" class="checked-icon medium-btn"></button>
            </div>
            <div id="timer-history"></div>
            <div class="linked-tasks" v-show="!showDoneBtn">
                <div is="task-container" :tasks="linkedTask"></div>
            </div>
            <div class="unfinish-tasks" v-show="showDoneBtn">
                <div is="task-container" :tasks="unfinishTasks"></div>
            </div>
        </div>`
};
const settingSection = {
    template: ``
};
const taskContainer = {
    props: ['tasks'],
    template: `
        <div class="task-container">
            <div is="task-item" v-for="(task, key) in tasks"
                :task="task"
                :key="key">
            </div>
        </div>
    `,
    components: {
        'task-item': {
            props: ['task'],
            computed: {
                selected: function () {
                    return this.$store.state.selected.taskIds.includes(this.task.id);
                },
                linked: function () {
                    return this.$store.state.timer.taskId == this.task.id;
                }
            },
            methods: {
                takeNote: function () {
                    this.$store.commit('showDetail', this.task.id);
                },
                markTask: function () {
                    this.$store.commit('markTask', this.task.id);
                },
                showDetail: function (){
                    this.$store.commit('showDetail', this.task.id);
                },
                doneTask: function (){
                    this.$store.commit('doneTask', this.task.id);
                    this.$store.commit('unselectTask', this.task.id);
                },
                selectTask: function (){
                    if(this.$store.state.selected.taskIds.includes(this.task.id)){
                        this.$store.commit('unselectTask', this.task.id);
                    }else{
                        this.$store.commit('selectTask', this.task.id);
                    }
                },
                linkTimer: function () {
                    if(this.$store.state.timer.taskId != this.task.id){
                        this.$store.commit('linkTimer', this.task.id);
                    }else{
                        this.$store.commit('linkTimer', -1);
                    }
                },
                removeTask: function () {
                    this.$store.commit('removeTask', this.task.id);
                }
            },
            template: `
                <div class="task-item" :class="'task-item-q-' + task.quadrant">
                    <div class="selector-wr">
                        <div @mousedown="selectTask" class="selector" :class="{selected: selected}"></div>
                    </div>
                    <div class="task-title-wr">
                        <div class="task-title">{{task.title}}</div>
                    </div>
                    <div class="link-wr icon-wr" :class="{linked: linked}">
                        <div @click="linkTimer" class="link link-icon"></div>
                    </div>
                    <div class="note-wr icon-wr">
                        <div @click="takeNote" class="note note-icon"></div>
                    </div>
                    <div class="bookmark-wr icon-wr">
                        <div @click="markTask" class="bookmark bookmark-icon"></div>
                    </div>
                    <div class="done-wr icon-wr">
                        <div @click="doneTask" class="done checked-icon"></div>
                    </div>
                    <div class="remove-wr icon-wr">
                        <div @click="removeTask" class="remove trash-icon"></div>
                    </div>
                    <div class="detail-wr icon-wr">
                        <div @click="showDetail" class="detail detail-icon"></div>
                    </div>
                </div>`
        }
    }
};
const taskDetail = {
    data: function (){
        let template = {id: -1, title: '', desc: '', note: '', bookmark: false, timmer: [], quadrant: -1, done: 0};
        return {
            template: template,
            task: {...template}
        }
    },
    computed: {
        showPopup: function (){return this.$store.state.taskDetail.showPopup;}
    },
    watch: {
        showPopup: function (){
            this.task = {...this.template};
            let id = this.$store.state.taskDetail.taskId;
            this.task.id = id;
            for(let task of this.$store.state.storage.tasks){
                if(task.id == id){
                    this.task = {...task};
                }
            }
        }
    },
    methods: {
        submitTask: function (){
            if(this.task.title == ''){
                this.$store.commit('showNotify', {msg:'标题不能为空！'});
                return ;
            }else if(this.task.quadrant == -1){
                this.$store.commit('showNotify', {msg:'分类不能为空！'});
                return ;
            }
            const tasks = this.$store.state.storage.tasks;
            let index = -1;
            for(let i=0; i<tasks.length; i++){
                if(this.task.id == tasks[i].id){
                    index = i;
                    break;
                }
            }
            if(index == -1){
                this.$store.commit('addTask', this.task);
            }else{
                this.$store.commit('modifyTask', {index: index, task: this.task});
            }
            this.hidePopup();
        },
        hidePopup: function (){
            this.$store.commit('hideDetail');
        },
        getSpanClass: function(num){
            const classObject = {};
            const class1 = 'quadrant-input-' + num;
            const class2 = 'selected';
            classObject[class1] = true;
            classObject[class2] = (num == this.task.quadrant);
            return classObject;
        },
        changeQuadrant: function (e){
            if(e.target.tagName == 'SPAN' && this.task.done == 0){
                this.task.quadrant = Number(e.target.dataset.quadrant);
            }
        }
    },
    template: `
    <div class="popup-layer" v-show="showPopup">
        <div id="detail-container">
            <div>
                <div>标题</div>
                <div>
                    <input type="text" v-model="task.title" placeholder="事项" :readonly="this.task.done>0">
                    </div>
            </div>
            <div>
                <div>描述</div>
                <div>
                    <textarea id="task-desc-input" v-model="task.desc" placeholder="事项描述" :readonly="this.task.done>0"></textarea>
                </div>
            </div>
            <div>
                <div>记录</div>
                <div>
                    <textarea id="task-note-input" v-model="task.note" placeholder="事项总结"></textarea>
                </div>
            </div>
            <div>
                <div>分类</div>
                <div id="task-quadrant-input" @click="changeQuadrant">
                    <span v-for="num in [0,1,2,3]"
                        :class="getSpanClass(num)"
                        :data-quadrant="num">
                    </span>
                </div>
            </div>
            <div>
                <button @click="submitTask" class="confirm medium-btn">确认</button>
                <button @click="hidePopup" class="cancel medium-btn">取消</button>
            </div>
        </div>
    </div>`
};
const notifyContainer = {
    computed: {
        show: function () {
            return this.$store.state.notify.show;
        },
        title: function () {
            return this.$store.state.notify.title;
        },
        msg: function () {
            return this.$store.state.notify.msg;
        },
        type: function () {
            return this.$store.state.notify.type;
        }
    },
    methods: {
        confirm: function () {
            this.$store.commit('hideNotify', 'confirm');
        },
        cancel: function () {
            this.$store.commit('hideNotify', 'cancel');
        }
    },
    template: `
        <div v-show="show" id="notify-container">
            <div id="notify">
                <div id="notify-top">
                    <span>{{title}}</span>
                </div>
                <div id="notify-main">
                    <span>{{msg}}</span>
                </div>
                <div id="notify-bottom">
                    <button @click="confirm" class="medium-btn">确认</button>
                    <button @click="cancel" class="medium-btn">取消</button>
                </div>
            </div>
        </div>`
};