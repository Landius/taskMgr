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
            "newtab": {
                "engines": {
                    Baidu: 'https://www.baidu.com/s?ie=utf-8&wd=%s',
                    Google: 'https://www.google.com/search?newwindow=1&q=%s'
            }},
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
        browser.tabs.create({url: 'index.html'});
    });
    chrome.runtime.onMessage.addListener(handleMsg);
    
    function handleMsg(msg, sender, sendResponse){
        console.log('msg:', msg);
        switch(msg.cmd){
            case 'getData':
                sendResponse(data);
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

