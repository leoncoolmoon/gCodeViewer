
var cubeRenderer, cubeScene, cubeMesh, cubeCamera, cubeControls, cubeContainer, cubeCamZ, cubeCamY, cubeCamX;
var renderer, scene, camera, controls, stats, CamZ, CamY, CamX;
var isDragging = false;
var axises, cubeAxises, gCode, sTl;
var plainTextFile = "tap,gcode,nc,mpt,mpf";
var STL = "stl";
var mark;
var divider, dividerPos;
var type = "UNKNOWN";
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

//cursor3D.add(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })));
cursor3D.visible = false;
init();
render();
initStats();

var txar = CodeMirror.fromTextArea(document.getElementById('txar'), {
    lineNumbers: true,
    mode: "gcode"
});
//获取当前三维坐标
function getCordinats(line) {
    var x, y, z, e, a = 0;
    var currentLine = line;
    while ((x === undefined || y === undefined || z === undefined) && currentLine >= 0) {
        var lineContent = txar.getLine(currentLine--);
        if (lineContent === undefined) break;
        if (!lineContent.includes(" ")) continue;
        var parts = lineContent.split(' ');
        for (var j = 0; j < parts.length; j++) {
            var part = parts[j];
            var t = parseFloat(part.substring(1));
            if (isNaN(t)) { continue; }
            if (part.startsWith('X')) {
                x = x === undefined ? t : x;
            } else if (part.startsWith('Y')) {
                y = y === undefined ? t : y;
            } else if (part.startsWith('Z')) {
                z = z === undefined ? t : z;
            } else if (part.startsWith('E')) {
                e = e === undefined ? t : z;
            } else if (part.startsWith('A')) { // 处理A轴的值
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
    return { x: x, y: y, z: z, e: e, a: a };
}
var isolateMode = false;
txar.on("cursorActivity", function () {
    var cursor = txar.getCursor();
    var lineNumber = cursor.line;// + 1; // 行号从0开始，所以需要加1
    markLine(lineNumber, false);
    // 将球体添加到场景中
});



var timer;
txar.on("keyup", function (txar, event) {
    if (event.key === "Shift") {
        // set a timmer delay here if in 1000ms shift key is not pressed then enter the isolation mode       
        filterCmd();
      console.log("Shift key was released");
    }
  });
  function filterCmd(){
    if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(function() {
        fxisolationMode();
        console.log("执行指令");
      }, 1000);

  }
function fxisolationMode() {
    var selection = txar.getSelection();
    if (selection.length == 0) {
        return;
    }
    var lines = selection.split('\n');
    if (lines.length > 1 && type === "GCODE") {
        isolateMode = true;
        gCodeClear();
        cursor3D.visible = false;
        var startLine = txar.getCursor("from").line;
        var endLine = txar.getCursor("to").line;
        var cord = getCordinats(startLine);
        var lineContent = "";
        for (var i = startLine; i <= endLine; i++) {
            lineContent = lineContent + '\n'+ txar.getLine(i);
        }
            gCode = parseGcode(lineContent, cord.x, cord.y, cord.z, cord.e, cord.a);
            var g0Material = new THREE.LineBasicMaterial({ color: 0x888888, opacity: 0.75, transparent: true });
            var g1Material = new THREE.LineBasicMaterial({ color: 0x64ff64, opacity: 0.5, transparent: true });
           try{ gCode.children[0].material = g0Material;}catch(e){}
            try{gCode.children[1].material = g1Material;}catch(e){}
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
           try{ var point0 = new THREE.Points(gCode.children[0].geometry, pMaterial);
            point0.name = "g0points";
            gCode.add(point0);}catch(e){};

           try{ var point1 = new THREE.Points(gCode.children[1].geometry, pMaterial);
            point1.name = "g1points";
            gCode.add(point1);}catch(e){};

            scene.add(gCode);
        
    } else {
        if(isolateMode){
            gCodeClear();
            loadModle(txar.getValue(), type);
            isolateMode = false;
        }
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
    var locArray = getCordinats(lineNumber);
    var center = new THREE.Vector3(locArray.x, locArray.y, locArray.z);//.applyAxisAngle(new THREE.Vector3(0, 1, 0), locArray.a);
    if (center === undefined) {
        return;
    }
    if (mark !== undefined) {
        mark.clear();
    }
    var start = txar.posFromIndex(txar.indexFromPos({ line: lineNumber - 1, ch: 0 })); // 行的起始位置
    var end = txar.posFromIndex(txar.indexFromPos({ line: lineNumber, ch: 0 })); // 行的结束位置
    mark = txar.markText(start, end, { className: "highlighted-line" });
    cursor3D.visible = true;
    cursor3D.position.set(center.x, center.y, center.z);
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
//add screensize change listener
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    // 调整渲染器大小
    var aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    cubeCamera.aspect = 1;
    cubeCamera.updateProjectionMatrix();
    cubeRenderer.setSize(150, 150);
    cubeRenderer.render(cubeScene, cubeCamera);
    cubeControls.update();
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

function read_file(file) {
    //read file content
    if (file === undefined) {
        return;
    }
    if (file.size > 1024 * 1024 * 100) {
        alert("file size is too big");
        return;
    }
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
    var blob = new Blob([txar.getValue()], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "gcode.txt");
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
    var state = document.getElementById('state');
    if (state.innerHTML == "stateShow") {
        state.innerHTML = "stateHide";
        stats.dom.parentNode.style.display = "none";
        document.getElementById('stats-container').style.display = "none";
    } else {
        state.innerHTML = "stateShow";
        stats.dom.parentNode.style.display = "block";
        document.getElementById('stats-container').style.display = "block";
    }


}
function bt_codeviewer() {
    var codeviewer = document.getElementById('codeViewer');

    if (divider.style.left === "0%" || divider.style.left === "0px") {
        divider.style.left = dividerPos;
        codeviewer.style.width = dividerPos;
    } else {
        dividerPos = divider.style.left;
        divider.style.left = "0%";
        codeviewer.style.width = "0%";
    }

}
function bt_fullscreen() {
    var fullscreen = document.getElementById('fullscreen');
    if (fullscreen.innerHTML == "fullscreen") {
        fullscreen.innerHTML = "exit fullscreen";
        var element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();

        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();

        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();

        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();

        }
    } else {
        fullscreen.innerHTML = "fullscreen";
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
            cylinderGeometry.setPosition(element.x, element.y, element.z);
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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -200, 200);
    camera.up = new THREE.Vector3(0, 0, 1);

    renderer = new THREE.WebGLRenderer();//{ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    var codeViewer = document.getElementById('codeViewer');
    codeViewer.style.position = 'absolute';
    codeViewer.style.top = '5vh';
    codeViewer.style.left = '0px';
    codeViewer.style.width = '20%';
    codeViewer.style.height = '100%';
    //codeViewer.style.border = '1px solid white';
    codeViewer.style.zIndex = '99';

    divider = document.getElementById('divider');
    divider.style.zIndex = '100';
    divider.style.position = 'absolute';
    divider.style.top = '5vh';
    divider.style.left = codeViewer.style.width;
    divider.style.height = '95vh';
    divider.style.width = '0.5vw';
    //background-color: rgba(128,128,128,0.5);
    divider.style.background = 'rgba(128,128,128,0.5)';
    var v = document.getElementById('3dViewer');
    v.style.position = 'absolute';
    v.style.top = '5vh';
    v.style.left = '0px';

    document.addEventListener('mousedown', function (e) {
        isDragging = e.target.id === 'divider';
        divider.style.background = 'rgba(64,128,200,0.5)';
    });
    document.addEventListener('mousemove', function (e) {
        if (e.target.id === 'divider') {
            divider.style.background = 'rgba(64,128,200,0.5)';
        } else {
            if (!isDragging) {
                divider.style.background = 'rgba(128,128,128,0.5)';
            }
        }
        if (!isDragging) return;
        document.getElementById('divider').style.left = e.x + 'px';
        //console.log("left = " + e.x);
        document.getElementById('codeViewer').style.width = e.x + 'px';
        //检查鼠标是否移出了目标元素
        var rect = e.target.getBoundingClientRect();
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            //console.log('Mouse moved out of target');
            isDragging = false;
            supressMain = false;
            supressCube = false;
            divider.style.background = 'rgba(128,128,128,0.5)';

        }
    });

    document.addEventListener('mouseup', function (e) {
        isDragging = false;
        supressMain = false;
        supressCube = false;
        divider.style.background = 'rgba(128,128,128,0.5)';
        //txar.on("mouseup",fxisolationMode);
        if(e.target.className.includes("CodeMirror")){
            fxisolationMode();
        }
    });



    document.body.appendChild(renderer.domElement);
    // 添加环境光和点光
    var ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(500, 500, 500);
    scene.add(pointLight);


    // 监听拖放事件
    window.addEventListener('dragover', function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    window.addEventListener('drop', function (event) {
        event.preventDefault();
        read_file(event.dataTransfer.files[0]);
    });


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


    // 视角控制器
    //创建一个用于显示小立方体的HTML元素，并将其添加到页面的适当位置。为了在右上角显示，并设置合适的top和right样式属性。
    cubeContainer = document.createElement('div');
    cubeContainer.id = 'cube-container';
    cubeContainer.style.position = 'absolute';
    cubeContainer.style.top = '10px';
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
    initMenu();
    initStats();
    initControl();
}
function initMenu() {
    var menu = document.getElementById('menu');
    menu.style.position = 'absolute';
    menu.style.top = '0px';
    menu.style.left = '0px';
    menu.style.width = '100%';
    menu.style.background = 'rgba(0,0,0,1)';
    menu.style.border = '1px solid white';
    menu.style.zIndex = '100';
    menu.style.color = 'white';

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
    var statsContainer = document.createElement('div');
    statsContainer.id = 'stats-container';
    statsContainer.name = 'stats-container';
    statsContainer.style.position = 'absolute';
    statsContainer.style.top = '5vh';
    statsContainer.style.right = '0px';
    document.body.appendChild(statsContainer);
    statsContainer.appendChild(stats.dom);
    stats.domElement.style.position = 'relative';

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

var isASCII = false;
function loadModle(contents, type) {
    var geometry;
    if (type == "GCODE") {
        gCode = parseGcode(contents, 0, 0, 0, 0);
        var g0Material = new THREE.LineBasicMaterial({ color: 0x888888, opacity: 0.75, transparent: true });
        var g1Material = new THREE.LineBasicMaterial({ color: 0x64ff64, opacity: 0.5, transparent: true });
        gCode.children[0].material = g0Material;
        gCode.children[1].material = g1Material;
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
        var point0 = new THREE.Points(gCode.children[0].geometry, pMaterial);
        point0.name = "g0points";
        var point1 = new THREE.Points(gCode.children[1].geometry, pMaterial);
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
    } else if (type == "STL") {
        // 将几何体转换为ASCII STL格式
        if (geometry != undefined) {
            txar.setValue(geometryToStlAscii(geometry));
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

var isDragging = false;

function parseSTL(contents) {
    var geometry = new THREE.STLLoader().parse(contents);
    return geometry;
}

function parseGcode(contents, x, y, z, a) {
    var lines = contents.split('\n');

    var geometries = new THREE.Group();
    geometries.name = "GCODE";
    //var x = 0, y = 0, z = 0, a = 0; // 增加a变量来保存A轴的值
    var oldx = 0, oldy = 0, oldz = 0, olda = 0; // 增加a变量来保存A轴的值
    var oldCode = "G0";
    var g0Geometry = new THREE.Geometry(); // g0路径的几何体
    var g1Geometry = new THREE.Geometry(); // g1路径的几何体

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line.startsWith('G')) {
            var parts = line.split(' ');
            for (var j = 0; j < parts.length; j++) {
                var part = parts[j];
                var t = parseFloat(part.substring(1));
                if (isNaN(t)) { continue; }
                if (part.startsWith('X')) {
                    x = t;
                } else if (part.startsWith('Y')) {
                    y = t;
                } else if (part.startsWith('Z')) {
                    z = t;
                } else if (part.startsWith('A')) { // 处理A轴的值
                    a = t;
                    // if(a = NaN){console.log(line);}
                }
            }
            //if(i == 100){console.log(line);}
            var pt = new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
            pt.name = "l" + i;
            if (line.startsWith('G0')) {
                if (oldCode === "G1") {
                    g0Geometry.vertices.push(new THREE.Vector3(oldx, oldy, oldz).applyAxisAngle(new THREE.Vector3(0, 1, 0), olda)); // 在顶点上应用旋转
                }
                g0Geometry.vertices.push(pt); // 在顶点上应用旋转
                oldCode = "G0";
            } else if (line.startsWith('G1')) {
                if (oldCode === "G0") {
                    g1Geometry.vertices.push(new THREE.Vector3(oldx, oldy, oldz).applyAxisAngle(new THREE.Vector3(0, 1, 0), olda)); // 在顶点上应用旋转
                }
                g1Geometry.vertices.push(pt); // 在顶点上应用旋转
                oldCode = "G1";
            }
            oldx = x;
            oldy = y;
            oldz = z;
            olda = a;

        }
    }
    if (g0Geometry.vertices.length > 0) {
        var line0 = new THREE.Line(g0Geometry);
        line0.name = "g0lines";
        geometries.add(line0);
    }
    if (g1Geometry.vertices.length > 0) {
        var line1 = new THREE.Line(g1Geometry);
        line1.name = "g1lines";
        geometries.add(line1);
    }
    return geometries;
}

cubeRenderer.domElement.addEventListener('dblclick', function (event) {
    resetView();
});

function resetView() {
    //controls.reset();
    camera.position.set(0, -200, 200);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1; // 重置摄像机缩放
    var aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    initControl();
}
renderer.domElement.addEventListener('dblclick', function (event) {
    autoMagnify();
});
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
    var aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    cubeCamera.position.copy(calculatePoint3(camera.position, cubeCamera.position));
    cubeCamera.lookAt(0, 0, 0);
}

var supressMain = false;
var supressCube = false;
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
function calculatePoint3(movePoint, followPoint) {
    var distance = followPoint.distanceTo(new THREE.Vector3(0, 0, 0));
    var direction = new THREE.Vector3().subVectors(movePoint, new THREE.Vector3(0, 0, 0)).normalize();
    return newPoint1 = direction.clone().multiplyScalar(distance);
}


// 定义一个射线投射器
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

// 监听鼠标移动事件
window.addEventListener('mousemove', onMouseMove, false);
// 监听鼠标点击事件
window.addEventListener('click', onClick, false);

function onMouseMove(event) {
    // 计算鼠标在屏幕上的位置
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    //console.log("x=" + mouse.x + " y=" + mouse.y);
}


var oldLineNum = 0;
function onClick(event) {
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
            if (intersect.object.type == "Points") {
                var delta = 0.1;
                var x = intersect.point.x;
                var y = intersect.point.y;
                var z = intersect.point.z;
                var uuid = intersect.object.uuid;
                if (mark !== undefined) {
                    mark.clear();
                }
                for (var j = 0; j < gCode.children.length; j++) {
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
                                    var lineNumber = parseInt(vertex.name.substring(1));
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
        }
    }
}
