var _default = {
    bgColor: 'rgb(200,200,200)',
    elemID: 'exp',
    elemStyle: {
        width: '800px',
        height: '600px',
        border: '1px solid #000',
    },
    debug: true,
};


let debuger = {
    init: function () {
        this.debugDiv = this.createDebugDiv();
    },

    createDebugDiv: function () {
        let deDiv = document.createElement('div');
        deDiv.id = 'debug';
        // deDiv.classList.add('debug');
        document.body.appendChild(deDiv);
        return deDiv;
    },

    dispInfo: function (info, ts = performance.now()) {
        this.debugDiv.innerText = `${ts}: ${info}\n` + this.debugDiv.innerText;
    },
}

const LogLevel = {
    console: 0x1,
    file: 0x2,
    div: 0x4,
    other: 0x8
};

var logger = {

    logs: [],

    init: function (lv = 0) {
        this.level = lv;
        if (this.level & LogLevel.div) {
            debuger.init();
        }
        return this;
    },

    set log(log) {
        let ts = performance.now();
        this.logs.push(`${ts}: ${log}`);
        if (this.level & LogLevel.console) {
            console.log(`${ts}: ${log}`);
        }
        if (this.level & LogLevel.div) {
            debuger.dispInfo(log, ts);
        }
        if (this.level & LogLevel.file) {
            //write to log file
        }
        if (this.level & LogLevel.other) {
            //do sth...
        }
    },

    get log() {
        return this.logs;
    },

    // getlog(idx){
    //     idx = parseInt(idx);
    //     if(!this.logs){
    //         return [];
    //     }
    //     if(!idx || idx<0 || idx >= this.logs.length){
    //         return false;
    //     }
    //     return this.logs[idx];
    // },
};


