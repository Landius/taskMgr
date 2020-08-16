/**
 * a simple backend to keep state of app.js
 */

init();

function init(){
    const storage = chrome.storage.local;
    const defaultData = {
        tasks: [
            {
                "id": 0,
                "quadrant": 0,
                "done": 0,
                "title": "重要，紧急",
                "desc": "desc",
                "note": "note",
                "bookmark": false
            },
            {
                "id": 1,
                "quadrant": 1,
                "done": 0,
                "title": "重要，不急",
                "desc": "desc",
                "note": "note",
                "bookmark": false
            },
            {
                "id": 2,
                "quadrant": 2,
                "done": 0,
                "title": "不重要，紧急",
                "desc": "desc",
                "note": "note",
                "bookmark": false
            },
            {
                "id": 3,
                "quadrant": 3,
                "done": 0,
                "title": "不重要，不急",
                "desc": "desc",
                "note": "note",
                "bookmark": false
            }
        ],
        timers: [
            {
                "id": 0,
                "timing": "45:00",
                "taskId": 0
            }
        ],
        settings: {
            firstSection: 'taskSection',
            "task": {
                taskIndex: 4
            },
            "note": {},
            "timer": {
                default: '45:00',
                timerIndex: 9,
                showTimerSectionIfExist: false
            }
        }
    };
    let data = null;
    getData(null).then(result=>{
        data = Object.keys(result).length != 0 ? result : defaultData;
    }).catch(error=>{
        console.error(error);
        data = defaultData;
    });

    chrome.browserAction.onClicked.addListener(tab=>{
        chrome.tabs.create({url: 'index.html'});
    });
    chrome.runtime.onMessage.addListener(handleMsg);
    
    function handleMsg(msg, sender, sendResponse){
        console.log('msg:', msg);
        switch(msg.cmd){
            case 'getData':
                sendResponse(data);
                break;
            case 'addTask':
                data.tasks.push(msg.task);
                setData(data);
                break;
            case 'updateTask':
                for(const i in data.tasks){
                    if(data.tasks[i].id == msg.task.id){
                        data.tasks[i] = msg.task;
                        break;
                    }
                }
                setData(data);
                break;
            case 'removeTask':
                for(const i in data.tasks){
                    if(data.tasks[i].id == msg.id){
                        data.tasks.splice(i, 1);
                        break;
                    }
                }
                setData(data);
                break;
            case 'submitTimer':
                data.timers.push(msg.timer);
                setData(data);
                break;
       }
    }

    /**
     * wrap storage.get()/set() with Promise
     */
    function getData(key){
        return new Promise(function (resolve, reject){
            storage.get(key, result=>{
                const error = chrome.runtime.lastError;
                error ? reject(error) : resolve(result);
            });
        });
    }

    function setData(obj){
        return new Promise(function (resolve, reject){
            storage.set(obj, ()=>{
                const error = chrome.runtime.lastError;
                error ? reject(error) : resolve();
            });
        });
    }
}

