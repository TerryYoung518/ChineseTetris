/*$(document).ready(function () {
    tetris.init();
});*/
(function () {
    var tetris = {
        board: [],
        canvas: null,
        canvasHeight: 450,
        canvasWidth: 300,
        pSize: 50,
        boardHeight: 0,
        boardWidth: 0,
        spawnX: 150,
        spawnY: -49,
        tempWords: null,
        nextWord: null,
        nextWordDisplay: null,
        nextWordIndex: null,
        holdWord: null,
        holdWordDisplay: null,
        calScore: 0,
        score: 0,
        socreDisplay: null,
        highScore: 0,
        highScoreDisplay: null,
        curWord: null,
        curWordIndex: null,
        curWordEl: null,
        curX: 0,
        curY: 0,
        curDeg: 0,
        els: [],
        fallEls: [],
        isActive: 0,
        isGameOver: 0,
        isRotating: 0,
        isFallingAnm: 0,
        fps: 30,
        speed: 10,
        curSpeed: 10,
        curComplete: false,
        pTimer: null,
        init: function () {
            var me = this;
            var scale = window.screen.width/675;
            if (window.screen.width < window.screen.height)
                $(document.body).css("zoom", scale);
            this.highScore = parseInt(localStorage.getItem("highScore") || "0");
            this.highScoreDisplay = $(".start-container .score");
            this.setInfo("highScore");
            $("#left").on("click", function () {
                me.move('L');
            });
            $("#right").on("click", function () {
                me.move('R');
            });
            $("#up").on("click", function () {
                me.move('RT');
            });
            $("#down").on("click", function () {
                me.move('D');
            });
            $(".panel-left").on("click", function () {
                if (me.holdWord === null) {
                    me.hold();
                }
            });
            $(".panel-right").on("click", function () {
                me.togglePause();
            });
            $(".game-container").hide();
            $(".controller").hide();
            $(".start-container").show();
            $("#start").on("click", function () {
                $(".start-container").hide();
                $(".game-container").show();
                if (window.screen.width < window.screen.height)
                    $(".controller").show();
                me.start();
            });
        },
        start: function () {
            this.initCanvas();
            this.initBoard();
            this.initInfo();
            this.initWords();
            this.bindKeyEvents();
            this.play();
        },
        initCanvas: function () {
            this.canvas = $("#canvas");
            this.canvas.width(this.canvasWidth);
            this.canvas.height(this.canvasHeight);
        },
        initBoard: function () {
            this.boardHeight = this.canvasHeight / this.pSize;
            this.boardWidth = this.canvasWidth / this.pSize;
            var s = this.boardHeight * this.boardWidth;
            for (var i = 0; i < s; i++) {
                this.board.push("0");
            }
        },
        initInfo: function () {
            this.nextWordDisplay = $("#next");
            this.holdWordDisplay = $("#hold");
            this.scoreDisplay = $(".panel-score > .score");
            this.setInfo('score');
            this.setInfo('nextWord');
            this.setInfo('holdWord');
        },
        initWords: function () {
            this.curComplete = false;
            if (this.holdWord === null) {
                this.shiftTempWords();
                this.curWordIndex = this.tempWords[0];
                this.curWord = words.start[this.curWordIndex];
                this.initNextWord();
            } else {
                this.curWord = this.holdWord;
                this.holdWord = null;

            }
            this.setCurCoords(this.spawnX, this.spawnY);
            this.drawWord(this.curX, this.curY, this.curWord);
        },
        initNextWord: function () {
            if (typeof this.tempWords[1] === 'undefined') {
                this.initTempWords();
            }
            try {
                this.nextWordIndex = this.tempWords[1];
                this.nextWord = words.start[this.nextWordIndex];
                this.setInfo("nextWord");
            } catch (e) {
                throw new Error("Could not create next word. " + e);
            }
        },
        initTempWords: function () {
            if (typeof this.tempWords === "undefined" || this.tempWords === null) {
                this.tempWords = [];
            }
            for (var i = 0; i < 4; i++) {
                this.tempWords.push(Math.floor(Math.random() * words.start.length));
            }
        },
        shiftTempWords: function () {
            try {
                if (typeof this.tempWords === "undefined" || this.tempWords === null || this.tempWords.length < 2) {
                    this.initTempWords();
                } else {
                    this.tempWords.shift();
                }
            } catch (e) {
                throw new Error("Could not shift or init tempWords: " + e);
            }
        },
        setInfo: function (el) {
            if (el == "score" || el == "highScore") {
                this[el + "Display"].html(('00000' + this[el]).slice(-6));
            } else {
                this[el + "Display"].html(this[el]);
            }
        },
        drawWord: function (x, y, word) {
            this.curSpeed = this.speed;
            var color = this.getColor(word);
            this.curWordEl = this.createSquare(x, y, color, word);
            this.canvas.append(this.curWordEl);
        },
        getColor: function (word) {
            var color = null;
            if (typeof words[word] === "undefined" || words[word] === null) {
                color = this.randomColor();
            } else {
                color = words[word];
            }
            return color;
        },
        randomColor: function () {
            var r = Math.floor(Math.random() * 128) + 128;
            var g = Math.floor(Math.random() * 128) + 128;
            var b = Math.floor(Math.random() * 128) + 128;
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        createSquare: function (x, y, color, word) { //创建方块
            return $("<div></div>").addClass("square")
                .css({
                    'background-color': color,
                    'left': x - 1 + 'px',
                    'top': y - 1 + 'px'
                }).html(word);
        },
        setCurCoords: function (x, y, $deg = 0) {
            this.curX = x;
            this.curY = y;
            this.curDeg = $deg;
        },
        bindKeyEvents: function () { //绑定按键
            var me = this;
            var event = "keypress";
            if (this.isSafari() || this.isIE()) {
                event = "keydown";
            } //浏览器判断
            var cb = function (e) {
                me.handleKey(e);
            };
            if (window.addEventListener) {
                document.addEventListener(event, cb, false);
            } else {
                document.attachEvent('on' + event, cb);
            }
        },
        handleKey: function (e) {
            if (this.isGameOver === 1) return false;
            var c = this.whichKey(e);
            var dir = '';
            switch (c) {
                case 37:
                    this.move('L');
                    break;
                case 38:
                    this.move('RT');
                    break;
                case 39:
                    this.move('R');
                    break;
                case 40:
                    this.move('D');
                    break;
                case 32: //space: hold
                    if (this.holdWord === null) {
                        this.hold();
                    }
                    break;
                case 27: //esc: pause
                    this.togglePause();
                    break;
                default:
                    break;
            }
        },
        whichKey: function (e) {
            var c;
            if (window.event) {
                c = window.event.keyCode;
            } else if (e) {
                c = e.keyCode;
            }
            return c;
        },
        gameOver: function () {
            this.isGameOver = 1;
            if (this.score > this.highScore) {
                localStorage.setItem("highScore", this.score);
            }
            var me = this;
            clearTimeout(this.pTimer);
            this.pTimer = null;
            var drawOverSquares = function (y) {
                for (var x = 0; x < me.boardWidth; x++) {
                    if (y === 4) {
                        switch (x) {
                            case 1:
                                me.createSquare(x * me.pSize, y * me.pSize, "#4b4947", "遊")
                                    .css('color', 'white')
                                    .appendTo(me.canvas);
                                break;
                            case 2:
                                me.createSquare(x * me.pSize, y * me.pSize, "#4b4947", "戲")
                                    .css('color', 'white')
                                    .appendTo(me.canvas);
                                break;
                            case 3:
                                me.createSquare(x * me.pSize, y * me.pSize, "#4b4947", "結")
                                    .css('color', 'white')
                                    .appendTo(me.canvas);
                                break;
                            case 4:
                                me.createSquare(x * me.pSize, y * me.pSize, "#4b4947", "束")
                                    .css('color', 'white')
                                    .appendTo(me.canvas);
                                break;
                            default:
                                me.createSquare(x * me.pSize, y * me.pSize, "#4b4947", "")
                                    .appendTo(me.canvas);
                                break;
                        }
                    } else if (y === 0 && x === 0) {
                        me.createSquare(x * me.pSize, y * me.pSize, "#4b4947", "返")
                            .css('color', 'white')
                            .click(function () {
                                window.location.reload();
                            })
                            .appendTo(me.canvas);
                    } else {
                        me.createSquare(x * me.pSize, y * me.pSize, "#4b4947", "")
                            .appendTo(me.canvas);
                    }
                }
            };
            for (var y = 0; y < this.boardHeight; y++) {
                (function (y) {
                    setTimeout(function timer() {
                        drawOverSquares(y);
                    }, (8 - y) * 400);
                })(y);
            }

        },
        play: function () {
            var me = this;
            this.setInfo("holdWord");
            if (this.score > this.highScore) {
                localStorage.setItem("highScore", this.score);
            }
            var gameLoop = function () {
                me.fall(me.curSpeed / 25);
                if (me.isGameOver === 1) return false;
                if (me.curComplete && !me.isFallingAnm) {
                    //标记已固定
                    me.fallEls = [];
                    //me.markBoard(me.curX, me.curY, me.curWord);
                    me.curWordEl.each(function () {
                        me.els.push(this);
                    });
                    //检查字块
                    var deleteEls = [];
                    var newEls = [];
                    var deleteBoards = [];
                    var anmTime = 0;
                    var ftimer = null;
                    var check = null;
                    me.calScore = 0;
                    var scorePower = 1.0;
                    var checkList = [[me.curWord, me.coordMap(me.curX) +
                                      me.coordMap(me.curY) * me.boardWidth]];
                    var fallAnm = function () {
                        if (me.fallEls.length > 0) {
                            me.falls(me.speed / 25);
                            ftimer = setTimeout(fallAnm, 1000 / this.fps);
                        } else {
                            me.isFallingAnm = 0;
                            if (checkList.length > 0) {
                                deleteEls = [];
                                newEls = [];
                                deleteBoards = [];
                                anmTime = 0;
                                ftimer = null;
                                me.calScore = 0;
                                scorePower += 0.5;
                                check();
                            } else {
                                me.play();
                            }
                        }
                    };
                    check = function () {
                        while (me.checkWords(deleteEls, newEls, deleteBoards, checkList, scorePower)) {
                            scorePower += 0.25;
                            anmTime = 500;
                            me.deleteNew(newEls, deleteBoards);
                        }
                        setTimeout(function () {
                            me.score += me.calScore;
                            me.setInfo("score");
                            newEls.eachdo(function () {
                                this.appendTo(me.canvas);
                                me.els.push(this[0]);
                            });
                            deleteEls.eachdo(function (k) {
                                if (me.els[deleteEls[k]]) me.els[deleteEls[k]].remove();
                                me.els[deleteEls[k]] = null;
                            });
                            for (var k = 0; k < me.els.length; k++) {
                                if (!me.els[k]) {
                                    me.els.splice(k, 1);
                                    k--;
                                }
                            }
                            me.checkFalls(checkList);
                            me.isFallingAnm = 1;
                            ftimer = setTimeout(fallAnm, 1000 / this.fps);
                        }, anmTime);
                        deleteBoards.eachdo(function () {
                            me.board[this] = "0";
                        });
                    };
                    check();
                    //生成新字块
                    me.initWords();
                } else {
                    me.pTimer = setTimeout(gameLoop, 1000 / this.fps);
                }
            };
            this.pTimer = setTimeout(gameLoop, 1000 / this.fps);
            this.isActive = 1;
        },
        togglePause: function () {
            if (this.isActive === 1) {
                clearTimeout(this.pTimer);
                this.pTimer = null;
                this.isActive = 0;
            } else {
                this.play();
            }
        },
        move: function (dir, $time = 100, $easing = 'swing', $distance = this.pSize) { //移动dir方向
            if (this.isActive === 0) return false;
            var s = '';
            var me = this;
            var tempX = this.curX;
            var tempY = this.curY;
            switch (dir) {
                case 'L':
                    s = 'left';
                    tempX -= $distance;
                    break;
                case 'R':
                    s = 'left';
                    tempX += $distance;
                    break;
                case 'D':
                    if (this.curSpeed == this.speed) {
                        this.curSpeed = 5 * this.speed;
                    } else {
                        this.curSpeed = this.speed;
                    }
                    return true;
                    break;
                case 'RT':
                    if (this.isRotating === 0) this.rotate(); //旋转
                    return true;
                    break;
                default:
                    throw new Error('wtf');
                    break;
            }
            if (this.checkMove(tempX, tempY)) { //检查移动
                var l = {};
                l[s] = dir === 'L' ? "-=" + $distance + "px" : "+=" + $distance + "px";
                this.curWordEl.animate(l, $time, $easing);
                this.curX = tempX; //更新当前坐标
                this.curY = tempY;
            }
        },
        fall: function ($speed = 0.5) {
            var me = this;
            var tempX = this.curX;
            var tempY = this.curY;
            tempY += $speed;
            if (this.checkMove(tempX, tempY)) {
                this.curWordEl.css('top', (tempY - 1) + 'px');
                //更新当前坐标
                me.curY = tempY;
            } else {
                if (this.curY <= 0) {
                    //游戏结束
                    this.gameOver();
                    return false;
                }
                tempY = me.checkMoveLimit(tempX, tempY) * me.pSize;
                this.curWordEl.css('top', (tempY - 1) + 'px');
                me.curY = tempY;
                me.markBoard(me.curX, me.curY, me.curWord);
                this.curComplete = true;
            }
        },
        falls: function ($speed = 0.5) {
            var me = this;
            this.fallEls.eachdo(function (k) {
                var tempX = parseFloat(this[0].style['left'], 10) + 1;
                var tempY = parseFloat(this[0].style['top'], 10) + 1;
                tempY += $speed;
                if (me.checkMove(tempX, tempY)) {
                    this[0].style['top'] = (tempY - 1) + 'px';
                } else {
                    tempY = me.checkMoveLimit(tempX, tempY) * me.pSize;
                    this[0].style['top'] = (tempY - 1) + 'px';
                    me.markBoard(tempX, tempY, this[1]);
                    me.fallEls.splice(k, 1);
                    k--;
                }
            });
        },
        rotate: function () {
            var me = this;
            var word = this.curWord;
            var rstr = null;
            if (typeof words.rot[word] !== "undefined" && words.rot[word] !== null) {
                rstr = words.rot[word];
            } else {
                rstr = "4" + this.curWord;
            }
            var speed = this.curSpeed;
            this.isRotating = 1;
            this.curSpeed = 0;
            var start = this.curDeg;
            var end = start + parseInt(rstr.substr(0, 1)) * 90;
            $("<div></div>").animate({
                backgroundPosition: "0"
            }, {
                duration: 200 * parseInt(rstr.substr(0, 1)),
                step: function (now, fx) {
                    fx.start = start;
                    fx.end = end;
                    me.curWordEl.css('-webkit-transform', 'rotate(' + now + 'deg)');
                },
                done: function () {
                    me.curSpeed = speed;
                    me.isRotating = 0;
                    me.curDeg = end;
                    me.curWord = rstr.substr(1, 1);
                }
            });
        },
        checkMove: function (x, y) {
            x = this.coordMap(x);
            y = this.coordMap(y);
            if (this.isOB(x, y) || this.isCollision(x, y)) {
                return false;
            }
            return true;
        },
        checkMoveLimit: function (x, y) {
            x = this.coordMap(x);
            y = this.coordMap(y);
            if (this.board[x + y * this.boardWidth] !== "0") {
                return y - 1;
            }
            if (y > this.boardHeight - 1) {
                return this.boardHeight - 1;
            }
        },
        hold: function () {
            this.holdWord = this.curWord;
            this.curWordEl.remove();
            this.curComplete = false;
            this.shiftTempWords();
            this.curWordIndex = this.tempWords[0];
            this.curWord = words.start[this.curWordIndex];
            this.initNextWord();
            this.setCurCoords(this.spawnX, this.spawnY);
            this.drawWord(this.curX, this.curY, this.curWord);
            this.setInfo("holdWord");
        },
        isOB: function (x, y) {
            if (x < 0 || x >= this.boardWidth || y < 0 || y >= this.boardHeight) {
                return true;
            }
            return false;
        },
        isCollision: function (x, y) {
            if (this.board[x + y * this.boardWidth] !== "0") {
                return true;
            }
            return false;
        },
        coordMap: function (x) {
            return Math.ceil(x / this.pSize);
        },
        markBoard: function (x, y, word) {
            x = this.coordMap(x);
            y = this.coordMap(y);
            this.board[x + y * this.boardWidth] = word;
        },
        checkWords: function (deleteEls, newEls, deleteBoards, checkList, scorePower) {
            //console.log("【checkWords】");
            var me = this;
            var bool = false;
            if (!checkList[0]) return false;
            if (checkList.length > 1) bool = true;
            var curWord = checkList[0][0];
            var curX = checkList[0][1] % this.boardWidth;
            var curY = Math.floor(checkList[0][1] / this.boardWidth);
            var boardChange = [];
            var combNum = 0;
            var curColor = this.curWordEl.css("background-color");
            for (var i = 0; i < words.comb.length; i++) {
                if (words.comb[i].indexOf(curWord) >= 0 &&
                    words.comb[i].lastIndexOf(curWord) != words.comb[i].length - 1) {
                    var equation = words.comb[i].split("=");
                    var lines = equation[0].split(";");
                    var h = lines.length;
                    var w = lines[0].length;
                    for (var j = 0; j < h * w; j++) {
                        if (this.readLines(lines, j) ===
                            this.boardPos(curX, curY)) {
                            var match = true;
                            for (var k = 0; k < h * w; k++) {
                                if (this.readLines(lines, k) !==
                                    this.boardPos(curX - j % w + k % w, curY -
                                        Math.floor(j / w) + Math.floor(k / w)) &&
                                    this.readLines(lines, k) !== "0") {
                                    match = false;
                                    break;
                                }
                            }
                            if (match) {
                                //console.log(lines);
                                combNum++;
                                bool = true;
                                var isNewCreate = false;
                                var color = this.getColor(equation[1]);
                                var wordNum = 0;
                                this.els.eachdo(function (k) {
                                    var x = me.coordMap(parseInt(this.style["left"], 10));
                                    var y = me.coordMap(parseInt(this.style["top"], 10));
                                    if (x >= curX - j % w &&
                                        x < curX - j % w + w &&
                                        y >= curY - Math.floor(j / w) &&
                                        y < curY - Math.floor(j / w) + h) {
                                        //console.log(this);
                                        var l = x - curX + j % w + (y - curY + Math.floor(j / w)) * w;
                                        if (me.readLines(lines, l) === "0") return;
                                        wordNum++;
                                        //console.log(l);
                                        if (x != curX || y != curY || (x == me.coordMap(me.curX) && y == me.coordMap(me.curY)))
                                            this.style["background-color"] = color;
                                        if (l % w > 0 && me.readLines(lines, l - 1) !== "0") {
                                            this.style["border-left-color"] = color;
                                        }
                                        if (l % w < w - 1 && me.readLines(lines, l + 1) !== "0") {
                                            this.style["border-right-color"] = color;
                                        }
                                        if (Math.floor(l / w) > 0 && me.readLines(lines, l - w) !== "0") {
                                            this.style["border-top-color"] = color;
                                        }
                                        if (Math.floor(l / w) < h - 1 && me.readLines(lines, l + w) !== "0") {
                                            this.style["border-bottom-color"] = color;
                                        }
                                        deleteEls.push(k);
                                        var newEl = me.createSquare(x * 50, y * 50, color, equation[1]);
                                        //console.log(x*50+","+me.curX+","+y*50+","+me.curY);
                                        if (!isNewCreate && (x != curX || y != curY)) {
                                            newEls.push(newEl);
                                            isNewCreate = true;
                                        } else {
                                            deleteBoards.push(x + y * me.boardWidth);
                                        }
                                        boardChange.push([x + y * me.boardWidth, equation[1]]);
                                    }
                                });
                                me.calScore += parseInt((1 + (combNum - 1) * 0.1) * wordNum * 100 * scorePower);
                            } //match
                        }
                    }
                } //checkcomb
            } //comblist
            if (combNum > 1 && curWord === this.curWord) {
                this.curWordEl.css("background-color", curColor);
            }
            for (var j = 0; j < boardChange.length; j++) {
                this.board[boardChange[j][0]] = boardChange[j][1];
                checkList.push([boardChange[j][1], boardChange[j][0]]);
            }
            checkList.shift();
            return bool;
        },
        checkFalls: function (checkList) {
            var me = this;
            var isBottom = [];
            var fallIndex = [];
            for (var i = 0; i < this.boardWidth; i++) {
                isBottom.push(false);
            }
            for (var y = this.boardHeight - 1; y >= 0; y--) {
                for (var x = 0; x < this.boardWidth; x++) {
                    if (!isBottom[x] && this.boardPos(x, y) === "0") {
                        isBottom[x] = true;
                    } else if (isBottom[x] && this.boardPos(x, y) !== "0") {
                        fallIndex.push([x + y * this.boardWidth, this.boardPos(x, y)]);
                        this.board[x + y * this.boardWidth] = "0";
                    }
                }
            }
            this.els.eachdo(function (k) {
                var el = this;
                var x = me.coordMap(parseInt(this.style["left"], 10));
                var y = me.coordMap(parseInt(this.style["top"], 10));
                for (var i = 0; i < fallIndex.length; i++) {
                    if (x + y * me.boardWidth == fallIndex[i][0]) {
                        me.fallEls.push([el, fallIndex[i][1]]);
                        checkList.push([fallIndex[i][1], fallIndex[i][0]]);
                        break;
                    }
                }
            });
        },
        deleteNew: function (newEls, deleteBoards) {
            var me = this;
            newEls.eachdo(function (k) {
                var x = me.coordMap(parseInt(this.css("left"), 10));
                var y = me.coordMap(parseInt(this.css("top"), 10));
                for (var i = 0; i < deleteBoards.length; i++) {
                    if (x + y * me.boardWidth == deleteBoards[i]) {
                        newEls.splice(k, 1);
                        k--;
                        break;
                    }
                }
            });
        },
        boardPos: function (x, y) {
            if (x < 0 || x >= this.boardWidth || y < 0 || y >= this.boardHeight) {
                return null;
            }
            return this.board[x + (y * this.boardWidth)];
        },
        readLines: function (lines, x) {
            return lines[Math.floor(x / lines[0].length)][x % lines[0].length] || "0";
        },
        isIE: function () {
            return this.bTest(/IE/);
        },
        isSafari: function () {
            return this.bTest(/Safari/);
        },
        bTest: function (rgx) {
            return rgx.test(navigator.userAgent);
        }
    };
    $(document).ready(function () {
        tetris.init();
    });
})();

// 转为unicode 编码
function encodeUnicode(str) {
    var res = [];
    for (var i = 0; i < str.length; i++) {
        res[i] = ("00" + str.charCodeAt(i).toString(16)).slice(-4);
    }
    return res.join("\\u");
}

// 解码
function decodeUnicode(str) {
    str = "%u" + str;
    return unescape(str);
}

//为数组添加eachdo方法
if (!Array.prototype.eachdo) {
    Array.prototype.eachdo = function (fn) {
        for (var i = 0; i < this.length; i++) {
            fn.call(this[i], i);
        }
    };
}
