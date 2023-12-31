
var cubeRenderer, cubeScene, cubeMesh, cubeCamera, cubeControls, cubeContainer, cubeCamZ, cubeCamY, cubeCamX;
var renderer, scene, camera, controls, stats, CamZ, CamY, CamX;
var sampleCube;
var isDragging = false;
var axises, cubeAxises, gCode, tGcode, sTl, isolateModel = new THREE.Group();
var selectedLineContent;
var plainTextFile = "tap,gcode,nc,mpt,mpf";
var STL = "stl";
var mark;
var timer;
var divider, dividerPos, menu, codeViewer, statsContainer, v;
var type = "UNKNOWN";
var codeMirrorStartSellecting = false;
var isDragging = false;
var supressMain = false;
var supressCube = false;
var isASCII = false;
var landscape = true;
var cordinatesDiv = document.getElementById('cordinates');
// 创建球体对象
var cursor3D = new THREE.Group();
cursor3D.name = "cursor";
var cursor3DX = new THREE.Geometry();
cursor3DX.vertices.push(new THREE.Vector3(-1, 0, 0));
cursor3DX.vertices.push(new THREE.Vector3(1, 0, 0));
cursor3D.add(new THREE.Line(cursor3DX, new THREE.LineBasicMaterial({ color: 0xff0000 })));
var cursor3DY = new THREE.Geometry();
cursor3DY.vertices.push(new THREE.Vector3(0, -1, 0));
cursor3DY.vertices.push(new THREE.Vector3(0, 1, 0));
cursor3D.add(new THREE.Line(cursor3DY, new THREE.LineBasicMaterial({ color: 0x00ff00 })));
var cursor3DZ = new THREE.Geometry();
cursor3DZ.vertices.push(new THREE.Vector3(0, 0, -1));
cursor3DZ.vertices.push(new THREE.Vector3(0, 0, 1));
cursor3D.add(new THREE.Line(cursor3DZ, new THREE.LineBasicMaterial({ color: 0x0000ff })));
var cursor3DP = new THREE.Geometry();
cursor3DP.vertices.push(new THREE.Vector3(0, 0, 0));
cursor3D.add(new THREE.Points(cursor3DP, new THREE.PointsMaterial({
    color: 0x009900,
    size: 5,
    alphaTest: 0.5, // 设置透明度阈值，控制圆形的边缘
    opacity: 0.75, // 设置透明度
    sizeAttenuation: false, // 关闭点的大小衰减
    transparent: true // 开启透明度
})));
// 定义一个射线投射器
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var oldLineNum = 0;
var isolateMode = false;
var viewMode = 0;
//cursor3D.add(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })));
cursor3D.visible = false;
var txar;
window.onload = function() {
    init();
    render();
    bt_state();
    txar = CodeMirror.fromTextArea(document.getElementById('txar'), {
        lineNumbers: true,
        mode: "text/x-gcode",
        keywords: ["G0", "G1", "G2", "G3", "G4", "G10", "G11", "G17", "G18", "G19", "G20", "G21", "G28", "G30", "G38.2", "G38.3", "G38.4", "G38.5", "G40", "G41", "G42", "G43", "G49", "G53", "G54", "G55", "G56", "G57", "G58", "G59", "G61", "G80", "G90", "G91", "G92", "G92.1", "G92.2", "G92.3", "G93", "G94", "G95", "G96", "G97", "G98", "G99", "M0", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "X","Y","Z","A","B","C","F","E"],
        commentStart:";",
        commentEnd:"",
    });

    //txar.refresh();

    txar.on("cursorActivity", function () {
        var cursor = txar.getCursor();
        var lineNumber = cursor.line;// + 1; // 行号从0开始，所以需要加1
        markLine(lineNumber, false);
        // 将球体添加到场景中
        if (codeMirrorStartSellecting) {
            filterCmd();
            codeMirrorStartSellecting = false;
        } else {
            fxisolationMode(isolateLayer(lineNumber));
        }
    });

    txar.on("touchstart", txarActionStart);
    txar.on("mousedown", txarActionStart);
    function txarActionStart(txar, event) {
        codeMirrorStartSellecting = true;
        console.log("mousedownT");
    }
    txar.on("touchend", txarActionEnd);
    txar.on("mouseup", txarActionEnd);
    function txarActionEnd(txar, event) {
        codeMirrorStartSellecting = false;
        fxisolationMode();
        console.log("mouseupT");
    }
    
    txar.on("keyup", function (txar, event) {
        if (event.key === "Shift") {
            // set a timmer delay here if in 1000ms shift key is not pressed then enter the isolation mode       
            filterCmd();
            console.log("Shift key was released");
        }
        if (event.key == "Escape") {
            //exit isolation mode
            fxisolationMode();
            if (mark !== undefined) {
                mark.clear();
            }
            console.log("Escape key was released");
        }
    });
    //双击重置视角
    cubeRenderer.domElement.addEventListener('dblclick', function (event) {
        resetView();
    });
    renderer.domElement.addEventListener('dblclick', function (event) {
        autoMagnify();
    });
    //同步转动
    controls.addEventListener('change', function (event) {
        if (!supressMain) {
            cubeCamera.position.copy(calculatePoint3(camera.position, cubeCamera.position));
            cubeCamera.lookAt(0, 0, 0);
            supressCube = true;
        }
    });
    cubeControls.addEventListener('change', function (event) {
        if (!supressCube) {
            camera.position.copy(calculatePoint3(cubeCamera.position, camera.position));
            camera.lookAt(0, 0, 0);
            supressMain = true;
        }
    });
    menu.addEventListener('click', function (event) {
        if(event.target.id === 'menu'){
        menu.style.left = menu.style.left === '0%' ? '-98.5%' : '0%';
    }
    });

}
//initStats();

document.addEventListener('touchstart', actionStart);
document.addEventListener('mousedown', actionStart);
function actionStart(e) {
    isDragging = getTarget(e) === 'divider';
    divider.style.background = 'rgba(64,128,200,0.5)';
    // if (e.target.className.includes("CodeMirror")) {
    //     codeMirrorStartSellecting = true;
    //     console.log("mousedown");
    // }
}
document.addEventListener('touchmove', actionMove);
document.addEventListener('mousemove', actionMove);
function actionMove(e) {
    if (getTarget(e) === 'divider') {
        divider.style.background = 'rgba(64,128,200,0.5)';
    } else {
        if (!isDragging && divider!==undefined) {
            divider.style.background = 'rgba(128,128,128,0.5)';
        }
    }
    if (!isDragging) return;
    if (landscape) {
        divider.style.left = ((e.touches && e.touches.length >= 1) ? e.touches[0].clientX : e.x) + 'px';
        //console.log("left = " + e.x);
        codeViewer.style.width = divider.style.left;
    } else {
        var y = (((e.touches && e.touches.length >= 1) ? e.touches[0].clientY : e.y));
        divider.style.bottom = (window.innerHeight - y) + 'px';
        //console.log("bottom = " + e.y);
        codeViewer.style.height = divider.style.bottom;
        codeViewer.style.top = y + 'px';
    }

    //检查鼠标是否移出了目标元素
    var rect = e.target.getBoundingClientRect();
    if ((x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) && e.target.id === 'divider') {
        //console.log('Mouse moved out of target');
        isDragging = false;
        supressMain = false;
        supressCube = false;
        divider.style.background = 'rgba(128,128,128,0.5)';
    }
    if (codeMirrorStartSellecting && !e.target.className.includes("CodeMirror")) {
        codeMirrorStartSellecting = false;
        fxisolationMode();
        console.log("mouseupM");
    }
}
document.addEventListener('touchend', actionEnd);
document.addEventListener('mouseup', actionEnd);
function actionEnd(e) {
    isDragging = false;
    supressMain = false;
    supressCube = false;
    divider.style.background = 'rgba(128,128,128,0.5)';
    //txar.on("mouseup",fxisolationMode);
    if (codeMirrorStartSellecting) {
        codeMirrorStartSellecting = false;
        fxisolationMode();
        console.log("mouseup");
    }
}

