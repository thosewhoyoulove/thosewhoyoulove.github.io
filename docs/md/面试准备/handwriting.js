// 用js实现一个函数，找出字符串中长度大于等于4且连续重复出现两次及以上的字符

function findRepeatedSequences(str) {
    let matches = str.match(/(\w)\1{3,}/g) || []; // 匹配长度 ≥4 的连续重复字符
    let countMap = new Map();

    matches.forEach(match => {
        countMap.set(match, (countMap.get(match) || 0) + 1);
    });
    return [...countMap.entries()].filter(([key, value]) => value >= 2).map(([key]) => key);
}

// 测试
console.log(findRepeatedSequences("aaaasssfjkjkbbbdddjkjssssjccccaaaasss"));
// 输出：["aaaa"]