var jspsycho = {
    expRootElem: {},
    expElems: [],
    showIdx: 0,
    hideIdx: 1,
    expItemDOMs: [],
    hasChange: false,

    kb_press: false,

    get lastDOM() {
        if (this.expItemDOMs.length > 0) {
            return this.expItemDOMs[this.expItemDOMs.length - 1];
        } else {
            return {};
        }
    },

    init: function ({ bgColor = 'rgb(200,200,200)',
        elemID = 'exp',
        elemStyle = { width: '800px', height: '600px', border: '1px solid #000', },
        loglv = 0,
        debug = true, } = {}) {

        if (debug) {
            loglv = loglv | LogLevel.div;
        }

        logger.init(loglv);

        // logger.log = 'init starting...';
        document.body.style.backgroundColor = bgColor;
        this.expRootElem = document.getElementById(elemID);
        for (let k in elemStyle) {
            this.expRootElem.style[k] = elemStyle[k];
        }

        for (let idx = 0; idx < 2; idx++) {
            this.expElems[idx] = document.createElement('div');
            this.expElems[idx].classList.add("exp-container");
            this.expRootElem.appendChild(this.expElems[idx]);
        }

        this.currShowedElemID = 0;
        // logger.log = ('init completed.');
    },

    waitMiSec: function (ms = 0) {
        // logger.log = (`wait ${ms} ms`);
        // let ts = performance.now();
        return new Promise(resolve => {
            setTimeout((ts)=>{
                resolve({e: false, s: ts, dur: (performance.now()-ts)});
            }, ms, performance.now()); //performance.now() 返回的是 setTimeout 开始运行的时间
        });
    },

    waitKB: function () {
        // logger.log = (`wait key press...`);
        let ts = performance.now();
        return new Promise(resolve => {
            window.addEventListener(
                'keypress',
                (ev)=>{
                    resolve({e: ev, s: ts, dur: (performance.now()-ts)});
                },                
                { once: true }); 
        });

    },

    waitKBMiSec: function (ms = 0) {
        // logger.log = (`wait key press and ${ms} ms`);
        let ms_p = this.waitMiSec(ms);
        let kb_p = this.waitKB()
        return Promise.race([ms_p, kb_p])
    },

    waitKBSecsA: function (ms = 0) {
        // logger.log = (`wait key press and ${ms} ms`);
        let ms_p = this.waitMiSec(ms);
        let kb_p = this.waitKB()
        return Promise.all([ms_p, kb_p])
    },

	waitClick: function (objs = false) {
        // logger.log = (`wait click`);
        let ts = performance.now();
        if (!objs) {
            return new Promise(resolve => {
                document.addEventListener(
                    'click',
                    (ev) => {
                        resolve({ e: ev, s: ts, dur: (performance.now() - ts) });
                    },
                    { once: true });
            });
        } else {
            var promiseAll = objs.map(function (obj, idx) {
                return new Promise(function (resolve, reject) {
                    obj.addEventListener(
                        'click',
                        (ev) => {
                            resolve({ e: ev, s: ts, dur: (performance.now() - ts), idx: idx });
                        },
                        { once: true });
                });
            });
            return Promise.race(promiseAll);
        }
    },
	
	
    flip: function ({ ts = performance.now(), cls = true } = {}) {
        let self = this;
        return new Promise((resolve) => {
            setTimeout(() => {
                [self.showIdx, self.hideIdx] = [self.hideIdx, self.showIdx];
                // move hide and show to render 
                // self.expElems[self.hideIdx].style.display = 'none';
                // self.expElems[self.showIdx].style.display = 'block';

                if (cls) {
                    self.cleanScreen(self.hideIdx);
                }
                // logger.log = (`flip to ${self.showIdx}`);
                self.hasChange = true;
                resolve();
            }, 0);
        });
    },

    render: function ({ ts = performance.now(), cls = true } = {}) {
        let self = this;
        return new Promise((resolve) => {
            setTimeout(() => {
                if (self.hasChange) {
                    // logger.log = (`render screen ${self.showIdx}`);
                    self.expElems[self.hideIdx].style.display = 'none';
                    self.expElems[self.showIdx].style.display = 'block';
                    self.hasChange = false;

                    // window.requestAnimationFrame(jspsycho.render);
                }
                resolve();
            }, 0);
        });
    },

    fillText: function ({ content = 'this is a text', x = 0, y = 0, w = -1, h = -1, wrapper = 'div', styles = {}, class_=[] } = {}) {
        let textObj = this.createDOMObj(wrapper, x, y, w, h, styles);
        this.expItemDOMs.push(textObj);
        textObj.innerHTML = content;
        for(let cl of class_){
            textObj.classList.add(cl);
        }
        this.addItemToDOM(textObj);
        return textObj;
    },

    fillImg: function ({ url = '', x = 0, y = 0, w = -1, h = -1, alt = 'image', styles = {}, class_=[] } = {}) {
        let imgObj = this.createDOMObj('img', x, y, w, h, styles);
        imgObj.alt = alt;
        this.expItemDOMs.push(imgObj);
        imgObj.src = url;
        for(let cl of class_){
            imgObj.classList.add(cl);
        }
        this.addItemToDOM(imgObj);
        return imgObj;
    },

    fillCircle: function ({ x = 0, y = 0, w = 50, h = 50, bgColor = 'red', styles = {} } = {}) {
        let circleObj = this.createDOMObj('div', x, y, w, h, styles);
        circleObj.classList.add('circle');
        circleObj.style.backgroundColor = bgColor;
        this.expItemDOMs.push(circleObj);
        this.addItemToDOM(circleObj);
        return circleObj;
    },

    fillRectangle: function ({ x = 0, y = 0, w = 80, h = 50, bgColor = 'red', styles = {} } = {}) {
        let rectObj = this.createDOMObj('div', x, y, w, h, styles);
        rectObj.classList.add('rectangle');
        rectObj.style.backgroundColor = bgColor;
        this.expItemDOMs.push(rectObj);
        this.addItemToDOM(rectObj);
        return rectObj;
    },

    playSound: function ({ start = 0, during = 1, freq = 440, gain = 0.5, oscType = 'sine' } = {}) {
        // 参考：https://cloud.tencent.com/developer/ask/65582
        let context = new (window.AudioContext || window.webkitAudioContext)();
        let osc = context.createOscillator();  // instantiate an oscillator

        osc.type = oscType; // this is the default - also square, sawtooth, triangle
        osc.frequency.value = freq; // Hz

        // 调整音量
        let vol = context.createGain();
        // from 0 to 1, 1 full volume, 0 is muted
        vol.gain.value = gain;

        osc.connect(vol); // connect osc to vol
        osc.connect(context.destination); // connect it to the destination

        osc.start(context.currentTime + start); // start the oscillator
        osc.stop(context.currentTime + during); // stop seconds after the current time
    },

    putObjToCenter: function (obj) {
        let _rw = parseInt(this.expRootElem.style.width),
            _rh = parseInt(this.expRootElem.style.height),
            _ow = parseInt(obj.style.width) || obj.width || obj.naturalWidth || obj.offsetWidth,
            _oh = parseInt(obj.style.height) || obj.height || obj.naturalHeight || obj.offsetHeight;

        let _top = (_rh - _oh) / 2,
            _left = (_rw - _ow) / 2;

        obj.style.top = _top + 'px';
        obj.style.left = _left + 'px';
        this.hasChange = true;
    },

    rotateObj: function (obj, r) {
        // https://blog.csdn.net/y396397735/article/details/80343931
        let _css = `rotate(${r}deg)`;
        obj.style.webkitTransform = _css;   /* Safari 和 Chrome */
        obj.style.mozTransform = _css;      /* Firefox */
        obj.style.msTransform = _css;       /* IE 9 */
        obj.style.oTransform = _css;        /* Opera */
        obj.style.transform = _css;
        this.hasChange = true;
    },

    //清空一个元素，即删除一个元素的所有子元素
    removeAllChild: function (obj) {
        //当div下还存在子节点时 循环继续
        while (obj.hasChildNodes()) {
            obj.removeChild(obj.firstChild);
        }
    },

    cleanScreen: function (clsIdx, ts = performance.now()) {
        if (clsIdx === undefined) {
            clsIdx = this.showIdx;
        } else if (clsIdx < 0 || clsIdx >= this.expElems.length) {
            clsIdx = this.showIdx;
        }
        // logger.log = (`clear screen ${clsIdx}`);
        this.removeAllChild(this.expElems[clsIdx]);
        this.hasChange = true;
    },

    cleanScnAndDOM: function () {
        let childNode = this.expItemDOMs.shift()
        while (childNode) {
            this.expRootElem.removeChild(childNode);
            childNode = this.expItemDOMs.shift();
        }
        this.hasChange = true;
    },

    addItemToDOM: function (obj) {
        this.expElems[this.hideIdx].appendChild(obj);
        this.hasChange = true;
    },

    createDOMObj: function (el, x, y, w, h, styles) {
        let htmlObj = document.createElement(el);
        htmlObj.classList.add("exp-item");
        // htmlObj.style.position = 'relative';

        htmlObj.style.left = x + 'px';
        htmlObj.style.top = y + 'px';

        if (w != -1) {
            htmlObj.style.width = w + 'px';
        }
        if (h != -1) {
            htmlObj.style.height = h + 'px';
        }
        for (let k in styles) {
            htmlObj.style[k] = styles[k];
        }
        return htmlObj;
    }
};