function disableKeyboardInput() {
    function disableEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // 移除键盘事件监听器
    scene.removeEventListener('keydown', disableEvent, false);
    scene.removeEventListener('keyup', disableEvent, false);
}
//监听屏幕大小变化
window.addEventListener('resize', function onWindowResize() {
    // 调整渲染器大小
    cubeCamera.aspect = 1;
    cubeCamera.updateProjectionMatrix();
    cubeRenderer.setSize(150, 150);
    cubeRenderer.render(cubeScene, cubeCamera);
    cubeControls.update();
    initSettops();

    var fullscreen = document.getElementById('fullscreenText');
    var isChinese = navigator.language.startsWith('zh');
    const fullscreenObj = buttons.find(button => button.id === 'fullscreenText');
    const exitfullscreenObj = buttons.find(button => button.id === 'exitFullscreenText');
    const fullscreenText = isChinese ? fullscreenObj.text.cn : fullscreenObj.text.en;
    const exitfullscreenText = isChinese ? exitfullscreenObj.text.cn : exitfullscreenObj.text.en;
    if (document.fullscreenElement) {
        fullscreen.textContent = exitfullscreenText;
    } else {
        fullscreen.textContent = fullscreenText;
    }

}, false);

// 监听拖放事件
window.addEventListener('dragover', function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
});

window.addEventListener('drop', function (event) {
    event.preventDefault();
    read_file(event.dataTransfer.files[0]);
});

// 监听鼠标移动事件
window.addEventListener('mousemove', function onMouseMove(event) {
    // 计算鼠标在屏幕上的位置
    mouse.x = (event.clientX / document.documentElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY /document.documentElement.clientHeight) * 2 + 1;
    //console.log("x=" + mouse.x + " y=" + mouse.y);
}, false);

// 监听鼠标点击事件
window.addEventListener('click', function onClick(event) {
    //判断是否为鼠标左键点击,如果不是则返回
    if (event.button !== 0) return;
    // 更新射线投射器的起点和方向
    raycaster.setFromCamera(mouse, camera);

    // 计算与射线相交的物体
    var intersects = raycaster.intersectObjects(scene.children, true);
    if (gCode == undefined) return;
    var codeLines = [];
    // 如果有相交的物体
    if (intersects.length > 0) {
        console.log(intersects);
        all_loop:
        for (var i = 0; i < intersects.length; i++) {
            var intersect = intersects[i];
            if (intersect.object.type === 'LineSegments') {
                var delta = 0.05;
                var x = intersect.point.x;
                var y = intersect.point.y;
                var z = intersect.point.z;
                var uuid = intersect.object.uuid;
                if (mark !== undefined) {
                    mark.clear();
                }
                for (var j = 0; j < gCode.children.length - 1; j++) {
                    var child = gCode.children[j];
                    if (child.uuid == uuid) {
                        for (var k = 0; k < child.geometry.vertices.length; k++) {
                            var vertex = child.geometry.vertices[k];
                            if (
                                Math.abs(vertex.x - x) <= delta
                                && Math.abs(vertex.y - y) <= delta
                                && Math.abs(vertex.z - z) <= delta
                            ) {
                                console.log(vertex.name);
                                console.log("abs(x:" + vertex.x + "-p.x:" + x + ")=" + Math.abs(vertex.x - x));
                                console.log("abs(y:" + vertex.y + "-p.y:" + y + ")=" + Math.abs(vertex.y - y));
                                console.log("abs(z:" + vertex.z + "-p.z:" + z + ")=" + Math.abs(vertex.z - z));
                                if (vertex.name != undefined) {
                                    var lineNumber = parseInt(vertex.name.substring(2));
                                    codeLines.push(lineNumber);
                                    //break; // 跳出最内层的循环
                                    break all_loop; // 跳出所有的循环
                                }
                            }
                        }

                    }
                }
            } else {
                if (mark !== undefined) {
                    mark.clear();
                }
                cursor3D.visible = false;
            }
        }
        if (codeLines.length != 0) {
            var tLine = codeLines[0];
            codeLines.forEach(codeline => {
                tLine = tLine > codeline ? codeline : tLine;
            });

            markLine(tLine, true);
            oldLineNum = tLine;
        } else {
            //没有找到对应的行号
            //恢复正常显示,退出隔离模式
            fxisolationMode();

        }
    }
}, false);

