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
// promise.all异常处理

// 版本号比较排序
// 数组中第k个最大元素
// 二叉树中的所有路径
// 二叉树中和为某一值的路径
// node中promisify实现
// fetch兼容超时重传
// 观察者模式（高频）
// String indexOf实现
// 扁平化
// 柯里化
//深度优先（DFS）
// 广度优先（BFS）