// 判断在给定时间内是否按键、是否符合给定组合，
async function waitKBAndMs(ms = 0, key_codes = ['Space', 'Enter']) {
    let ts = performance.now();
    let dur = 1;
    let kb = await jspsych.waitKBMiSec(ms);
    while (kb.e && !key_codes.includes(kb.e.code) && (dur += kb.dur) < ms) {
        kb = await jspsych.waitKBMiSec(ms - dur);
    }
    if (kb.e && !key_codes.includes(kb.e.code)) {
        kb.e = false;
    }
    return { e: kb.e, s: ts, dur: performance.now()-ts }
}

// 判断按键是否符合 计时
async function waitPressKeyAndMs(ms=0, key_codes=[]){
    let ts = performance.now();
    let dur = 0;
    let kb = await jspsycho.waitKBMiSec(ms);
    while(kb.e && !key_codes.includes(kb.e.code) && (dur += kb.dur)<ms){
        kb = await jspsycho.waitKBMiSec(ms-dur);
    }
    dur += kb.dur;
    if(kb.e && !key_codes.includes(kb.e.code)){
        kb.e = false;
    }
    //return [kb.e, dur];
	//return { e: kb.e, s: ts, dur: performance.now()-ts }
	return { e: kb.e, s: ts, dur: dur, dur2: performance.now()-ts}
}