function getTarget(event) {
    if (event.target.id != "") { return event.target.id; }
    if (event.touches && event.touches[0].target.id != "") { return event.touches[0].target.id; }
    return "";
}
//向前扫描获取当前三维坐标以及最近的z轴高度，向后可获取可能的安全z轴高度
function getCordinats(line, forward) {
    var x, y, z, e, a = 0;
    var currentLine = line;
    var maxLine = txar.lineCount();
    while ((x === undefined || y === undefined || z === undefined) && (forward ? currentLine >= 0 : currentLine <= maxLine)) {
        var lineContent = txar.getLine(forward ? currentLine-- : currentLine++);
        if (lineContent === undefined) break;
        if (!lineContent.includes(" ")) continue;
        var parts = lineContent.split(' ');
        for (var j = 0; j < parts.length; j++) {
            var part = parts[j];
            var t = parseFloat(part.substring(1));
            if (isNaN(t)) { continue; }
            if (part.startsWith('X') || part.startsWith('x')) {
                x = x === undefined ? t : x;
            } else if (part.startsWith('Y') || part.startsWith('y')) {
                y = y === undefined ? t : y;
            } else if (part.startsWith('Z') || part.startsWith('z')) {
                z = z === undefined ? t : z;
            } else if (part.startsWith('E') || part.startsWith('e')) {
                e = e === undefined ? t : z;
            } else if (part.startsWith('A') || part.startsWith('a')) { // 处理A轴的值
                a = a == 0 ? t : a;
            }
        }
    }
    x = x === undefined ? 0 : x;
    y = y === undefined ? 0 : y;
    z = z === undefined ? 0 : z;
    e = e === undefined ? 0 : e;
    a = a === undefined ? 0 : a;
    document.getElementById('x').innerHTML = "X:" + x;
    document.getElementById('y').innerHTML = "Y:" + y;
    document.getElementById('z').innerHTML = "Z:" + z;
    document.getElementById('e').innerHTML = "E:" + e;
    document.getElementById('a').innerHTML = "A:" + a;

    //return new THREE.Vector3(x, y, z);//.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    return { x: x, y: y, z: z, e: e, a: a, line: currentLine };
}
//输入行号后返回此行所在层的开始行号以及结束行号
function isolateLayer(lineNumber) {
    if (gCode === undefined) {
        return { start: 0, end: 0 };
    }
    //获取当当前z轴高度以及安全z轴高度
    var locArray = getCordinats(lineNumber, true);
    var z = locArray.z;
    var safeZ0, safeZ1, safeZ;
    var safeLine0, safeLine1;
    var flocArray, blocArray, oldFlocArray, oldBlocArray;
    if (locArray.line > 1) {
        // 向上去寻找z值不相等的行，获取其z值以及行号
        flocArray = getCordinats(locArray.line - 1, true);
        while (flocArray.z === z && flocArray.line > 1) {
            flocArray = getCordinats(flocArray.line - 1, true);
        }
        safeZ0 = flocArray.z;
        safeLine0 = flocArray.line;
    }
    if (lineNumber + 1 < txar.lineCount()) {
        // 向下去寻找z值不相等的行，获取其z值以及行号
        blocArray = getCordinats(lineNumber + 1, false);
        while (blocArray.z === z && blocArray.line + 1 < txar.lineCount()) {
            blocArray = getCordinats(blocArray.line + 1, false);
        }
        safeZ1 = blocArray.z;
        safeLine1 = blocArray.line;
    }
    if (safeZ1 === undefined || safeZ0 === undefined || z === undefined) {
        //failed to get safe z or z 
        return { start: 0, end: 0 };
    }
    if (safeZ1 === safeZ0) {
        //正常可以确认安全z轴高度的情况
        //get the right safe z
        safeZ = safeZ1;
        // 向上去寻找不等于z以及safeZ的行号
        while ((flocArray.z === safeZ || flocArray.z === z) && flocArray.line > 1) {
            //oldFlocArray = flocArray.slience();
            oldFlocArray = Object.assign({}, flocArray);
            flocArray = getCordinats(flocArray.line - 1, true);
        }
        // 向下去寻找不等于z以及safeZ的行号
        while ((blocArray.z === safeZ || blocArray.z === z) && blocArray.line + 1 < txar.lineCount()) {
            //oldBlocArray = blocArray.slience();
            oldBlocArray = Object.assign({}, blocArray);
            blocArray = getCordinats(blocArray.line + 1, false);
        }
        //前一个搜索到的行号就是本层的开始行号/结束行号
        return { start: oldFlocArray.line, end: oldBlocArray.line };
    } else if (safeZ0 < safeZ1) {
        //比较正常的情况
        if (safeZ0 < z) {
            // safeZ0 可能是前一层的z轴高
            if (safeZ1 > z) {
                //safeZ1 可能是下一层的z轴高 或是标准的安全z轴高
                //再下一个z如果<safeZ1，那么safeZ1就是安全z轴高
                //再下一个z如果>safeZ1，那么safeZ1就是下一层的z轴高

                if (safeLine1 + 1 < txar.lineCount()) {
                    // 向下去寻找z值不相等的行，获取其z值以及行号
                    blocArray = getCordinats(safeLine1 + 1, false);
                    while (blocArray.z === z && blocArray.line + 1 < txar.lineCount()) {
                        blocArray = getCordinats(blocArray.line + 1, false);
                    }
                    // blocArray.z;
                    // blocArray.line;

                    if (blocArray.z < safeZ1 && blocArray.z == z) {
                        //safeZ1是安全z轴高
                        //寻找下一个z值不等于原本z以及safeZ1的行号
                        while ((blocArray.z === safeZ1 || blocArray.z === z) && blocArray.line + 1 < txar.lineCount()) {
                            //oldBlocArray = blocArray.slience();
                            oldBlocArray = Object.assign({}, blocArray);
                            blocArray = getCordinats(blocArray.line + 1, false);
                        }
                        return { start: safeLine0 + 1, end: oldBlocArray.line };
                    } else {
                        //下一层的z轴高
                        return { start: safeLine0 + 1, end: blocArray.line - 1 };
                    }
                }
                //以及扫到最后一行
                return { start: safeLine0 + 1, end: txar.lineCount() };
            }
            //safeZ1 < z  是不可能出现的
            return { start: 0, end: 0 };
        } else {
            // safeZ0 可能是前一层的安全z轴高
            if (safeZ1 > z) {
                //safeZ1 可能是下一层的z轴高 或是标准的安全z轴高
                //再下一个z如果<safeZ1，那么safeZ1就是安全z轴高
                //再下一个z如果>safeZ1，那么safeZ1就是下一层的z轴高
                if (safeLine1 + 1 < txar.lineCount()) {
                    // 向下去寻找z值不相等的行，获取其z值以及行号
                    blocArray = getCordinats(safeLine1 + 1, false);
                    while (blocArray.z === z && blocArray.line + 1 < txar.lineCount()) {
                        blocArray = getCordinats(blocArray.line + 1, false);
                    }
                    // blocArray.z;
                    // blocArray.line;

                    if (blocArray.z < safeZ1 && blocArray.z == z) {
                        //safeZ1是安全z轴高
                        //寻找下一个z值不等于原本z以及safeZ1的行号
                        while ((blocArray.z === safeZ1 || blocArray.z === z) && blocArray.line + 1 < txar.lineCount()) {
                            oldFlocArray = Object.assign({}, flocArray);
                            blocArray = getCordinats(blocArray.line + 1, false);
                        }
                        return { start: safeLine0 + 1, end: oldBlocArray.line };
                    } else {
                        //下一层的z轴高
                        return { start: safeLine0 + 1, end: blocArray.line - 1 };
                    }
                }
                //以及扫到最后一行
                return { start: safeLine0 + 1, end: txar.lineCount() };
            }
            //safeZ1 < z  是不可能出现的
            return { start: 0, end: 0 };
        }
    } else if (safeZ0 > safeZ1) {
        //safeZ0 有可能是标准安全高度，也有可能是前一层的安全高度
        if (safeZ1 > z) {
            //safeZ1 可能是下一层的z轴高
            return { start: safeLine0 + 1, end: safeLine1 - 1 };
        }
        //safeZ1 < z  是不可能出现的
        return { start: 0, end: 0 };
    }
    //不应该到这一步
    return { start: 0, end: 0 };
}

function changeIsolationMode(enable) {
    tGcode.visible = enable;
    gCode.visible = !enable;
}

function filterCmd() {
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(function () {
        //使用负值让程序自己获取起止位置
        fxisolationMode();
        console.log("执行指令");
    }, 800);

}

function fxisolationMode(range) {
    //1.源自于codemirror的选择
    //2.源自于codemirror的点击
    // var selection = txar.getSelection();
    // if (start == end || selection.length == 0) {
    //     return;
    // }
    // var lines = selection.split('\n');
    var startLine = range === undefined ? txar.getCursor("from").line : range.start;
    var endLine = range === undefined ? txar.getCursor("to").line : range.end;
    //如果没有任何定义的起止点并且没有选择任何内容则退出隔离模式
    if (startLine == endLine) {
        isolateModel.visible = false;
        scene.remove(isolateModel);
        if (isolateMode) {
            isolateModel.children.forEach(element => {
                element.geometry.dispose();
                element.material.dispose();
            });
            changeIsolationMode(false);
            //loadModle(txar.getValue(), type);
            isolateMode = false;
        }
        return;
    }
    //隔离模式没有开启并且处理的时gcode则开启隔离模式
    //否则保留现在的模式不做处理
    if (!isolateMode && type === "GCODE") {
        isolateMode = true;
        changeIsolationMode(true);
        cursor3D.visible = false;
        // var startLine = txar.getCursor("from").line;
        // var endLine = txar.getCursor("to").line;
        if (startLine > endLine) {
            var temp = startLine;
            startLine = endLine;
            endLine = temp;
        }
        var cord = getCordinats(startLine, true);
        selectedLineContent = "";
        for (var i = startLine; i <= endLine; i++) {
            selectedLineContent = selectedLineContent + '\n' + txar.getLine(i);
        }
        var pre;
        if (startLine >= 1) { pre = txar.getLine(startLine - 1).slice(0, 2) === "G0" ? "G0" : "G1"; } else { pre = "G1"; }
        isolateModel = parseGcode(selectedLineContent, cord.x, cord.y, cord.z, cord.a, startLine, pre);
        isolateModel.visible = true;
        isolateModel.name = "isolateModel";
        // var g0Material = new THREE.LineBasicMaterial({ color: 0x888888, opacity: 1, transparent: true });
        // var g1Material = new THREE.LineBasicMaterial({ color: 0x000099, opacity: 0.75, transparent: true });
        try {
            isolateModel.children[0].material.color.setHex(0x888888);
            isolateModel.children[0].material.opacity = 1;
        } catch (e) { }
        try {
            isolateModel.children[1].material.color.setHex(0x000099);
            isolateModel.children[1].material.opacity = 0.75;
        } catch (e) { }
        //add points
        //var pMaterial = new THREE.PointsMaterial({ color: 0x000099, size: 1 });
        var pMaterial = new THREE.PointsMaterial({
            color: 0x990000,
            size: 5,
            sizeAttenuation: false, // 禁用点的大小自动衰减
            alphaTest: 0.5, // 设置透明度阈值，控制圆形的边缘
            opacity: 1, // 设置透明度
            transparent: true // 开启透明度
        });
        var g0MergedGeometry = new THREE.Geometry();
        var g1MergedGeometry = new THREE.Geometry();
        // 将geometry1和geometry2合并到mergedGeometry中
        isolateModel.traverse(function (child) {
            if (child.name.includes("g0")) {
                g0MergedGeometry.merge(child.geometry);
            } else if (child.name.includes("g1")) {
                g1MergedGeometry.merge(child.geometry);
            }
        });
        var point0 = new THREE.Points(g0MergedGeometry, pMaterial);
        point0.name = "g0points";
        var point1 = new THREE.Points(g1MergedGeometry, pMaterial);
        point1.name = "g1points";
        isolateModel.add(point0);
        isolateModel.add(point1);

        tGcode.renderOrder = 3;
        isolateModel.renderOrder = 2;
        cursor3D.visible = true;
        cursor3D.renderOrder = 1;
        scene.add(isolateModel);
    }
}

