function MarklineObj() {
    this.balls = [];
    this.lines = [];
    this.points = [];
    this.texts = [];
    this.lineCount = 0;
    this.ballCount = 0;
    this.pointCount = 0;
    this.textCount = 0;

    // 小球运动速度
    this.percent = 0;
    // 画布全局变量
    this.ctxGlobal;
    this.canvas;
    // 背景长宽
    this.canWidth;
    this.canHeight;

    // 背景id
    this.imgId = "";

    // 点击、触摸相关
    this.clickFlag = "false";
    this.pointerStyle = "default";
    this.hoverFlag = {
        hover: false,
        type: "",
        id: null
    }
    // 缩放变量
    this.scaleFlag = 0;
    // 背景位置（主要参考位置）
    this.imgPosition = {
        x : 0,
        y : 0
    }
    // 描点的配置选项
    this.pointOption;
    this.textOption;
};

(function(window,undefined){
    // 创建提示窗
    var create_info = document.createElement("div");
    create_info.id = "mk-info";
    create_info.style.display = "none";
    document.body.appendChild(create_info);
    var info = document.getElementById("mk-info");


    /**
     * 计算bezier曲线尾端角度
     * @param  cx   控制点x坐标
     * @param  cy   控制点y坐标
     * @param  dx   线段终点x坐标
     * @param  dy   线段终点y坐标
     * @return      返回角度
     */
    function calcAngle(cx,cy,dx,dy){
        return  0; //Math.atan2((dy - cy) , (dx - cx));
    }

    /**
     * 画箭头
     * @param  ctx    canvas绘画上下文
     * @param  dx     线段终点x坐标
     * @param  dy     线段终点y坐标
     * @param  angle  箭头角度
     * @param  sizeL  箭头长度
     * @param  sizeW  箭头宽度
     */
    function drawArrow(ctx,dx,dy,angle,sizeL,sizeW,color){
        var al = sizeL / 2;
        var aw = sizeW / 2;
        ctx.save();
        ctx.translate(dx,dy);
        ctx.rotate(angle);
        ctx.translate(-al,-aw);

        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(al,aw);
        ctx.lineTo(0,sizeW);
        ctx.strokeStyle = color;
        ctx.stroke();

        ctx.restore();
    }


    /**
     * 计算二阶贝塞尔曲线的控制点
     * @param  sx     起点x坐标
     * @param  sy     起点y坐标
     * @param  dx     终点x坐标
     * @param  dy     终点y坐标
     * @return point  控制点坐标
     */
    function calControlPoint(sx,sy,dx,dy){
        var a,x,y,k,b,X,Y,len;
        X = (sx + dx) / 2;
        Y = (sy + dy) / 2;
        len = 0.2 * Math.sqrt(Math.pow((dy - sy),2) + Math.pow((dx - sx),2)); // 控制贝塞尔曲线曲率
        a = Math.atan2(dy - sy, dx - sx);
        return {x: dx,y: dy}
    }

    // 线-对象
    var Line = function(i,option,canvas,mkObj){
        this.id = i;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.x1 = option.from.x;
        this.y1 = option.from.y;
        this.x2 = option.to.x;
        this.y2 = option.to.y;
        this.style = option.style || "#fff";
        this.info = option.info || "";
        this.init(mkObj); // 初始化

        mkObj.lines[mkObj.lineCount] = this;
        mkObj.lineCount++;
        this.createBall(mkObj);
    }

    Line.prototype = {
        init: function(mkObj){
            var cPoint = calControlPoint(this.x1,this.y1,this.x2,this.y2);
            this.cx = cPoint.x;
            this.cy = cPoint.y;
            this.angle = calcAngle(this.cx,this.cy,this.x2,this.y2);
            // 创建小球运动的svg路线
            this.path = document.createElementNS('http://www.w3.org/2000/svg','path');
            this.path.setAttribute('d','M' + this.x1 + ' ' + this.y1 + ' ' + 'Q' + this.cx + ' ' + this.cy + ' ' + this.x2 + ' ' + this.y2);
            this.len = this.path.getTotalLength();
            this.mkObj = mkObj;
        },
        paint: function(){
            var ctx = this.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.globalAlpha = 1;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 10;
            ctx.shadowColor="rgba(255,255,255,0.3)";
            this.draw(1);
            ctx.strokeStyle = this.style;
            ctx.stroke();
            // drawArrow(ctx,this.x2,this.y2,this.angle,20,10,this.style);
            ctx.closePath();
            ctx.restore();
        },
        onHover: function(e){
            // info.innerHTML = "";
            // for(var i = 0; i < this.info.length; i++){
            //   var new_div = document.createElement("div");
            //   var node = document.createTextNode(this.info[i]);
            //   new_div.appendChild(node);
            //   info.appendChild(new_div);
            // }
            // var infoX = e.clientX;
            // var infoY = e.clientY;
            // if(e.clientX + 200 > window.innerWidth){
            //   infoX = e.clientX - 150;
            // }else if(e.clientY + 200 > window.innerHeight){
            //   infoY = e.clientY - 200;
            // }
            // info.style.top = infoY + "px";
            // info.style.left = infoX + 20 + "px";
            // info.style.display = "block";
        },
        draw: function(width){
            var ctx = this.ctx;
            ctx.moveTo(this.x1,this.y1);
            ctx.quadraticCurveTo(this.cx,this.cy,this.x2,this.y2);
            ctx.lineWidth = width;
            ctx.lineCap   = 'round';
        },
        isMouseInLine: function(mouse){
            this.ctx.beginPath();
            this.draw(10);
            return this.ctx.isPointInStroke(mouse.x, mouse.y);
        },
        pointAt: function(percent){
            this.px = this.path.getPointAtLength(this.len * percent).x;
            this.py = this.path.getPointAtLength(this.len * percent).y;
            return this.path.getPointAtLength(this.len * percent);
        },
        change: function(option,mkObj){
            this.x1 = option.x1;
            this.y1 = option.y1;
            this.x2 = option.x2;
            this.y2 = option.y2;
            this.init();
            //debugger;
            this.changeBall(mkObj);
        },
        hoverPaint: function(){
            var ctx = this.ctx;
            ctx.beginPath();
            ctx.globalAlpha = 0.3;
            this.draw(6);
            ctx.strokeStyle = this.style;
            ctx.stroke();
            // drawArrow(ctx,this.x2,this.y2,this.angle,20,10,this.style);
        },
        createBall: function(mkObj){
            var obj = {
                ctx: this.ctx,
                x1: this.x1,
                y1: this.y1,
                path: this.path,
                len: this.len,
                style: this.style
            }
            new Ball(this.id,obj,mkObj);
        },
        changeBall: function(mkObj){
            //debugger;
            mkObj.balls[this.id].change(this.x1,this.y1,this.path,this.len);
        }
    }

    // 球-对象
    var Ball = function(id,obj,mkObj){
        this.ctx = obj.ctx;
        this.x = obj.x1;
        this.y = obj.y1;
        this.path = obj.path;
        this.len = obj.len;
        this.style = obj.style || "#fff";
        mkObj.balls[id] = this;
        mkObj.ballCount++;
    }

    Ball.prototype = {
        paint: function(percent){
            // percent 可以理解为小球运动速度
            var percent = percent / 100;
            var ctx = this.ctx;
            var radius = 15;
            ctx.save();
            this.x = this.pointAt(percent).x,
                this.y = this.pointAt(percent).y;
            ctx.globalAlpha = 0.5;

            // 运动的球的原始个体
            var cvsBall = document.createElement('canvas'),
                ctxBall = cvsBall.getContext('2d');
            cvsBall.width = 100;
            cvsBall.height = 100;
            ctxBall.beginPath();
            ctxBall.arc(50, 50, 15, 0, Math.PI * 2);
            ctxBall.fillStyle = 'rgba(255,255,255,1)';
            ctxBall.fill()

            ctx.drawImage(cvsBall, this.x - radius / 2, this.y - radius / 2, radius, radius);
            ctx.restore();
        },
        change: function(x1,y1,path,len){
            this.x = x1;
            this.y = y1;
            this.path = path;
            this.len = len;
        },
        pointAt: function(percent){
            return this.path.getPointAtLength(this.len * percent);
        }
    }

    var Point = function(option, mkObj){
        this.x = option.x;
        this.y = option.y;
        this.info = option.info || "";
        this.style = option.style || '#fff';
        this.ctx = mkObj.ctxGlobal;
        option.id == 0 ? this.id = 0 : this.id = option.id || mkObj.pointCount;
        mkObj.points[mkObj.pointCount] = this;
        mkObj.pointCount++;
    }

    Point.prototype = {
        paint: function(r){
            var ctx = this.ctx;
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.beginPath();
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 15;
            ctx.shadowColor="rgba(255,255,255,0.3)";
            this.draw(r);
            ctx.fillStyle = this.style;
            ctx.strokeStyle = this.style;
            ctx.lineWidth = 0.5;
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        },
        onHover: function(e){
            // info.innerHTML = "";
            // var new_div = document.createElement("div");
            // var node = document.createTextNode(this.info);
            // new_div.appendChild(node);
            // info.appendChild(new_div);
            // var infoX = e.clientX;
            // var infoY = e.clientY;
            // if(e.clientX + 200 > window.innerWidth){
            //   infoX = e.clientX - 150;
            // }else if(e.clientY + 200 > window.innerHeight){
            //   infoY = e.clientY - 200;
            // }
            // info.style.top = infoY + "px";
            // info.style.left = infoX + 20 + "px";
            // info.style.display = "block";
        },
        draw: function(r){
            var ctx = this.ctx;
            ctx.arc(this.x,this.y,r,0,Math.PI * 2);
        },
        isMouseInPoint: function(mouse){
            this.ctx.beginPath();
            this.draw(5);
            return this.ctx.isPointInPath(mouse.x, mouse.y);
        },
        change: function(option){
            this.x = option.x;
            this.y = option.y;
        },
        hoverPaint: function(){
            this.paint(5);
        },
    }

    var Text = function(option, mkObj){
        this.x = option.x;
        this.y = option.y;
        this.info = option.info || "";
        this.style = option.style || '#fff';
        this.ctx = mkObj.ctxGlobal;
        option.id == 0 ? this.id = 0 : this.id = option.id || mkObj.textCount;
        mkObj.texts[mkObj.textCount] = this;
        mkObj.textCount++;
    }

    Text.prototype = {
        paint: function(r){
            var ctx = this.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = this.style;
            this.draw(r);
            ctx.restore();
        },
        draw: function(r){
            var ctx = this.ctx;
            ctx.font="18px Arial"
            ctx.fillText(this.info, this.x,this.y);
        },
        change: function(option){
            this.x = option.x;
            this.y = option.y;
        },
    }

    var MarkLine = function(canvasId,bgId,w,h){
        var canvas = document.getElementById(canvasId);
        cvs = document.getElementById(canvasId);
        if (canvas == null) console.error("The canvas id is undefined.Check it.")
        else{
            markLine.prototype.id = canvasId;
            markLine.prototype.ctx = canvas.getContext('2d');
            // markLine.prototype.mkObj = new MarklineObj();//same as in init() function of MarkLine.prototype
            return new markLine.prototype.init(canvasId, bgId, w,h);
        }
    }

    MarkLine.prototype = {
        init: function(canvasId, bgId, w,h){
            this.canvas = document.getElementById(canvasId);

            this.mkObj = new MarklineObj();
            this.mkObj.imgId = bgId || "";
            this.mkObj.canWidth = w || this.canvas.width;
            this.mkObj.canHeight = h || this.canvas.height;
            this.mkObj.ctxGlobal = this.canvas.getContext('2d');
            this.mkObj.canvas = this.canvas;

            // 鼠标事件监听
            mouseEvents(this.canvas, this.mkObj);
        },
        updateLine: function(option){
            this.mkObj.lines.length = 0;
            this.mkObj.balls.length = 0;
            this.mkObj.lineCount = 0;
            this.mkObj.ballCount = 0;
            if (option.length == 0) return;
            else {
                for(var i = 0; i < option.length; i++){
                    new Line(i,option[i],this.canvas,this.mkObj);
                }
            }
        },
        paint: function(){
            animation(this.mkObj);
        },
        paintPoint: function(option){
            this.mkObj.points.length = 0;
            this.mkObj.pointCount = 0;
            this.mkObj.pointOption = 0;
            if (option.length == 0) return;
            else {
                for(var i = 0; i < option.length; i++){
                    new Point(option[i], this.mkObj);
                }
            }
            this.mkObj.pointOption = option.length;
        },
        paintText: function(option){
            this.mkObj.texts.length = 0;
            this.mkObj.textCount = 0;
            this.mkObj.textOption = 0;
            if (option.length == 0) return;
            else {
                for(var i = 0; i < option.length; i++){
                    new Text(option[i], this.mkObj);
                }
            }
            this.mkObj.textOption = option.length;
        },
        onContextmenu: function(fn){
            this.canvas.addEventListener("contextmenu",fn,false);
        },
        onClick: function(fn){
            var cvs = this.canvas;
            cvs.addEventListener("mousedown",function(e){
                var e = e || window.event;
                if(e.which == 1){
                    cvs.addEventListener("mouseup",fn,false);
                }else{
                    cvs.removeEventListener("mouseup",fn,false);
                    return
                }
            },false);
        },
        setOption: function(option){
            this.updateLine(option);
        },
        getLines: function(){
            return this.mkObj.lines;
        },
        getLine: function(id){
            return this.mkObj.lines[id];
        },
        getBalls: function(){
            return this.mkObj.balls;
        },
        getBall: function(id){
            return this.mkObj.balls[id];
        },
        getPoint: function(id){
            return this.mkObj.points[id];
        },
        getPoints: function(){
            return this.mkObj.points;
        },
        getText: function(id){
            return this.mkObj.texts[id];
        },
        getTexts: function(){
            return this.mkObj.texts;
        },
        getTransInfo: function(){
            return {
                x: this.mkObj.imgPosition.x,
                y: this.mkObj.imgPosition.y,
                scale: this.mkObj.scaleFlag
            }
        },
        getHover: function(){
            return this.mkObj.hoverFlag;
        }
    }

    // 画背景
    function paintBg(mkObj){
        mkObj.ctxGlobal.save();
        mkObj.ctxGlobal.ctxGlobalAlpha = 1;
        if(mkObj.imgId != ""){
            var img = document.getElementById(mkObj.imgId);
            mkObj.ctxGlobal.drawImage(img,mkObj.imgPosition.x,mkObj.imgPosition.y,mkObj.canWidth,mkObj.canHeight);
        }
        mkObj.ctxGlobal.restore();
    }

    // 绘制关键点
    function paintPoint(option,mkObj){
        for(var i = 0; i < option; i++){
            mkObj.points[i].paint(2.5);
        }
    }

    function paintText(option,mkObj){
        for(var i = 0; i < option; i++){
            mkObj.texts[i].paint(2.5);
        }
    }

    // 清除画布
    function cleanCvs(mkObj){
        // 重置渲染上下文并清空画布
        mkObj.ctxGlobal.save();
        mkObj.ctxGlobal.setTransform(1, 0, 0, 1, 0, 0);
        mkObj.ctxGlobal.clearRect(0, 0, mkObj.canvas.width, mkObj.canvas.height);
        // 恢复先前渲染上下文所进行的变换
        mkObj.ctxGlobal.restore();
    }

    // 画线、布图
    function animation(mkObj){
        mkObj.ctxGlobal.globalCompositeOperation = 'source-over';
        mkObj.clickFlag == true ?  mkObj.ctxGlobal.globalAlpha = 1 : mkObj.ctxGlobal.globalAlpha = 0.2; //小球轨迹
        mkObj.percent >= 100 ? mkObj.percent = 0 : mkObj.percent = (mkObj.percent + 0.3); // 小球速度控制

        paintBg(mkObj);
        // 绘制背景

        // 绘制线、球
        if(mkObj.clickFlag != true){
            if(mkObj.hoverFlag.hover != false && mkObj.hoverFlag.type == "line"){
                mkObj.lines[mkObj.hoverFlag.id].hoverPaint();
            }
            for(var i = 0; i < mkObj.lines.length; i++){
                mkObj.lines[i].paint();
                mkObj.balls[i].paint(mkObj.percent);
            }
        }else{
            for(var i = 0; i < mkObj.lines.length; i++){
                mkObj.lines[i].paint();
            }
        }

        if(mkObj.hoverFlag.hover != false && mkObj.hoverFlag.type == "point"){
            mkObj.points[mkObj.hoverFlag.id].hoverPaint();
            paintPoint(mkObj.pointOption,mkObj);
        }else{
            paintPoint(mkObj.pointOption,mkObj);
        }

        paintText(mkObj.textOption,mkObj);

        window.requestAnimationFrame(function() {
            animation(mkObj)
        });
    }

    // 验证是否触摸
    function isHover(mouse,e,mkObj){
        var tempId = null;
        for(var i = 0;i < mkObj.lines.length; i++){
            if(mkObj.lines[i].isMouseInLine(mouse)){
                mkObj.hoverFlag.type = "line";
                tempId = mkObj.lines[i].id;
                mkObj.lines[i].onHover(e);
            }
        }

        for(var i = 0;i < mkObj.points.length; i++){
            if(mkObj.points[i].isMouseInPoint(mouse)){
                mkObj.hoverFlag.type = "point";
                mkObj.points[i].onHover(e);
                tempId = i;
            }
        }

        if(tempId != null){
            mkObj.hoverFlag.hover = true;
            mkObj.hoverFlag.id = tempId;
            cvs.style.cursor = "pointer";
        }else{
            info.style.display = "none";
            mkObj.hoverFlag.hover = false;
            mkObj.hoverFlag.id = null;
            mkObj.hoverFlag.type = "";
            cvs.style.cursor = mkObj.pointerStyle || "default";
        }
    }

    // 鼠标事件
    function mouseEvents(canvas, mkObj){
        // 触摸事件
        canvas.addEventListener("mousemove", function(e){
            var mouse = {
                x : e.clientX - canvas.getBoundingClientRect().left,
                y : e.clientY - canvas.getBoundingClientRect().top
            };
            isHover(mouse,e,mkObj);
        }, false);

        // 拖拽事件
        canvas.addEventListener("mousedown",function(e){
            var mouse = {
                x : e.clientX - canvas.getBoundingClientRect().left,
                y : e.clientY - canvas.getBoundingClientRect().top
            };

            function offset(mouse,x,y){
                return {
                    x : mouse.x - x,
                    y : mouse.y - y
                }
            }

            var imgOffset = offset(mouse,mkObj.imgPosition.x,mkObj.imgPosition.y);

            var tempLines = [];
            var tempPoints = [];
            var tempTexts = [];

            for(var i = 0; i < mkObj.lines.length; i++){
                var tempPos1 = offset(mouse,mkObj.lines[i].x1,mkObj.lines[i].y1);
                var tempPos2 = offset(mouse,mkObj.lines[i].x2,mkObj.lines[i].y2);
                var tempPostion = {
                    x1: tempPos1.x,
                    y1: tempPos1.y,
                    x2: tempPos2.x,
                    y2: tempPos2.y
                }
                tempLines.push(tempPostion);
            }

            for(var i = 0; i < mkObj.points.length; i++){
                var tempXY = offset(mouse,mkObj.points[i].x,mkObj.points[i].y);
                var tempPos = {
                    x: tempXY.x,
                    y: tempXY.y
                }
                tempPoints.push(tempPos);
            }

            for(var i = 0; i < mkObj.texts.length; i++){
                var tempXY = offset(mouse,mkObj.texts[i].x,mkObj.texts[i].y);
                var tempPos = {
                    x: tempXY.x,
                    y: tempXY.y
                }
                tempTexts.push(tempPos);
            }

            // 改变鼠标指针样式
            mkObj.pointerStyle = "move";
            cvs.style.cursor = mkObj.pointerStyle;
            mkObj.clickFlag = true;

            // 拖动事件
            canvas.addEventListener("mousemove",function(e){
                var mouse = {
                    x : e.clientX - canvas.getBoundingClientRect().left,
                    y : e.clientY - canvas.getBoundingClientRect().top
                };
                if(mkObj.clickFlag == true){
                    // 坐标计算
                    mkObj.imgPosition.x = mouse.x - imgOffset.x;
                    mkObj.imgPosition.y = mouse.y - imgOffset.y;
                    for(var i = 0; i < mkObj.lines.length; i++){
                        var tempOption = {
                            x1 : mouse.x - tempLines[i].x1,
                            y1 : mouse.y - tempLines[i].y1,
                            x2 : mouse.x - tempLines[i].x2,
                            y2 : mouse.y - tempLines[i].y2
                        }
                        mkObj.lines[i].change(tempOption,mkObj);
                    }
                    for(var i = 0; i < mkObj.points.length; i++){
                        var tempOption = {
                            x : mouse.x - tempPoints[i].x,
                            y : mouse.y - tempPoints[i].y,
                        }
                        mkObj.points[i].change(tempOption);
                    }
                    for(var i = 0; i < mkObj.texts.length; i++){
                        var tempOption = {
                            x : mouse.x - tempTexts[i].x,
                            y : mouse.y - tempTexts[i].y,
                        }
                        mkObj.texts[i].change(tempOption);
                    }
                    cleanCvs(mkObj);
                    paintBg(mkObj);
                    for(var i = 0; i < mkObj.lines.length; i++){
                        mkObj.lines[i].paint();
                    }
                    for(var i = 0; i < mkObj.points.length; i++){
                        mkObj.points[i].paint(2.5);
                    }
                    for(var i = 0; i < mkObj.texts.length; i++){
                        mkObj.texts[i].paint(2.5);
                    }
                }

            }, false)
            canvas.addEventListener("mouseup",function(e){
                mkObj.pointerStyle = "default";
                cvs.style.cursor = mkObj.pointerStyle;
                mkObj.clickFlag = false;
            }, false)
            e.preventDefault();
        }, false)

        // 鼠标缩放
        canvas.addEventListener("mousewheel",function(e){
            e = e || window.event;
            var delta = e.wheelDelta;
            if(delta > 0){
                if (mkObj.scaleFlag <= 9){
                    scaleCvs(1.25,e,mkObj);
                }
            }else{
                if (mkObj.scaleFlag >= -9){
                    scaleCvs(0.8,e,mkObj);
                }
            }
        },false);
    }

    function scaleCvs(scale,e,mkObj){
        scale > 1 ? mkObj.scaleFlag += 1 : mkObj.scaleFlag -=1;
        e = e || window.event;
        // 获取鼠标的位置
        var mouse = {
            x : e.clientX - canvas.getBoundingClientRect().left, // 距离canvas左侧的距离
            y : e.clientY - canvas.getBoundingClientRect().top  // 距离canvas顶部的距离
        };

        // 获取鼠标中心点与背景的左上角坐标偏移量
        var offset = {
            x : mouse.x - mkObj.imgPosition.x,
            y : mouse.y - mkObj.imgPosition.y
        }

        // 缩放的值
        var translate = {
            x: (1 - scale) * offset.x,
            y: (1 - scale) * offset.y,
        }

        // 背景偏移最后坐标值
        var imgTransX = mkObj.imgPosition.x + translate.x;
        var imgTransY = mkObj.imgPosition.y + translate.y;

        // 计算曲线端点缩放后的位置
        for(var i = 0; i < mkObj.lines.length; i++){
            var tempOption = {
                x1 : scale * (mkObj.lines[i].x1 - mkObj.imgPosition.x) + imgTransX,
                y1 : scale * (mkObj.lines[i].y1 - mkObj.imgPosition.y) + imgTransY,
                x2 : scale * (mkObj.lines[i].x2 - mkObj.imgPosition.x) + imgTransX,
                y2 : scale * (mkObj.lines[i].y2 - mkObj.imgPosition.y) + imgTransY
            }
            mkObj.lines[i].change(tempOption,mkObj);
        }

        for(var i = 0; i < mkObj.points.length; i++){
            var tempPos = {
                x : scale * (mkObj.points[i].x - mkObj.imgPosition.x) + imgTransX,
                y : scale * (mkObj.points[i].y - mkObj.imgPosition.y) + imgTransY
            }
            mkObj.points[i].change(tempPos);
        }

        for(var i = 0; i < mkObj.texts.length; i++){
            var tempPos = {
                x : scale * (mkObj.texts[i].x - mkObj.imgPosition.x) + imgTransX,
                y : scale * (mkObj.texts[i].y - mkObj.imgPosition.y) + imgTransY
            }
            mkObj.texts[i].change(tempPos);
        }

        // 背景位置、长宽
        mkObj.imgPosition.x = imgTransX;
        mkObj.imgPosition.y = imgTransY;
        mkObj.canWidth = scale * mkObj.canWidth;
        mkObj.canHeight = scale * mkObj.canHeight;

        cleanCvs(mkObj);
        paintBg(mkObj);

    }

    MarkLine.prototype.init.prototype = MarkLine.prototype;

    window.markLine = MarkLine;

})(window);