///////////////////////////////////////////////////// 
// 自定义函数 （2022.4.8 huotengbin）
/////////////////////////////////////////////////////

// 获取多文本框输入
// 添加文本框
function addTextBox(x, y, w, h, styles={}) {
    let htmlObj = document.createElement('input');
    htmlObj.classList.add("exp-item");
    htmlObj.style.position = 'relative';
    htmlObj.style.left = x + 'px';
    htmlObj.style.top = y + 'px';
    htmlObj.style.width = w + 'px';
    htmlObj.style.height = h + 'px';
    htmlObj.type = 'text';
    for (let k in styles) {
        htmlObj.style[k] = styles[k];
    }
    return htmlObj;
}

// 添加复选框
function addCheckBox(x, y, w, h, styles) {
    let htmlObj = document.createElement('input');
    htmlObj.classList.add("exp-item");
    htmlObj.style.position = 'relative';
    htmlObj.style.left = x + 'px';
    htmlObj.style.top = y + 'px';
    htmlObj.style.width = w + 'px';
    htmlObj.style.height = h + 'px';
    htmlObj.type = 'checkbox';
    for (let k in styles) {
        htmlObj.style[k] = styles[k];
    }
    return htmlObj;
}

// 添加单选框
function addRadioBox(x, y, w, h, styles) {
    let htmlObj = document.createElement('input');
    htmlObj.classList.add("exp-item");
    htmlObj.style.position = 'relative';
    htmlObj.style.left = x + 'px';
    htmlObj.style.top = y + 'px';
    htmlObj.style.width = w + 'px';
    htmlObj.style.height = h + 'px';
    htmlObj.type = 'radio';
    for (let k in styles) {
        htmlObj.style[k] = styles[k];
    }
    return htmlObj;
}

// 添加文本框
function addTextBox(x,y,w,h,idx,styles={},text=''){
    let htmlObj = jspsycho.createDOMObj('input',x,y,w,h,styles);
    htmlObj.type = 'text';
    htmlObj.id = idx;
    htmlObj.value = text;
    jspsycho.addItemToDOM(htmlObj);
}

// 

// 判断按键是否符合 计时
async function waitPressKeyAndMs_withCross(ms=0, key_codes=[]){

    let cross = jspsycho.fillImg({ url: 'imgs/cross.png', x: 300, y: 200, w: 50, h: 50 });
    jspsycho.putObjToCenter(cross);
    await jspsycho.flip();
    await jspsycho.render();
    //kb = await jspsycho.waitKB();
    jitter = randomNumber(0,400);
    t = 800 + jitter;

    let ts = performance.now();
    let dur = 0;
    let kb = await jspsycho.waitKBMiSec(ms);
    while(kb.e && !key_codes.includes(kb.e.code) && (dur += kb.dur)<ms){
        kb = await jspsycho.waitKBMiSec(ms-dur);
    }
    dur += kb.dur;
    if(kb.e && !key_codes.includes(kb.e.code)){
        kb.e = false;
    }
    //return [kb.e, dur];
	//return { e: kb.e, s: ts, dur: performance.now()-ts }
	return { e: kb.e, s: ts, dur: dur, dur2: performance.now()-ts}

    //ITI = await jspsycho.waitMiSec(t); // ITI 呈现注视点1s
    ITI = await jspsycho.waitMiSec(t-dur); // ITI 呈现注视点1s

}


///////////////////////////////////////////////////// 
// 自定义函数 （2022.4.18 huotengbin）
/////////////////////////////////////////////////////

// 从给定数组中随机抽取一定的元素，元素位置不相邻
function getTargetIdx(arr_len, n) {
    let resp = [];
    let temp_arr = Array.from({ length: arr_len }, (v, i) => i);
    let rnd_idx;
    for (let i = 0; i < n; i++) {
        rnd_idx = Math.floor(Math.random() * temp_arr.length);
        resp.push(temp_arr[rnd_idx]);
        temp_arr.splice(rnd_idx, 2);
        if (rnd_idx != 0) {
            temp_arr.splice(rnd_idx - 1, 1);
        }
        
    }
    return resp;
}

// 生成从a到b的随机数
function randomNumber(a = 1, b = 10) {
    // 这两个函数会做个类型转换, 假如含有其他字符,返回的是NaN
    let max = Math.max(a, b);
    let min = Math.min(a, b);
    if (isNaN(max)) throw "参数不规范!";
    return Math.floor(Math.random() * (max - min + 1) + min);            
}