function markLine(lineNumber, fromViewer) {
    if (fromViewer) {
        if (oldLineNum > lineNumber) {
            txar.setCursor(lineNumber - 2 > 0 ? lineNumber - 2 : lineNumber - 1, 0);
        } else {
            txar.setCursor(lineNumber, 0);
        }
    }
    var locArray = getCordinats(lineNumber, true);
    var center = new THREE.Vector3(locArray.x, locArray.y, locArray.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), locArray.a);
    if (center === undefined) {
        return;
    }
    if (mark !== undefined) {
        mark.clear();
    }
    var start = txar.posFromIndex(txar.indexFromPos({ line: lineNumber, ch: 0 })); // 行的起始位置
    var end = txar.posFromIndex(txar.indexFromPos({ line: lineNumber + 1, ch: 0 })); // 行的结束位置
    mark = txar.markText(start, end, { className: "highlighted-line" });
    cursor3D.visible = true;
    cursor3D.position.set(center.x, center.y, center.z);
}

function bt_open() {
    //pop open file diaglog to open local file accept extension in plainTextFile and STL
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = plainTextFile;//+ "," + STL;
    fileInput.onchange = function (event) {
        read_file(event.target.files[0]);
    };
    fileInput.click();
}
function bt_copy() {
    //copy to clipboard

    if (selectedLineContent === undefined || selectedLineContent === "") {
        alert("No code to copy!");
        return;
    }
    navigator.clipboard.writeText(selectedLineContent)
        .then(() => {
            console.log('Text copied to clipboard');
        })
        .catch(err => {
            // This can happen if the user denies clipboard permissions:
            console.error('Could not copy text: ', err);
        });

}
function read_file(file) {
    //read file content
    if (file === undefined) {
        return;
    }
    if (file.size > 1024 * 1024 * 100) {
        alert("file size is too big");
        return;
    }
    scene.remove(sampleCube);
    if (gCode !== undefined) {
        gCodeClear();
        txar.setValue("");
    }
    if (sTl !== undefined) {
        sTlClear();
        txar.setValue("");
    }
    var reader = new FileReader();
    reader.onload = function (event) {
        var contents = event.target.result;
        var extension = getFileExtension(file.name);
        type = plainTextFile.includes(extension) ? "GCODE" : STL.includes(extension) ? "STL" : "UNKNOWN"
        loadCode(contents, type, loadModle(contents, type));
    };
    reader.readAsBinaryString(file);
}
function bt_save() {
    if ((gCode === "" && sTl === "") || (gCode === undefined && sTl === undefined)) {
        alert("No code to save!");
        return;
    }
    var blob = new Blob([txar.getValue()], { type: "text/plain;charset=utf-8" });
    // 创建一个新的URL，它代表了Blob对象的地址
    let url = URL.createObjectURL(blob);
    // 创建一个新的a标签
    let a = document.createElement('a');
    // 设置a标签的href属性为Blob对象的地址
    a.href = url;
    // 设置a标签的download属性为文件的名字
    a.download = "code." + type.toLowerCase();
    // 将a标签添加到文档中
    document.body.appendChild(a);
    // 模拟用户点击a标签
    a.click();
    // 在a标签被点击后，从文档中移除它
    document.body.removeChild(a);
    // 释放Blob对象的地址
    URL.revokeObjectURL(url);

}
function gCodeClear() {
    if (gCode != undefined) {
        gCode.children.forEach(element => {
            element.geometry.dispose();
            element.material.dispose();
        });
        scene.remove(gCode);
    }
}
function sTlClear() {
    if (sTl != undefined) {
        sTl.children.forEach(element => {
            element.geometry.dispose();
            element.material.dispose();
        });
        scene.remove(sTl);
    }
}
function bt_clear() {
    txar.setValue("");
    gCodeClear();
    sTlClear();
}
function bt_regenerate() {
    var contents = txar.getValue();
    gCodeClear();
    sTlClear();
    loadModle(contents, type);
}
function bt_state() {
    var state = document.getElementById('stateShowText');
    var isChinese = navigator.language.startsWith('zh');
    const stateHideObj = buttons.find(button => button.id === 'stateHideText');
    const stateShowObj = buttons.find(button => button.id === 'stateShowText');
    const stateHide = isChinese ? stateHideObj.text.cn : stateHideObj.text.en;
    const stateShow = isChinese ? stateShowObj.text.cn : stateShowObj.text.en;
    if (state.textContent == stateShow) {
        state.textContent = stateHide;
        stats.dom.parentNode.style.display = "block";
        statsContainer.style.display = "block";
    } else {
        state.textContent = stateShow;
        stats.dom.parentNode.style.display = "none";
        statsContainer.style.display = "none";
    }
}


