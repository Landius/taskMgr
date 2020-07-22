// test data
const storage = {
    "newtab": {
        "engines": {
            Baidu: 'https://www.baidu.com/s?ie=utf-8&wd=%s',
            Google: 'https://www.google.com/search?newwindow=1&q=%s'
        }
    },
    "task": [
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
    "timer": [
        {
            "id": 0,
            "task": 0,
            "totalSec": 1000
        }
    ],
    "setting": {
        "mainSetting":{
            firstSection: 'newtabSection',
            showTimerSectionIfExist: false
        },
        "newtab": {},
        "task": {
            taskIndex: 4
        },
        "summary": {},
        "timer": {
            default: '45:00',
            timerIndex: 9
        }
    }
};