// 创建数组
function createArray(length) {
    let arr = [];
    for (let i = 0; i < length; i++) {
        arr.push(i);
    }
    return arr;
}

// 随机取数组中的一个值
function getRandomArrayItem(arr) {
    let idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
}

// 生成随机序列
// 从[0:arr_len-1]的array中随机抽取n个(n<arr_len)元素，并打乱顺序
function getRandomSequence(arr_len, n) {
    let resp = [];
    let temp_arr = createArray(arr_len);
    let rnd_idx;
    for (let i = 0; i < n; i++) {
        rnd_idx = Math.floor(Math.random() * temp_arr.length); // [0, arr_len-1]间的随机数
        resp.push(temp_arr[rnd_idx]);
        temp_arr.splice(rnd_idx, 1); // 从rnd_idx开始删除1个元素, 保证不重复抽取
    }
    return resp;
}

// 生成随机序列
// 从[0:arr_len-1]的array中随机抽取n个(n可大于arr_len)元素，并打乱顺序
function getRandomSequence_2(arr_len, n) {
    let resp = [];
    let temp_arr = createArray(arr_len);
    let rnd_idx;
    for (let i = 0; i < n; i++) {
        rnd_idx = Math.floor(Math.random() * temp_arr.length); // [0, arr_len-1]间的随机数
        resp.push(temp_arr[rnd_idx]); 
    }
    return resp;
}

// 将数组随机分成两半
// 用于将8个model的照片分成两半，一个被试只做其中一半，另一个被试做另一半
function splitArray(arr) {
    let len = arr.length;
    let idx = getRandomSequence(len, len);
    let half_arr = [idx.slice(0, len/2), idx.slice(len/2, len)];
    return half_arr;
}

// 生成序列的所有配对组合
function getAllCombination_1(arr) {
    let pair = [];
    let len = arr.length;
    for (let i = 0; i < len; i++) {
        for (let j = i; j < len; j++) {
            pair.push([arr[i], arr[j]]);
        }
    }
    return pair;
}

function getAllCombination_2(arr) {
    let pair = [];
    let len = arr.length;
    for (let i = 0; i < len; i++) {
        for (let j = i; j < len; j++) {
            pair.push([arr[j], arr[i]]); // 左右位置互换
        }
    }
    return pair;
}

// 索引数组中的多个元素
function getIndexOfArray(arr, idx_arr) {
    let resp = [];
    for (let i = 0; i < idx_arr.length; i++) {
        resp.push(arr[idx_arr[i]]);
    }
    return resp;
}

// 等待并显示倒计时
async function dispCountDown(s) {            
    for (let n = s; n >= 0;n--) {
        let timer = jspsycho.fillText({ content: 'Ready：' + n.toString(), class_: ['countdown']});
        await jspsycho.waitMiSec(1000);
        await jspsycho.flip();
        await jspsycho.render();
        jspsycho.putObjToCenter(timer);
    }
}

// 显示注视点
async function dispCross(s) {            
    //for (let n = s; n > 0;n--) {
        let cross = jspsycho.fillImg({ url: 'imgs/cross.png', x: 300, y: 200, w: 50, h: 50 });
        await jspsycho.waitMiSec(s);
        await jspsycho.flip();
        await jspsycho.render();
        jspsycho.putObjToCenter(cross);
    //}
}

/*
// 记录实验开始时间
function getStartTime() {
    return new Date().getTime(); // 返回 日期 1970.01.01 距现在的毫秒数
}

// 记录实验结束时间
function getEndTime() {
    return new Date().getTime(); 
}

// 计算实验时间(s)
function getExperimentTime(start_time, end_time) {
    return (end_time - start_time) / 1000;
}
*/


///////////////////////////////////////////////////// 
// 自定义函数 （2025.4.30 huotengbin）
/////////////////////////////////////////////////////

