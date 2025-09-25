function findLastPositions(lines, startLine) {
    let lastE = null, lastZ = null, lastX = null, lastY = null;

    // 从起始行向前倒着查找（保持您原来的逻辑）
    for (let i = startLine - 2; i >= 0; i--) {
        const line = lines[i].trim();

        if (!line || line.startsWith(';')) continue;

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
        }

        // 如果所有值都找到就退出
        if (lastE !== null && lastZ !== null && lastX !== null && lastY !== null) {
            break;
        }
    }

    return {
        e: lastE || "0.0",
        z: lastZ || "0.0",
        x: lastX || "0.0",
        y: lastY || "0.0"
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

        // 查找头部结束位置
        const headerEndLine = findHeaderEndLine(lines);
        if (headerEndLine == 0) {
            throw new Error("no header, cut failed")
        }
        // 查找最后一个有效位置
        const lastPositions = findLastPositions(lines, startLine);

        // 提取温度设置
        const temperatures = extractTemperatures(lines);

        // 生成新的G代码
        const newGcode = generateNewGcode(
            lines,
            startLine,
            headerEndLine,
            lastPositions,
            temperatures
        );

        // 创建下载链接
        downloadFile(newGcode, originalFilename, startLine);

        showStatus(`文件切割完成！新文件从第 ${startLine} 行开始`, 'success');
        progressBar.style.display = 'none';
    } catch (e) {
        showStatus(e, 'error');

    }
}
function findHeaderEndLine(lines) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith(';LAYER_COUNT')) {
            return i;
        }
    }
    return 0;
}
function extractTemperatures(lines) {
    let nozzleTemp = "0";
    let bedTemp = "0";

    for (const line of lines) {
        if (line.startsWith('M104')) {
            const match = line.match(/S(\d+)/);
            if (match) nozzleTemp = match[1];
        }
        if (line.startsWith('M190')) {
            const match = line.match(/S(\d+)/);
            if (match) bedTemp = match[1];
        }
    }

    return { nozzleTemp, bedTemp };
}
function generateNewGcode(lines, startLine, headerEndLine, positions, temps) {
    let newContent = '';

    // 添加新的文件头
    newContent += `; Regenerated G code  - from line ${startLine} \n`;
    newContent += 'M117 start heating...\n';
    newContent += `M104 S${temps.nozzleTemp} ; set\n`;
    newContent += `M109 S${temps.nozzleTemp} ; wait nozzle temperature\n`;

    newContent += 'M117 ready to print...\n';
    newContent += 'G28 X Y ; homing XY\n';
    newContent += 'G28 Z ; homing Z\n';

    // 移动到安全高度
    const safeZ = parseFloat(positions.z) + 5.0;
    newContent += `G0 Z${safeZ.toFixed(3)} F3000 ; move Z to safe height\n`;

    // 移动到最后位置
    newContent += `G0 X${positions.x} Y${positions.y} F3000 ; move X Y to breakup point\n`;

    // 设置挤出机位置
    newContent += `G92 E${positions.e} ; set Excluder\n`;
    newContent += `M117 resume from ${startLine} ...\n\n`;

    // 添加从指定行开始的内容
    for (let i = startLine - 1; i < lines.length; i++) {
        newContent += lines[i] + '\n';
    }

    return newContent;
}
function downloadFile(content, originalFilename, startLine) {

    // 将结果回传给主线程
    self.postMessage({
        fileName: `${`${originalFilename}_resume_from_line_${startLine}.gcode` || 'output'}.gcode`,
        content: content
    });
}

// worker.js
self.onmessage = e => {
    const { text, cursorLine, title } = e.data;

    processGcodeInBackground(text, cursorLine, title)
    const processed =
        `# Title: ${title}\n# Cursor Line: ${cursorLine}\n\n${text}`;
    // =================================

};
