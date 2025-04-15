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

// 版本号比较排序
// 给你两个 版本号字符串 version1 和 version2 ，请你比较它们。版本号由被点 '.' 分开的修订号组成。修订号的值 是它 转换为整数 并忽略前导零。
// 比较版本号时，请按 从左到右的顺序 依次比较它们的修订号。如果其中一个版本字符串的修订号较少，则将缺失的修订号视为 0。
// 返回规则如下：
// 如果 version1 < version2 返回 -1，
// 如果 version1 > version2 返回 1，
// 除此之外返回 0。
/**
 * @param {string} version1
 * @param {string} version2
 * @return {number}
 */
function compareVersions(version1, version2) {
  const v1 = version1.split(".");
  const v2 = version2.split(".");
  const maxLength = Math.max(v1.length, v2.length);
  for (let i = 0; i < maxLength; i++) {
    const num1 = parseInt(v1[i] || "0");
    const num2 = parseInt(v2[i] || "0");
    if (num1 < num2) return -1;
    else if (num1 > num2) return 1;
  }
  return 0;
}
//冒泡排序（时间复杂度O(n^2)，空间复杂度O(1)）
const bubbleSort = arr => {
  const len = arr.length;
  for (let i = 0; i < len - 1; i++) {
    // 外层循环控制遍历次数,只需要遍历n-1次
    // 当 i = len - 1 时，j < len - 1 - i → j < 0，内层循环 不会执行，所以那一轮是空转的。
    for (let j = 0; j < len - 1 - i; j++) {
      // 内层循环控制比较次数
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
};
//选择排序（时间复杂度O(n^2)，空间复杂度O(1)）
const selectionSort = arr => {
  const len = arr.length;
  for (let i = 0; i < len - 1; i++) {
    let minIndex = i;
    for (let j = minIndex + 1; j < len; j++) {
      if (arr[minIndex] > arr[j]) {
        minIndex = j;
      }
    }
    // 如果找到了更小的，就交换,没变就不用交换
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }
  return arr;
};
// 数组中第k个最大元素
// 给定整数数组 nums 和整数 k，请返回数组中第 k 个最大的元素。
// 请注意，你需要找的是数组排序后的第 k 个最大的元素，而不是第 k 个不同的元素。
// 你必须设计并实现时间复杂度为 O(n) 的算法解决此问题。
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findKthLargest = function (nums, k) {
  return nums.sort((a, b) => b - a)[k - 1];
};
// 🔁 遍历类题目（重点）：
// 前序 / 中序 / 后序 遍历（递归 & 非递归）

// LeetCode 144（前序）

function preorderTraversal(root) {
  const res = [];
  const stack = [];
  while (root || stack.length) {
    while (root) {
      res.push(root.val);
      stack.push(root);
      root = root.left;
    }
    root = stack.pop();
    root = root.right;
  }
  return res;
}
// LeetCode 94（中序）

// LeetCode 145（后序）

// 层序遍历（BFS）

// LeetCode 102（Binary Tree Level Order Traversal）

// LeetCode 107（从下往上层序遍历）
// 二叉树中的所有路径
// 给你一个二叉树的根节点 root ，按 任意顺序 ，返回所有从根节点到叶子节点的路径。
// 叶子节点 是指没有子节点的节点。
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {string[]}
 */
var binaryTreePaths = function (root) {};
// 二叉树中和为某一值的路径
// node中promisify实现
// fetch兼容超时重传
// 观察者模式（高频）
// String indexOf实现
// 扁平化
// 柯里化
//深度优先（DFS）
// 广度优先（BFS）