// 记录实验开始时间，格式为：年-月-日 时-分-秒-毫秒
function getStartTime() {
    const now = new Date(); // 获取当前时间
    const year = now.getFullYear(); // 年
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月（注意月份从 0 开始，需要加 1）
    const day = String(now.getDate()).padStart(2, '0'); // 日
    const hours = String(now.getHours()).padStart(2, '0'); // 时
    const minutes = String(now.getMinutes()).padStart(2, '0'); // 分
    const seconds = String(now.getSeconds()).padStart(2, '0'); // 秒
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0'); // 毫秒

    // 格式化为 "年-月-日 时-分-秒-毫秒"
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// 记录实验结束时间，格式为：年-月-日 时-分-秒-毫秒
function getEndTime() {
    const now = new Date(); // 获取当前时间
    const year = now.getFullYear(); // 年
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月（注意月份从 0 开始，需要加 1）
    const day = String(now.getDate()).padStart(2, '0'); // 日
    const hours = String(now.getHours()).padStart(2, '0'); // 时
    const minutes = String(now.getMinutes()).padStart(2, '0'); // 分
    const seconds = String(now.getSeconds()).padStart(2, '0'); // 秒
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0'); // 毫秒

    // 格式化为 "年-月-日 时-分-秒-毫秒"
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// 格式解析并转换为 Date 对象
function parseTimeString(timeStr) {
    const [datePart, timePart] = timeStr.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes, secondsAndMillis] = timePart.split(':');
    const [seconds, milliseconds] = secondsAndMillis.split('.');

    return new Date(
        year,
        month - 1, // 月份从0开始
        day,
        hours,
        minutes,
        seconds,
        milliseconds
    );
}

// 计算时间差并格式化输出
function getExperimentTime(startTimeStr, endTimeStr) {
    const start = parseTimeString(startTimeStr);
    const end = parseTimeString(endTimeStr);

    const diffMs = end - start;

    if (diffMs < 0) {
        throw new Error("结束时间不能早于开始时间");
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const remainingMs = diffMs % 1000;

    return `${totalMinutes}分 ${remainingSeconds}秒 ${remainingMs}毫秒`;
}

/*
// 收集被试信息
function collectParticipantInfo() {
    console.log("开始收集被试信息...");

    const name = prompt("请输入您的姓名：", "") || "匿名";
    const age = parseInt(prompt("请输入您的年龄：", ""), 10);
    const gender = prompt("请输入您的性别（男/女/其他）：", "") || "未知";
    const id = prompt("请输入被试编号（如 P001）：", "") || "P-未知";

    // 可选：验证年龄是否为有效数字
    if (isNaN(age) || age <= 0 || age > 120) {
        alert("请输入有效的年龄！");
        return collectParticipantInfo(); // 重新输入
    }

    const participant = {
        name,
        age,
        gender,
        id,
        timestamp: new Date().toLocaleString()
    };

    console.log("被试信息已收集：", participant);
    alert("信息收集完成，实验即将开始...");

    return participant;
}
*/

/**
 * 收集被试信息的函数
 * 该函数会在页面上动态创建一个模态对话框（Modal）
 * 用户填写基本信息后，返回包含这些信息的对象
 *
 * @returns {Promise<Object>} 返回一个 Promise，成功时传入被试信息对象
 */
function collectParticipantInfo() {
    // 返回一个 Promise，方便在收集完成后进行后续操作
    return new Promise((resolve, reject) => {
        // 检查是否已经存在对话框，防止重复弹出
        if (document.getElementById('participantModal')) {
            reject("已有被试信息对话框打开");
            return;
        }

        // 创建遮罩层 div，用于背景变暗并居中显示表单
        const modal = document.createElement('div');
        modal.id = 'participantModal';
        modal.style.position = 'fixed';             // 固定定位，覆盖整个窗口
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)'; // 半透明黑色背景
        modal.style.display = 'flex';                // 使用 Flex 布局水平垂直居中
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9999';                 // 确保浮于其他元素之上
        modal.style.fontFamily = "SimSun, STSong"; // 使用宋体

        // 创建内容容器 div，放置表单
        const content = document.createElement('div');
        content.style.backgroundColor = '#fff';      // 白色背景
        content.style.padding = '30px';              // 内边距
        content.style.borderRadius = '10px';         // 圆角边框
        content.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'; // 阴影效果
        content.style.width = '350px';               // 宽度限制
        content.style.textAlign = 'center';          // 文字居中
        content.style.fontFamily = "SimSun, STSong"; // 设置为宋体

        // 表单 HTML 字符串，以 innerHTML 的方式插入
        content.innerHTML = `
            <h3>请填写被试信息</h3>
            <form id="participantForm">
                <label style="display:block; margin:10px 0 5px; text-align:left;">姓名：</label>
                <input type="text" id="name" required>

                <label style="display:block; margin:10px 0 5px; text-align:left;">性别：</label>
                <select id="gender">
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                </select>

                <label style="display:block; margin:10px 0 5px; text-align:left;">年龄：</label>
                <input type="number" id="age" min="6" max="100" required>

                <label style="display:block; margin:10px 0 5px; text-align:left;">被试编号（线上实验请填0）：</label>
                <input type="text" id="id" placeholder="例如：P001" required>

                <br>
                <button type="submit">开始实验</button>
            </form>
        `;

        // 将内容区域加入遮罩层，遮罩层加入 body
        modal.appendChild(content);
        document.body.appendChild(modal);

        // 监听表单提交事件
        document.getElementById('participantForm').addEventListener('submit', function (e) {
            e.preventDefault(); // 阻止默认提交行为（不刷新页面）

            // 获取输入值并处理
            const name = document.getElementById('name').value.trim();
            const gender = document.getElementById('gender').value;
            const age = parseInt(document.getElementById('age').value, 10);
            const id = document.getElementById('id').value.trim();

            // 基本验证：确保所有字段有效
            if (!name || !id || isNaN(age) || age < 6 || age > 100) {
                alert("请输入正确的信息！");
                return;
            }

            // 构造被试数据对象
            const participantData = {
                name,
                gender,
                age,
                id,
                timestamp: new Date().toLocaleString() // 记录填写时间
            };

            // 关闭对话框
            document.body.removeChild(modal);

            // Promise 成功回调，将被试数据传递出去
            resolve(participantData);
        });
    });
}


/**
 * 预加载一组图片，并提供加载进度反馈
 *
 * @param {Array<string>} imageUrls - 图片资源的 URL 数组（可以是本地路径、网络地址或 Blob URL）
 * @param {Function} onProgress - 进度回调函数，接收一个表示加载进度的数值参数（0 ~ 1）
 * @returns {Promise<void>} 返回一个 Promise，在所有图片加载完成后 resolve
 */
function preloadImagesWithProgress(imageUrls, onProgress) {
    return new Promise((resolve) => {
        // 记录已加载完成的图片数量
        let loadedCount = 0;

        // 所有需要加载的图片总数
        const total = imageUrls.length;

        // 如果没有图片需要加载，直接 resolve 完成
        if (total === 0) {
            resolve();
            return;
        }

        // 遍历所有图片 URL，逐个创建 Image 对象并开始加载
        imageUrls.forEach(url => {
            const img = new Image();

            // 设置图片加载成功时的回调函数
            img.onload = () => {
                loadedCount++;                 // 加载完成计数器加一
                onProgress(loadedCount / total); // 调用进度回调，传入当前进度比例 (0 ~ 1)
                
                // 如果所有图片都已加载完成，则调用 resolve，结束 Promise
                if (loadedCount === total) {
                    resolve();
                }
            };

            // 设置图片加载失败时的回调函数（仍然计入加载完成数）
            img.onerror = () => {
                loadedCount++;                 // 即使加载失败也计入完成数
                onProgress(loadedCount / total); // 更新进度条

                // 如果所有图片都处理完毕（包括失败的情况），也调用 resolve
                if (loadedCount === total) {
                    resolve();
                }
            };

            // 开始加载图片（设置 src 属性触发加载）
            img.src = url;
        });
    });
}

// 示例实验启动函数
function startExperiment(imgList) {
    alert(`共预加载 ${imgList.length} 张图片，实验开始！`);
}

/*
// 使用带进度的例子
preloadImagesWithProgress(imageList, progress => {
    console.log(`已加载: ${(progress * 100).toFixed(0)}%`);
    document.getElementById('loading-progress').innerText =
        `加载中... ${Math.round(progress * 100)}%`;
}).then(() => {
    // 隐藏加载界面，开始实验
    document.getElementById('loading-screen').style.display = 'none';
    startExperiment();
});
*/




