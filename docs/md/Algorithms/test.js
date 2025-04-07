class TrieNode {
  constructor() {
    this.children = {}; // 子节点映射：键是字符，值是 TrieNode
    this.isEnd = false; // 标记是否是单词结尾
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
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
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
const trie = new Trie();
trie.insert("cat");
trie.insert("car");
trie.insert("dog");

console.log(trie.search("cat"));      // true
console.log(trie.search("cab"));      // false
console.log(trie.startsWith("ca"));   // true
console.log(trie.startsWith("do"));   // true
console.log(trie.startsWith("du"));   // false