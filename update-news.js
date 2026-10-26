const fs = require('fs');

// 取得したいカテゴリ一覧
const FEEDS = [
  { name: '経済', class: 'badge-business', url: 'https://news.yahoo.co.jp/rss/topics/business.xml' },
  { name: '国内', class: 'badge-domestic', url: 'https://news.yahoo.co.jp/rss/topics/domestic.xml' },
  { name: '国際', class: 'badge-world', url: 'https://news.yahoo.co.jp/rss/topics/world.xml' },
  { name: 'IT', class: 'badge-it', url: 'https://news.yahoo.co.jp/rss/topics/it.xml' },
  { name: '科学', class: 'badge-science', url: 'hhttps://news.yahoo.co.jp/rss/topics/.xml' },
];

async function main() {
  const allItems = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url);
      if (!res.ok) continue;
      const text = await res.text();

      // <item> を正規表現で抽出（外部ライブラリ不要）
      const itemBlocks = text.match(/<item>[\s\S]*?<\/item>/gi) || [];

      for (const block of itemBlocks) {
        const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
        const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

        if (titleMatch && linkMatch) {
          allItems.push({
            category: feed.name,
            badgeClass: feed.class,
            title: titleMatch[1].trim(),
            link: linkMatch[1].trim(),
            pubDate: dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error(`取得失敗: ${feed.name}`, err);
    }
  }

  // 最新順にソートして最大20件保持
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const output = {
    updatedAt: new Date().toISOString(),
    items: allItems.slice(0, 20)
  };

  fs.writeFileSync('news.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log(`news.json を生成しました (${output.items.length} 件)`);
}

main();