function bt_codeviewer() {
    if (landscape) {//横屏
        if (divider.style.left === "0%" || divider.style.left === "0px") {
            //codeViewer is hidden need to show it
            divider.style.left = dividerPos;
        } else {//codeViewer is shown need to hide it
            dividerPos = divider.style.left;
            divider.style.left = "0%";
        }
        divider.style.top = menu.getBoundingClientRect().height + "px";
        divider.style.bottom = "0%";
    
        codeViewer.style.width = divider.style.left;
        codeViewer.style.top = divider.style.top;
    } else {//竖屏
        if (divider.style.bottom === "0%" || divider.style.bottom === "0px") {
            //codeViewer is hidden need to show it
            if (dividerPos.substring(dividerPos.length - 1) === '%') {
                //divider.style.bottom 为百分值
                divider.style.bottom = (parseFloat(dividerPos)) + '%';
            }else {
                //divider.style.bottom 为像素值
                divider.style.bottom = (parseFloat(dividerPos) /document.documentElement.clientHeight) * 100 + '%';
            }
        } else {//codeViewer is shown need to hide it
            if (divider.style.bottom.substring(divider.style.bottom.length - 1) === '%') {
                //divider.style.bottom 为百分值
                dividerPos = ( parseFloat(divider.style.bottom) ) + '%';
            } else {
                //divider.style.bottom 为像素值
                dividerPos = Math.round(( parseFloat(divider.style.bottom) /document.documentElement.clientHeight)*100) + '%';
            } 
            divider.style.bottom = "0%";
        }
        codeViewer.style.width = "100%";
        codeViewer.style.height = divider.style.bottom;
        codeViewer.style.top = 'auto';
    }
    codeViewer.style.bottom = '0%';
    codeViewer.style.left = '0%';
}
function bt_fullscreen() {
    var fullscreen = document.getElementById('fullscreenText');
    var isChinese = navigator.language.startsWith('zh');
    const fullscreenObj = buttons.find(button => button.id === 'fullscreenText');
    const exitfullscreenObj = buttons.find(button => button.id === 'exitFullscreenText');
    const fullscreenText = isChinese ? fullscreenObj.text.cn : fullscreenObj.text.en;
    const exitfullscreenText = isChinese ? exitfullscreenObj.text.cn : exitfullscreenObj.text.en;

    if (fullscreen.textContent === fullscreenText) {
        fullscreen.textContent = exitfullscreenText;
        var element = document.documentElement;
        if (element.requestFullscreen == fullscreenObj) {
            element.requestFullscreen();

        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();

        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();

        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();

        }
    } else {
        fullscreen.textContent = exitfullscreenText
        if (document.exitFullscreen) {
            document.exitFullscreen();

        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();

        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();

        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();

        }
    }
}
var direction = 1;
//timmer
var gcodeTimer = {
    intervalId: null,
    startTime: null,
    elapsedTime: 0,

    start: function () {
        if (this.intervalId) {
            console.log("Timer is already running.");
            return;
        }
        this.startTime = Date.now();
        this.intervalId = setInterval(function () {
            var currentTime = Date.now();
            this.elapsedTime += currentTime - this.startTime;
            this.startTime = currentTime;
            console.log("Elapsed time: " + this.elapsedTime + " ms");
            var cursor = txar.getCursor();
            var lineNumber = cursor.line;
            if (direction == 1 && lineNumber < txar.lineCount() - 1) {
                markLine(lineNumber + direction, true);
            } else if (direction == -1 && lineNumber > 0) {
                markLine(lineNumber + direction, true);
            } else {
                gcodeTimer.pause();
            }

        }.bind(this), 100);
    },

    pause: function () {
        if (!this.intervalId) {
            console.log("Timer is not running.");
            return;
        }
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
};

function play_pause() {
    //start play
    //start a timer to move cursor based on the gcode
    var play_pause = document.getElementById('play');
    var back_pause = document.getElementById('back');
    back_pause.innerHTML = "back";
    if (play_pause.innerHTML === "play") {
        play_pause.innerHTML = "pause";
        direction = 1;
        gcodeTimer.start();
    } else {
        play_pause.innerHTML = "play";
        gcodeTimer.pause();
    }
    //pause play
    //stop timer

}
function back_pause() {
    //start back
    //start a timer to move cursor based on the gcode
    var back_pause = document.getElementById('back');
    var play_pause = document.getElementById('play');
    play_pause.innerHTML = "play";
    if (back_pause.innerHTML === "back") {
        back_pause.innerHTML = "pause";
        direction = -1;
        gcodeTimer.start();
    } else {
        back_pause.innerHTML = "back";
        gcodeTimer.pause();
    }
    //pause back
    //stop timer

}

function bt_simulate() {
    if (gCode === undefined) {
        alert("no gcode loaded");
        return;
    }
    var toolDiameter = parseFloat(document.getElementById('toolDiameter').value);
    var toolType = document.getElementById('toolType').value;
    if (toolType === "remove") {
        //CNC
        var cnc = new THREE.Group();
        //use the boundaray of the gcode to draw a 0.5 transparent white box
        // 计算模型的包围盒
        var boundingBox = new THREE.Box3().setFromObject(gCode);
        // 创建白色mash材质
        var material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        // 创建包围盒模型
        var box = new THREE.Mesh(new THREE.BoxGeometry(boundingBox.max.x - boundingBox.min.x, boundingBox.max.y - boundingBox.min.y, boundingBox.max.z - boundingBox.min.z), material);
        // 设置包围盒模型的位置
        box.position.set((boundingBox.max.x + boundingBox.min.x) / 2, (boundingBox.max.y + boundingBox.min.y) / 2, (boundingBox.max.z + boundingBox.min.z) / 2);
        // 将包围盒模型添加到场景中
        cnc.add(box);
        var h = boundingBox.max.z - boundingBox.min.z;
        //创造以toolDamteter为半径的圆柱体
        var cylinderGeometry = new THREE.CylinderGeometry(toolDiameter / 2, toolDiameter / 2, h, 32);
        var middleShape = new THREE.Shape();
        middleShape.moveTo(0, 0);
        middleShape.lineTo(0, h);
        middleShape.lineTo(toolDiameter, h);
        middleShape.lineTo(toolDiameter, 0);
        middleShape.lineTo(0, 0);
        var extrudeSettings = {
            steps: 100,
            bevelEnabled: false,
            extrudePath: gCode.children[1]
        };
        var extrudeGeometry = new THREE.ExtrudeGeometry(middleShape, extrudeSettings);
        var cut = new THREE.Mesh(extrudeGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
        cnc.add(cut);
        gCode.children[3].forEach(element => {
            cylinderGeometry.position.set(element.x, element.y, element.z);
            cnc.add(new THREE.Mesh(cylinderGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 })));
        });
        scene.add(cnc);
    }
    else if (toolType === "add") {
        //3dprinter
        var curve = gCode.children[1];
        var circleShape = new THREE.Shape();
        circleShape.absarc(0, 0, toolDiameter, 0, Math.PI * 2, false);
        var extrudeSettings = {
            steps: 100,
            bevelEnabled: false,
            extrudePath: curve
        };

        // 创建挤出几何体
        var extrudeGeometry = new THREE.ExtrudeGeometry(circleShape, extrudeSettings);
        // 创建网格并添加到场景中
        var prints = new THREE.Mesh(extrudeGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
        scene.add(prints);
    }
}

//add relative function end
function init() {
    scene = new THREE.Scene();
    scene.add(cursor3D);
    // 调用函数禁用键盘输入
    disableKeyboardInput();
    camera = new THREE.PerspectiveCamera(75, document.documentElement.clientWidth /document.documentElement.clientHeight, 0.1, 1000);
    //console.log("init, width:" + document.documentElement.clientWidth + ",height:" +document.documentElement.clientHeight);
    camera.position.set(0, -200, 200);
    camera.up = new THREE.Vector3(0, 0, 1);

    renderer = new THREE.WebGLRenderer();//{ alpha: true });
    //renderer.setSize(document.documentElement.clientWidth,document.documentElement.clientHeight);
    console.log('check1 width:' + document.documentElement.clientWidth + ' height:' +document.documentElement.clientHeight);
    
    menu = document.getElementById('menu');
    menu.style.position = 'absolute';
    menu.style.top = '0px';
    menu.style.left = '0%';
    menu.style.width = '100%';
    menu.style.background = 'rgba(0,0,0,1)';
    menu.style.border = '1px solid white';
    menu.style.zIndex = '100';
    menu.style.color = 'white';

    //console.log('check0 width:' + document.documentElement.clientWidth + ' height:' +document.documentElement.clientHeight);

    codeViewer = document.getElementById('codeViewer');
    codeViewer.style.position = 'absolute';
    codeViewer.style.left = '0px';
    //codeViewer.style.border = '1px solid white';
    codeViewer.style.zIndex = '98';

    divider = document.getElementById('divider');
    divider.style.zIndex = '99';
    divider.style.position = 'absolute';
    landscape = document.documentElement.clientWidth >document.documentElement.clientHeight;

    if (landscape) {
        codeViewer.style.width = '20%';
        codeViewer.style.height = '100%';
        codeViewer.style.top = menu.getBoundingClientRect().height + "px";
        divider.style.top = codeViewer.style.top;
        divider.style.left = codeViewer.style.width;
        divider.style.bottom = '0px';
        divider.style.height = '95%';
        divider.style.width = '0.5%';

    } else {
        codeViewer.style.width = '100%';
        codeViewer.style.height = '20%';
        codeViewer.style.top = '80%';
        divider.style.left = '0px';
        divider.style.bottom = codeViewer.style.height;
        divider.style.width = '100%';
        divider.style.height = '1%';
        divider.style.cursor = 'row-resize';

    }
    //background-color: rgba(128,128,128,0.5);
    divider.style.background = 'rgba(128,128,128,0.5)';
    v = document.getElementById('3dViewer');
    v.style.position = 'absolute';
    v.style.left = '0px';

    v.appendChild(renderer.domElement);
    // 添加环境光和点光
    var ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(500, 500, 500);
    scene.add(pointLight);
    //在scene显示坐标系
    var coneGeometry = new THREE.ConeGeometry(1, 2, 4); // 参数分别为底面半径、高度和分段数
    axises = new THREE.Group();
    axises.name = "ViewerAxises";
    //创建一个立方体框架
    var cubeGeometry = new THREE.BoxGeometry(250, 250, 250);
    var edges = new THREE.EdgesGeometry(cubeGeometry);
    var cubeMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    var cube = new THREE.LineSegments(edges, cubeMaterial);
    cube.position.set(0, 0, 125);
    axises.add(cube);

    // var planeMaterial = new THREE.MeshBasicMaterial({ color: 0x888822, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    // var planeGeometry = new THREE.PlaneGeometry(250, 250);
    // var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // axises.add(plane);
    var size = 250;
    var divisions = 25;
    var gridHelper = new THREE.GridHelper(size, divisions);
    // 将网格旋转90度，使其位于xy平面上
    gridHelper.rotation.x = Math.PI / 2;
    axises.add(gridHelper);

    // 创建X轴线
    var xAxisGeometry = new THREE.Geometry();
    xAxisGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    xAxisGeometry.vertices.push(new THREE.Vector3(10, 0, 0));
    var xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    var xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
    axises.add(xAxis);
    //创建X轴箭头
    var coneXMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var coneXMesh = new THREE.Mesh(coneGeometry, coneXMaterial);
    coneXMesh.position.set(10, 0, 0);
    coneXMesh.rotation.set(0, 0, -Math.PI / 2);
    axises.add(coneXMesh);

    // 创建Y轴线
    var yAxisGeometry = new THREE.Geometry();
    yAxisGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    yAxisGeometry.vertices.push(new THREE.Vector3(0, 10, 0));
    var yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    var yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
    axises.add(yAxis);
    //创建Y轴箭头
    var coneYMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    var coneYMesh = new THREE.Mesh(coneGeometry, coneYMaterial);
    coneYMesh.position.set(0, 10, 0);
    axises.add(coneYMesh);

    // 创建Z轴线
    var zAxisGeometry = new THREE.Geometry();
    zAxisGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    zAxisGeometry.vertices.push(new THREE.Vector3(0, 0, 10));
    var zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    var zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
    axises.add(zAxis);
    //创建Z轴箭头
    var coneZMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    var coneZMesh = new THREE.Mesh(coneGeometry, coneZMaterial);
    coneZMesh.position.set(0, 0, 10);
    coneZMesh.rotation.set(Math.PI / 2, 0, 0);
    axises.add(coneZMesh);

    scene.add(axises);
//创建实例矩形
var loader = new THREE.TextureLoader();
loader.setCrossOrigin('anonymous');
var textures = [
  loader.load('alipay.jpg'),
  loader.load('paypal.jpg'),
  loader.load('wechat.png')
];
// var texture = loader.load('alipay.jpg', function(texture) {
//     console.log('Texture loaded');
//   }, undefined, function(error) {
//     console.log('Error loading texture:', error);
//   });
//if(textures[0]) { console.log('Texture loaded'); }else{console.log('Texture not loaded');}
var materials = [
    new THREE.MeshBasicMaterial({map: textures[0]}),
    new THREE.MeshBasicMaterial({map: textures[1]}),
    new THREE.MeshBasicMaterial({map: textures[2]}),
    new THREE.MeshBasicMaterial({map: textures[0]}),
    new THREE.MeshBasicMaterial({map: textures[1]}),
    new THREE.MeshBasicMaterial({map: textures[2]})
  ];
  
  var sampleGeometry = new THREE.BoxGeometry(198, 198, 198);
   sampleCube = new THREE.Mesh(sampleGeometry, materials);
  scene.add(sampleCube);

    // 视角控制器
    //创建一个用于显示小立方体的HTML元素，并将其添加到页面的适当位置。为了在右上角显示，并设置合适的top和right样式属性。
    cubeContainer = document.createElement('div');
    cubeContainer.id = 'cube-container';
    cubeContainer.style.position = 'absolute';
    cubeContainer.style.right = '10px'
    cubeContainer.style.width = '150px';
    cubeContainer.style.height = '150px';
    //cubeContainer.style.border = '1px solid white';
    document.body.appendChild(cubeContainer);

    cubeRenderer = new THREE.WebGLRenderer({ alpha: true });
    cubeRenderer.setSize(150, 150);
    cubeContainer.appendChild(cubeRenderer.domElement);

    //创建一个THREE.Scene用于放置小立方体，并创建一个THREE.PerspectiveCamera用于观察这个场景。
    cubeScene = new THREE.Scene();
    //cubeScene.background = new THREE.Color(0x888888);
    cubeCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    cubeCamera.position.set(0, -15, 15);
    cubeCamera.lookAt(0, 0, 0);
    cubeCamera.up = new THREE.Vector3(0, 0, 1);



    cubeAxises = new THREE.Group();
    cubeAxises.name = "cubeAxises";
    //创建一个THREE.CubeGeometry用于创建小立方体的各个面，并将其添加到场景中。
    var faceNames = ["front", "back", "left", "right", "top", "bottom"];
    var faceColors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff];
    var cubeMaterials = [];
    for (var i = 0; i < faceNames.length; i++) {
        var material = new THREE.MeshBasicMaterial({ color: faceColors[i], transparent: true, opacity: 0.5 });
        var textTexture = createTextTexture(faceNames[i]);
        material.map = textTexture;
        cubeMaterials.push(material);
    }

    //创建一个THREE.WebGLRenderer用于渲染小立方体，并将其添加到页面的适当位置。
    var cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
    cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials);

    var cubeambientLight = new THREE.AmbientLight(0xffffff);
    var cubepointLight = new THREE.PointLight(0xffffff);
    cubepointLight.position.set(50, 50, 50);

    cubeScene.add(cubeambientLight);
    cubeScene.add(cubepointLight);
    cubeAxises.add(cubeMesh);

    //在cubeSene显示坐标系
    // 创建X轴线
    var cubeXAxisGeometry = new THREE.Geometry();
    cubeXAxisGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    cubeXAxisGeometry.vertices.push(new THREE.Vector3(25, 0, 0));
    var cubeXAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    var cubeXAxis = new THREE.Line(cubeXAxisGeometry, cubeXAxisMaterial);
    cubeAxises.add(cubeXAxis);
    // 创建Y轴线
    var cubeYAxisGeometry = new THREE.Geometry();
    cubeYAxisGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    cubeYAxisGeometry.vertices.push(new THREE.Vector3(0, 25, 0));
    var cubeYAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    var cubeYAxis = new THREE.Line(cubeYAxisGeometry, cubeYAxisMaterial);
    cubeAxises.add(cubeYAxis);
    // 创建Z轴线
    var cubeZAxisGeometry = new THREE.Geometry();
    cubeZAxisGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    cubeZAxisGeometry.vertices.push(new THREE.Vector3(0, 0, 25));
    var cubeZAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    var cubeZAxis = new THREE.Line(cubeZAxisGeometry, cubeZAxisMaterial);
    cubeAxises.add(cubeZAxis);
    cubeScene.add(cubeAxises);

    initStats();
    initControl();
    initSettops();
}
var oldlandscape = landscape;
function initSettops() {
    var aspect = document.documentElement.clientWidth /document.documentElement.clientHeight;
    renderer.setSize(document.documentElement.clientWidth,document.documentElement.clientHeight);
    console.log('width:' + document.documentElement.clientWidth + ' height:' +document.documentElement.clientHeight);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    var perc = 0;
    oldlandscape = landscape;
    if (document.documentElement.clientWidth >document.documentElement.clientHeight) {
        // 横屏
        landscape = true;
        console.log('横屏');
    } else {
        // 竖屏
        landscape = false;
        console.log('竖屏');
    }
    cordinatesDiv.style = landscape? " bottom: 0; top:auto; ":" bottom: auto; top:0; ";

    if (oldlandscape != landscape) {


         //计算分割线百分比位置
         if (dividerPos == undefined) {
            dividerPos = '0%';
        } else if (dividerPos.substring(dividerPos.length - 1) == '%') {
            perc = parseFloat(dividerPos);
        }
        else if (dividerPos.substring(dividerPos.length - 2) == 'px') {
            perc = (parseFloat(dividerPos.substring(0, dividerPos.length - 2)) /document.documentElement.clientHeight * 100);
        }
        if (landscape) {
            //进入横屏
            //判断是否隐藏coderViewer
            if (dividerPos == '0px') {
                //已显示
                //计算原来分割线百分比位置divider.style.bottom / document.documentElement.clientHeight 
                divider.style.left = Math.round(parseFloat(divider.style.bottom.substring(0, divider.style.bottom.length - 2)) /document.documentElement.clientHeight * document.documentElement.clientWidth * 100) + "px";
                //dividerPos 不用更新
            } else if (dividerPos == '0%') {
                //已显示
                //计算原来分割线百分比位置divider.style.left /  document.documentElement.clientWidth
                if (divider.style.bottom.substring(divider.style.bottom.length - 1) == '%') {
                    divider.style.left = Math.round(parseFloat(divider.style.bottom) * document.documentElement.clientWidth / 100) + "px";
                } else {
                    divider.style.left = Math.round(parseFloat(divider.style.bottom) / document.documentElement.clientWidth * 100) + "%";
                }
                //dividerPos 不用更新
            } else {
                //已隐藏
                divider.style.left = '0%';
                //转换分割线位置记录dividerPos
                dividerPos = perc + '%';
            }
            //更新分割线位置
            divider.style.top = menu.getBoundingClientRect().bottom + 'px';
            divider.style.height = '95%';
            divider.style.width = '0.5%';
            divider.style.cursor = 'col-resize';
            //更新codeViewer位置
            codeViewer.style.top = divider.style.top;
            codeViewer.style.left = 0;
            codeViewer.style.height = divider.style.height;
            codeViewer.style.width = divider.style.left;
            //更新3dViewer位置
            v.style.top = menu.getBoundingClientRect().bottom + 'px';
           // v.style.left = '0%';
            v.style.height = divider.style.height;
          //  v.style.width = '100%';//(document.documentElement.clientWidth - dividerPos) + 'px';
        } else {
            //进入竖屏
            //判断是否隐藏coderViewer
            if (dividerPos == '0px') {
                //已显示
                //计算原来分割线百分比位置divider.style.left /  document.documentElement.clientWidth
                divider.style.bottom = Math.round(((parseFloat(divider.style.left) / document.documentElement.clientWidth)) *document.documentElement.clientHeight * 100) + "px";
                //dividerPos 不用更新
            } else if (dividerPos == '0%') {
                //已显示
                //计算原来分割线百分比位置divider.style.bottom / document.documentElement.clientHeight 
                if(divider.style.left.substring(divider.style.left.length - 1) == '%'){
                divider.style.bottom = Math.round((parseFloat(divider.style.left) / 100) * document.documentElement.clientWidth) + "px";
                }else{
                    divider.style.bottom = Math.round((parseFloat(divider.style.left) /document.documentElement.clientHeight) * 100) + "%";
                }
                //dividerPos 不用更新
            } else {
                //已隐藏
                divider.style.bottom = '0%';
                //转换分割线位置记录dividerPos
                dividerPos = perc + '%';
            }
            //更新分割线位置
            divider.style.width = '100%';
            divider.style.height = '0.5%';
            divider.style.left = '0%';
            divider.style.top = 'auto';
            divider.style.cursor = 'row-resize';
            //更新codeViewer位置
            codeViewer.style.top = 'auto';
            codeViewer.style.bottom = '0%';
            codeViewer.style.left = '0%';
            codeViewer.style.height = divider.style.bottom;
            codeViewer.style.width = divider.style.width;
            //更新3dViewer位置
            v.style.top = menu.getBoundingClientRect().bottom + 'px';
           // v.style.left = '0%';
            v.style.height = divider.style.bottom;
           // v.style.width = "100%";// divider.style.width;
        }

    }

    statsContainer.style.top = v.style.top;
    cubeContainer.style.top = v.style.top;
}

