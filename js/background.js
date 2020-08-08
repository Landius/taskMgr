/**
 * a simple backend to
 *   keep the state for sections of app.js
 *   sync data between chrome.storage and app.js
 * 
 * Since chrome extension async api doesn't support promise, use callback
 * function instead of promise.
 */

init();

function init(){
    const storage = chrome.storage.local;
    const defaultData = {
        tasks: [
            {
                "id": 0,
                "quadrant": 0,
                "done": false,
                "title": "重要，紧急",
                "desc": "desc",
                "summary": "summary",
                "timer": [0, 1]
            },
            {
                "id": 1,
                "quadrant": 1,
                "done": false,
                "title": "重要，不急",
                "desc": "desc",
                "summary": "summary",
                "timer": [0, 1]
            },
            {
                "id": 2,
                "quadrant": 2,
                "done": false,
                "title": "不重要，紧急",
                "desc": "desc",
                "summary": "summary",
                "timer": [0, 1]
            },
            {
                "id": 3,
                "quadrant": 3,
                "done": false,
                "title": "不重要，不急",
                "desc": "desc",
                "summary": "summary",
                "timer": [0, 1]
            }
        ],
        timers: [],
        settings: {
            firstSection: 'newtabSection',
            "newtab": {
                "engines": {
                    Baidu: 'https://www.baidu.com/s?ie=utf-8&wd=%s',
                    Google: 'https://www.google.com/search?newwindow=1&q=%s'
            }},
            "task": {
                taskIndex: 4
            },
            "summary": {},
            "timer": {
                default: '45:00',
                timerIndex: 9,
                showTimerSectionIfExist: false
            }
        }
    };
    let data = null;
    getData(null).then(result=>{
        console.log(result);
        Object.keys(result).length != 0 ? data = result : data = defaultData;
    });

    chrome.runtime.onMessage.addListener(handleMsg);

    
    function handleMsg(msg, sender, sendResponse){
        console.log('msg:', msg);
        switch(msg.cmd){
            case 'getStorage':
                sendResponse(data);
                break;
            case 'getTasks':
                sendResponse(data.tasks);
                break;
            case 'getTimers':
                sendResponse(data.timers);
                break;
            case 'getSettings':
                sendResponse(data.settings);
                break;
            case 'setTasks':
                data.tasks = msg.tasks;
                setData({tasks: msg.tasks}).then(sendResponse);
                break;
            case 'setTimers':
                data.timers = msg.timers;
                setData({timers: msg.timers}).then(sendResponse);
                break;
            case 'setSettings':
                data.settings = msg.settings;
                setData({settings: msg.settings}).then(sendResponse);
                break;
        }
    }

    function getData(key){
        return new Promise(function (resolve, reject){
            storage.get(key, result=>{
                const error = chrome.runtime.lastError;
                error ? console.log(error) : resolve(result);
            });
        });
    }

    /**
     * wrap storage.set() with Promise
     * success: resolve(true)
     * fail: resolve(false)
     */
    function setData(obj){
        return new Promise(function (resolve, reject){
            storage.set(obj, ()=>{
                const error = chrome.runtime.lastError;
                error ? console.log(error) & resolve(false) : resolve(true);
            });
        });
    }
}

