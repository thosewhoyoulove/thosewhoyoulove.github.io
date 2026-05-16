# Trie 前缀树

## 面试定位

Trie 是字符串算法里比较常见的数据结构题。面试重点是：它适合前缀查询，时间复杂度和字符串长度有关，常用于搜索联想、敏感词、词典匹配。

## 核心原理

Trie，也叫前缀树，是一棵按字符逐层展开的树。

- 每条边或节点表示一个字符。
- 从根节点到某个节点的路径表示一个前缀。
- 完整单词的结尾节点会有结束标记。

插入 `cat`、`car`、`dog` 后：

```text
root
├── c
│   └── a
│       ├── t *
│       └── r *
└── d
    └── o
        └── g *
```

`*` 表示一个完整单词结束。

## 复杂度

设字符串长度为 k：

- 插入：O(k)
- 查找完整单词：O(k)
- 查找前缀：O(k)

它不直接依赖词库里有多少个单词，而是依赖输入字符串长度。

空间复杂度取决于字符分叉数量。公共前缀越多，空间复用越明显；如果字符串几乎没有公共前缀，空间占用会更大。

## 实现

```javascript
class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEnd = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;

        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char);
        }

        node.isEnd = true;
    }

    search(word) {
        const node = this.findNode(word);
        return !!node && node.isEnd;
    }

    startsWith(prefix) {
        return !!this.findNode(prefix);
    }

    findNode(str) {
        let node = this.root;

        for (const char of str) {
            if (!node.children.has(char)) {
                return null;
            }
            node = node.children.get(char);
        }

        return node;
    }
}
```

使用：

```javascript
const trie = new Trie();
trie.insert("cat");
trie.insert("car");

console.log(trie.search("cat")); // true
console.log(trie.search("ca")); // false
console.log(trie.startsWith("ca")); // true
```

## 应用场景

- 搜索框自动补全。
- 拼写检查。
- 词典查询。
- 敏感词过滤。
- 路由匹配。
- IP 或路径前缀匹配。

## 面试回答

可以这样答：

> Trie 是一种用于字符串集合的树形结构，核心优势是高效前缀查询。每个节点表示一个字符，从根到某个节点的路径表示一个前缀，单词结尾节点用 `isEnd` 标记。插入、查询完整单词、查询前缀的时间复杂度都是 O(k)，k 是字符串长度，和词库总数量没有直接关系。它适合搜索联想、敏感词过滤、词典匹配等场景。缺点是空间占用可能较高，尤其是公共前缀少时。

## 高频追问

### Trie 和 HashMap 查字符串有什么区别？

HashMap 查完整字符串很快，但不擅长前缀查询。Trie 能快速判断某个前缀是否存在，并找到该前缀下的所有词。

### Trie 空间怎么优化？

可以用 Map 动态存子节点，或压缩前缀树、Radix Tree，把只有一个分支的链路压缩成字符串片段。

### 敏感词过滤为什么适合 Trie？

可以从文本每个位置开始沿 Trie 匹配，遇到结束标记说明命中敏感词。多个词共享前缀时能减少重复比较。

## 相关链接

- [JavaScript 数据类型](/md/基础/JavaScript/数据类型.md)