//创建一个名为createTextTexture()的函数，用于创建包含文本的纹理。
function createTextTexture(text) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '24px Arial';
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
}

//初始化性能插件
function initStats() {
    stats = new Stats();
    statsContainer = document.createElement('div');
    statsContainer.id = 'stats-container';
    statsContainer.name = 'stats-container';
    statsContainer.style.position = 'absolute';
    statsContainer.style.right = '0px';
    document.body.appendChild(statsContainer);
    statsContainer.appendChild(stats.dom);
    stats.domElement.style.position = 'relative';
    stats.domElement.style.top = menu.getBoundingClientRect().height + 'px';    // 通过设置top属性，让性能插件显示在菜单下面的位置
    statsContainer.style.top = stats.domElement.style.top;
    
}
//初始化控制插件
function initControl() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();
    cubeControls = new THREE.OrbitControls(cubeCamera, cubeRenderer.domElement);
    cubeControls.enableZoom = false;
    cubeControls.enablePan = false;
    cubeControls.update();
};

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function readUInt32LE(binaryStr, offset) {
    return (binaryStr.charCodeAt(offset) |
        (binaryStr.charCodeAt(offset + 1) << 8) |
        (binaryStr.charCodeAt(offset + 2) << 16) |
        (binaryStr.charCodeAt(offset + 3) << 24)) >>> 0;
}

