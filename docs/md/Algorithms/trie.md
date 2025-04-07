# 字典树（Trie，也叫前缀树）是一种树形结构，常用于高效地处理和存储 字符串集合，特别适合

- 快速查找某个字符串是否存在
- 查找是否有某个前缀开头的单词
- 实现自动补全、拼写检查等功能

## 🧠 简单理解

你可以把 字典树 想象成一棵“按字母一层一层展开”的树：

- 每个节点表示一个字符

- 从根节点到某个节点的路径组成一个字符串前缀

- 完整的单词会在结尾节点上做个标记：✅ “这是一个完整的单词”

## 🌳 举个例子：插入字符串 ["cat", "car", "dog"]

插入过程：

```css
根
├── c
│   └── a
│       ├── t ✅
│       └── r ✅
└── d
    └── o
        └── g ✅
```

- 三个词都会被拆开字母一层一层插进去

- 公共前缀 "ca" 只存一份，节省空间

- ✅ 表示该路径组成的是一个完整单词

## ✅ 字典树的特点

特性 | 说明
--- | ---
查找效率高 | 查找时间复杂度是 O(k)，k 是字符串长度，不受字符串数量影响
支持前缀查询 | 可以快速判断是否有以某个前缀开头的单词
节省空间 | 共用前缀，避免重复存储

## 💻 常用方法

- insert(word) 插入单词

- search(word) 查找单词是否存在

- startsWith(prefix) 判断是否存在某个前缀

## ✨ 应用场景

- 搜索提示 / 自动补全（如输入"he" -> 自动提示"hello", "hey"）

- 拼写检查（是否拼错单词）

- 文本压缩、词频统计、敏感词过滤等

## 📚 字典树的实现

```js
class TrieNode {
  constructor() {
    this.children = {};   // 子节点映射：键是字符，值是 TrieNode
    this.isEnd = false;   // 标记是否是单词结尾
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // 插入单词
  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode(); // 创建新节点
      }
      node = node.children[char];
    }
    node.isEnd = true; // 单词结束标记
  }

  // 查找完整单词
  search(word) {
    let node = this._searchNode(word);
    return node !== null && node.isEnd === true;
  }

  // 查找是否有这个前缀
  startsWith(prefix) {
    return this._searchNode(prefix) !== null;
  }

  // 私有方法：走完整个单词/前缀路径
  _searchNode(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }
}

```

## ✅ 使用示例

```js
const trie = new Trie();
trie.insert("cat");
trie.insert("car");
trie.insert("dog");

console.log(trie.search("cat"));      // true
console.log(trie.search("cab"));      // false
console.log(trie.startsWith("ca"));   // true
console.log(trie.startsWith("do"));   // true
console.log(trie.startsWith("du"));   // false

```
