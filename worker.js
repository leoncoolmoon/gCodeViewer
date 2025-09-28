function findLastPremeter(lines, startLine) {
    let lastE = null, lastZ = null, lastX = null, lastY = null, lastL = null, nozzleTemp = null, bedTemp = null;

    // 从起始行向前倒着查找（保持您原来的逻辑）
    for (let i = startLine - 1; i >= 0; i--) {
        // 如果所有值都找到就退出
        if (lastE !== null && lastZ !== null && lastX !== null && lastY !== null && lastL !== null && nozzleTemp !== null && bedTemp !== null) {
            break;
        }

        const line = lines[i].trim();

        if (!line) continue;
        //找层数
        if (line.startsWith(';LAYER:') && lastL === null) {
            lastL = line.replace(';LAYER:', "");
            continue;
        }
        if (line.startsWith(';')) continue;
        // 只处理运动指令
        if (line.startsWith('G0') || line.startsWith('G1')) {
            if (line.includes('E') && lastE === null) {
                const match = line.match(/E([-]?\d+\.\d+)/);
                if (match) lastE = match[1];
            }

            if (line.includes('Z') && lastZ === null) {
                const match = line.match(/Z([-]?\d+\.\d+)/);
                if (match) lastZ = match[1];
            }

            if (line.includes('X') && lastX === null) {
                const match = line.match(/X([-]?\d+\.\d+)/);
                if (match) lastX = match[1];
            }

            if (line.includes('Y') && lastY === null) {
                const match = line.match(/Y([-]?\d+\.\d+)/);
                if (match) lastY = match[1];
            }
            continue;
        }
        //提取温度
        if ((line.startsWith('M104') || line.startsWith('M109')) && nozzleTemp === null) {
            const match = line.match(/S(\d+)/);
            if (match) nozzleTemp = match[1];
            continue;
        }
        if ((line.startsWith('M140') || line.startsWith('M190')) && bedTemp === null) {
            const match = line.match(/S(\d+)/);
            if (match) bedTemp = match[1];
            continue;
        }

    }
    return {
        e: lastE || "0.0",
        z: lastZ || "0.0",
        x: lastX || "0.0",
        y: lastY || "0.0",
        l: lastL || "0",
        nT: nozzleTemp || "0",
        bT: bedTemp || "0"
    };
}
function processGcodeInBackground(content, startLine, originalFilename) {
    try {
        // 分割文件内容
        const lines = content.split('\n');

        // 验证行号
        if (startLine < 1 || startLine > lines.length) {
            throw new Error(`行号应在 1-${lines.length} 范围内`);
        }

        // 查找最后一个有效位置
        const LastPremeter = findLastPremeter(lines, startLine);

        // 生成新的G代码
        const newGcode = generateNewGcode(
            lines,
            startLine,
            LastPremeter
        );
        // 将结果回传给主线程
        self.postMessage({
            type: 'success',
            fileName: `${`resume_${originalFilename.replace(".gcode","")}_from_line_${startLine}` || 'output'}.gcode`,
            content: newGcode
        });
    } catch (e) {
        self.postMessage({
            type: 'error',
            error: error.message
        });
    }
}

function generateNewGcode(lines, startLine, premeters) {
    let newContent = '';

    // 添加新的文件头
    newContent += `; Regenerated G code  - from line ${startLine} \n`;
    newContent += 'M117 restart heating...\n';

    if (premeters.bT !== "0") {
        newContent += `M140 S${premeters.bT} ; set\n`;
        newContent += `M190 S${premeters.bT} ; wait bed temperature\n`;
    }

    newContent += `M104 S${premeters.nT} ; set\n`;
    newContent += `M109 S${premeters.nT} ; wait nozzle temperature\n`;
    newContent += 'G92 Z0 ; reset Z\n';
    newContent += 'G1 Z10 ; unstuck Z\n';
    newContent += 'G28 X0 Y0 ; homing XY\n';
    newContent += 'G1 Z0 ; moveback Z\n';
    newContent += 'G28 Z0 ; homing Z\n';
    newContent += `G92 E0 ;zero the extruded length\n`;
    newContent += `G1 F200 E10 ;extrude 10mm of feed stock\n`;
    newContent += 'M117 ready to print...\n';
    // 移动到安全高度
    const safeZ = parseFloat(premeters.z) + 5.0;
    newContent += `G0 Z${safeZ.toFixed(3)} F3000 ; move Z to safe height\n`;
    // 移动到最后位置
    newContent += `G0 X${premeters.x} Y${premeters.y} F3000 ; move X Y to breakup point\n`;

    // 设置挤出机位置
    newContent += `G92 E${premeters.e} ; set Extruder\n`;
    newContent += `M117 resume from ${startLine} ...\n`;
    newContent += `G0 Z${premeters.z} F3000 ; move Z to breakup point\n`;
    // 添加从指定行开始的内容
    for (let i = startLine - 1; i < lines.length; i++) {
        newContent += lines[i] + '\n';
    }

    return newContent;
}


// worker.js
self.onmessage = e => {
    const { text, cursorLine, title } = e.data;
    processGcodeInBackground(text, cursorLine, title)
};