function loadModle(contents, type) {
    var geometry;
    if (type == "GCODE") {
        gCode = parseGcode(contents, 0, 0, 0, 0, 0, "G0");
        // var g0Material = new THREE.LineBasicMaterial({ color: 0x888888, opacity: 0.75, transparent: true });
        // var g1Material = new THREE.LineBasicMaterial({ color: 0x64ff64, opacity: 0.5, transparent: true });
        // gCode.children[0].material = g0Material;
        // gCode.children[1].material = g1Material;
        //add points
        //var pMaterial = new THREE.PointsMaterial({ color: 0x000099, size: 1 });
        var pMaterial = new THREE.PointsMaterial({
            color: 0x000099,
            size: 5,
            sizeAttenuation: false, // 禁用点的大小自动衰减
            alphaTest: 0.5, // 设置透明度阈值，控制圆形的边缘
            opacity: 0.75, // 设置透明度
            transparent: true // 开启透明度
        });
        var g0MergedGeometry = new THREE.Geometry();
        var g1MergedGeometry = new THREE.Geometry();
        // 将geometry1和geometry2合并到mergedGeometry中
        gCode.traverse(function (child) {
            if (child.name.includes("g0")) {
                g0MergedGeometry.merge(child.geometry);
            } else if (child.name.includes("g1")) {
                g1MergedGeometry.merge(child.geometry);
            }
        });
        var point0 = new THREE.Points(g0MergedGeometry, pMaterial);
        point0.name = "g0points";
        var point1 = new THREE.Points(g1MergedGeometry, pMaterial);
        point1.name = "g1points";
        gCode.add(point0);
        gCode.add(point1);
        var boundingBox = new THREE.Box3().setFromObject(gCode);
        //var material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
        //var material = new THREE.MeshPhongMaterial({ color: 0x64ff00, opacity: 0.15, transparent: true ,side: THREE.DoubleSide });
        //var box = new THREE.Mesh(new THREE.BoxGeometry(boundingBox.max.x - boundingBox.min.x, boundingBox.max.y - boundingBox.min.y, boundingBox.max.z - boundingBox.min.z), material);
        var material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
        var box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(boundingBox.max.x - boundingBox.min.x, boundingBox.max.y - boundingBox.min.y, boundingBox.max.z - boundingBox.min.z)), material);
        box.position.set((boundingBox.max.x + boundingBox.min.x) / 2, (boundingBox.max.y + boundingBox.min.y) / 2, (boundingBox.max.z + boundingBox.min.z) / 2);
        gCode.add(box);
        //add bounding box end
        //gCode.position.set(-80.5, -95.5, 0);
        scene.add(gCode);
        //添加一个透明的gCode
        tGcode = gCode.clone();
        var originalOpacity = new Map();
        tGcode.traverse(function (child) {
            if (child.material) {
                child.material = child.material.clone();
                // 存储原始的透明度值
                if (!originalOpacity.has(child.material.uuid)) {
                    originalOpacity.set(child.material.uuid, child.material.opacity);
                    child.material.opacity = 0.02;
                    //child.material.transparent = true;
                }
            }
        });
        tGcode.name = "tGcode";
        tGcode.visible = false;
        scene.add(tGcode);
    }
    else if (type == "STL") {
        geometry = parseSTL(contents);
        sTl = new THREE.Group();
        sTl.name = "STL";
        if (contents.substr(0, 5) !== 'solid') {
            isASCII = false;
        } else {
            var numTriangles = readUInt32LE(contents, 80);
            isASCII = contents.length !== 84 + numTriangles * 50
        }
        var material = new THREE.MeshPhongMaterial({ color: 0x64ff00, opacity: 0.75, transparent: true });
        var mesh = new THREE.Mesh(geometry, material);
        sTl.add(mesh);
        // 创建白色框架线材质
        var wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff64, wireframe: true });
        // 创建框架线模型
        var wireframe = new THREE.Mesh(geometry, wireframeMaterial);
        // 将框架线模型添加到场景中
        sTl.add(wireframe);
        scene.add(sTl);
    }
    else { return; }

    autoMagnify();
    return geometry;
}
function loadCode(contents, type, geometry) {
    if (type == "GCODE" || isASCII) {
        txar.setValue(contents);
        txar.refresh();
    } else if (type == "STL") {
        // 将几何体转换为ASCII STL格式
        if (geometry != undefined) {
            txar.setValue(geometryToStlAscii(geometry));
            txar.refresh();
        }
    }
}
function geometryToStlAscii(geometry) {
    var vertices, normals, stl = 'solid model\n';
    if (geometry instanceof THREE.Geometry) {
        vertices = geometry.vertices;
        normals = geometry.faces.map(face => face.normal);

        for (var i = 0; i < normals.length; i++) {
            stl += `facet normal ${normals[i].x} ${normals[i].y} ${normals[i].z}\n`;
            stl += 'outer loop\n';
            stl += `vertex ${vertices[i].x} ${vertices[i].y} ${vertices[i].z}\n`;
            stl += 'endloop\n';
            stl += 'endfacet\n';
        }
    }
    else if (geometry instanceof THREE.BufferGeometry) {
        vertices = geometry.attributes.position.array;
        normals = geometry.attributes.normal.array;

        for (var i = 0; i < vertices.length; i += 9) {
            stl += `facet normal ${normals[i]} ${normals[i + 1]} ${normals[i + 2]}\n`;
            stl += 'outer loop\n';
            for (var j = 0; j < 9; j += 3) {
                stl += `vertex ${vertices[i + j]} ${vertices[i + j + 1]} ${vertices[i + j + 2]}\n`;
            }
            stl += 'endloop\n';
            stl += 'endfacet\n';
        }
    }

    stl += 'endsolid model';
    return stl;
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    controls.update(); // 更新相机状态
    stats.update();//更新性能插件
    //右上角控制器
    cubeRenderer.render(cubeScene, cubeCamera);
    cubeControls.update();
}

