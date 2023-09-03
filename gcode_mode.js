// CodeMirror.defineMode("gcode", function() {

//     var TOKEN_NAMES = {
//         'G': 'tag',
//         'M': 'string',
//         ';': 'meta'
//     };

//     return {
//         token: function(stream) {
//             var tw_pos = stream.string.search(/[\t ]+?$/);

//             if (!stream.sol() || tw_pos === 0) {
//                 stream.skipToEnd();
//                 return ("error " + (
//                     TOKEN_NAMES[stream.string.charAt(0)] || '')).replace(/ $/, '');
//             }

//             var token_name = TOKEN_NAMES[stream.peek()] || stream.skipToEnd();

//             if (tw_pos === -1) {
//                 stream.skipToEnd();
//             } else {
//                 stream.pos = tw_pos;
//             }

//             return token_name;
//         }
//     };
// });

// CodeMirror.defineMIME("text/x-gcode", "gcode");
CodeMirror.defineMode("gcode", function() {

    var TOKEN_NAMES = {
        'G': 'tag',
        'M': 'string',
        'X': 'coordinate-name',
        'Y': 'coordinate-name',
        'Z': 'coordinate-name',
        'A': 'coordinate-name',
        'B': 'coordinate-name',
        'C': 'coordinate-name',
        'F': 'coordinate-name',
        'E': 'coordinate-name',
        ';': 'meta'
    };

    return {
        token: function(stream) {
            // 寻找下一个空格或制表符的位置
            var tw_pos = stream.string.search(/[\t ]/);

            if (!stream.sol() || tw_pos === 0) {
                stream.skipToEnd();
                return ("error " + (
                    TOKEN_NAMES[stream.string.charAt(0)] || '')).replace(/ $/, '');
            }

            var token_name = TOKEN_NAMES[stream.peek()] || stream.skipToEnd();

            if (tw_pos === -1) {
                stream.skipToEnd(); // 没有找到空格，标记到行末尾
            } else {
                stream.pos = stream.start + tw_pos; // 标记到空格之前的位置
            }

            if (token_name === 'meta') {
                return token_name;
            } else if (token_name === 'tag' || token_name === 'string') {
                return token_name + ' ' + stream.current().trim();
            } else if (token_name === 'error') {
                return token_name;
            } else if (token_name === 'comment') {
                stream.skipToEnd();
                return token_name;
            } else if (token_name === 'coordinate-name') {
                stream.eatWhile(/[^ \t]/);
                return token_name;
            }
            
            return token_name;
        }
    };
});

CodeMirror.defineMIME("text/x-gcode", "gcode");