function parseSTL(contents) {
    var geometry = new THREE.STLLoader().parse(contents);
    return geometry;
}

function parseGcode(contents, x, y, z, a, lineNumber, pre) {
    var lines = contents.split('\n');

    var geometries = new THREE.Group();
    geometries.name = "GCODE";
    //var x = 0, y = 0, z = 0, a = 0; // 增加a变量来保存A轴的值
    //var oldx = 0, oldy = 0, oldz = 0, olda = 0; // 增加a变量来保存A轴的值
    var oldx = x, oldy = y, oldz = z, olda = a, oldLineNum = lineNumber; // 增加a变量来保存A轴的值
    var oldCode = pre;
    var g0Geometry = new THREE.Geometry(); // g0路径的几何体
    var g1Geometry = new THREE.Geometry(); // g1路径的几何体
    var g0Material = new THREE.LineBasicMaterial({ color: 0x888888, opacity: 0.75, transparent: true });
    var g1Material = new THREE.LineBasicMaterial({ color: 0x64ff64, opacity: 0.5, transparent: true });
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line.startsWith('G')) {
            var parts = line.split(' ');
            for (var j = 0; j < parts.length; j++) {
                var part = parts[j];
                var t = parseFloat(part.substring(1));
                if (isNaN(t)) { continue; }
                if (part.startsWith('X') || part.startsWith('x')) {
                    x = t;
                } else if (part.startsWith('Y') || part.startsWith('y')) {
                    y = t;
                } else if (part.startsWith('Z') || part.startsWith('z')) {
                    z = t;
                } else if (part.startsWith('A') || part.startsWith('a')) { // 处理A轴的值
                    a = t;
                    // if(a = NaN){console.log(line);}
                }
            }
            //if(i == 100){console.log(line);}
            var pt = new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);// 在顶点上应用旋转
            if (line.startsWith('G0')) {
                if (oldCode === "G1") {
                    if (g1Geometry.vertices.length > 0) {
                        g1Geometry.vertices.pop();
                    }
                    var tpt = new THREE.Vector3(oldx, oldy, oldz).applyAxisAngle(new THREE.Vector3(0, 1, 0), olda);
                    tpt.name = "1G" + oldLineNum;
                    g0Geometry.vertices.push(tpt); // 在顶点上应用旋转
                }
                pt.name = "0G" + (i + lineNumber);
                g0Geometry.vertices.push(pt); //前一段线的终点
                g0Geometry.vertices.push(pt); //后一段线的起点
                oldCode = "G0";
            } else if (line.startsWith('G1')) {
                if (oldCode === "G0") {
                    if (g0Geometry.vertices.length > 0) {
                        g0Geometry.vertices.pop();
                    }
                    var tpt = new THREE.Vector3(oldx, oldy, oldz).applyAxisAngle(new THREE.Vector3(0, 1, 0), olda);
                    tpt.name = "0G" + oldLineNum;
                    g1Geometry.vertices.push(tpt); // 在顶点上应用旋转
                }
                pt.name = "1G" + (i + lineNumber);
                g1Geometry.vertices.push(pt); //前一段线的终点
                g1Geometry.vertices.push(pt); //后一段线的起点
                oldCode = "G1";
            }
            oldx = x;
            oldy = y;
            oldz = z;
            olda = a;
            oldLineNum = i + lineNumber;
        }
    }
    //头对齐
    // while (g0Geometry.vertices[1] !== g0Geometry.vertices[2]) { g0Geometry.vertices.shift(); }
    while (g1Geometry.vertices[1] !== g1Geometry.vertices[2]) { g1Geometry.vertices.shift(); }
    //尾对齐
    if (g0Geometry.vertices[g0Geometry.vertices.length - 1] === g0Geometry.vertices[g0Geometry.vertices.length - 2]) {
        g0Geometry.vertices.pop();
    }
    if (g1Geometry.vertices[g1Geometry.vertices.length - 1] === g1Geometry.vertices[g1Geometry.vertices.length - 2]) {
        g1Geometry.vertices.pop();
    }
    // 创建线条模型
    if (g0Geometry.vertices.length > 0) {
        var line0 = new THREE.LineSegments(g0Geometry, g0Material, THREE.LineStrip);
        line0.name = "g0lines";
        geometries.add(line0);
    }
    if (g1Geometry.vertices.length > 0) {
        var line1 = new THREE.LineSegments(g1Geometry, g1Material, THREE.LineStrip);
        line1.name = "g1lines";
        geometries.add(line1);
    }
    return geometries;
}

function resetView() {
    //controls.reset();
    camera.position.set(0, -200, 200);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1; // 重置摄像机缩放
    var aspect = document.documentElement.clientWidth /document.documentElement.clientHeight;
    //renderer.setSize(document.documentElement.clientWidth,document.documentElement.clientHeight);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    initControl();
}

function autoMagnify() {

    // 计算模型的包围盒
    var boundingBox = new THREE.Box3().setFromObject(gCode || sTl);

    // 计算包围盒的中心点
    var center = new THREE.Vector3();
    boundingBox.getCenter(center);

    // 计算包围盒的最大边长
    var size = new THREE.Vector3();
    boundingBox.getSize(size);
    var maxDim = Math.max(size.x, size.y, size.z);

    // 调整摄像机位置和缩放
    camera.position.copy(center);
    camera.position.z += maxDim * 2; // 调整摄像机距离模型的距离
    CamZ = camera.position.z;
    CamY = camera.position.y;
    CamX = camera.position.x;

    var angle = Math.PI / 4; // 45度的弧度值
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    camera.lookAt(center);
    camera.zoom = 1; // 重置摄像机缩放
    camera.updateProjectionMatrix();

    // 调整渲染器大小
    var aspect = document.documentElement.clientWidth /document.documentElement.clientHeight;
    //renderer.setSize(document.documentElement.clientWidth,document.documentElement.clientHeight);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    cubeCamera.position.copy(calculatePoint3(camera.position, cubeCamera.position));
    cubeCamera.lookAt(0, 0, 0);
}

function calculatePoint3(movePoint, followPoint) {
    var distance = followPoint.distanceTo(new THREE.Vector3(0, 0, 0));
    var direction = new THREE.Vector3().subVectors(movePoint, new THREE.Vector3(0, 0, 0)).normalize();
    return newPoint1 = direction.clone().multiplyScalar(distance);
}




