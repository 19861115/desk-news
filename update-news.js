const fs = require('fs');

// ==========================================
// 取得したいフィード一覧
// ==========================================
const FEEDS = [
  // --- ニュース系（高頻度） ---
  { 
    name: '経済', 
    group: 'ニュース',
    badgeClass: 'badge-business', 
    url: 'https://news.yahoo.co.jp/rss/topics/business.xml',
    limit: 5
  },
  { 
    name: '国内', 
    group: 'ニュース',
    badgeClass: 'badge-domestic', 
    url: 'https://news.yahoo.co.jp/rss/topics/domestic.xml',
    limit: 5
  },
  { 
    name: '国際', 
    group: 'ニュース',
    badgeClass: 'badge-world', 
    url: 'https://news.yahoo.co.jp/rss/topics/world.xml',
    limit: 5
  },
  { 
    name: 'IT', 
    group: 'ニュース',
    badgeClass: 'badge-it', 
    url: 'https://news.yahoo.co.jp/rss/topics/it.xml',
    limit: 5
  },
    { 
    name: '科学', 
    group: 'ニュース',
    badgeClass: 'badge-science', 
    url: 'https://news.yahoo.co.jp/rss/topics/science.xml',
    limit: 5
  },
  // --- 専門メディア・ブログ系（低〜中頻度） ---
  { 
    name: 'ITmedia', 
    group: 'IT・メディア',
    badgeClass: 'badge-itmedia', 
    url: 'https://rss.itmedia.co.jp/rss/2.0/itmedia_all.xml',
    limit: 5
  },
  { 
    name: 'デジカメinfo', 
    group: 'カメラ・ホビー',
    badgeClass: 'badge-camera', 
    url: 'https://digicame-info.com/rss.xml',
    limit: 5
  }
];

async function main() {
  const allItems = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)' }
      });
      if (!res.ok) {
        console.warn(`HTTPエラー: ${feed.name} (${res.status})`);
        continue;
      }
      const text = await res.text();

      // RSS 1.0, 2.0, Atom の <item> や <entry> に幅広く対応
      const itemBlocks = text.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];
      const feedItems = [];

      for (const block of itemBlocks) {
        // タイトル
        const titleMatch = block.match(/<title(?:[\s\S]*?)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        // リンク (通常の <link> または Atomの <link href="...">)
        const linkMatch = block.match(/<link(?:[\s\S]*?)href=["']([^"']+)["']/i) || 
                          block.match(/<link(?:[\s\S]*?)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
        // 日付 (pubDate, dc:date, updated に対応)
        const dateMatch = block.match(/<(?:pubDate|dc:date|updated)>([\s\S]*?)<\/(?:pubDate|dc:date|updated)>/i);

        if (titleMatch && linkMatch) {
          const rawDate = dateMatch ? dateMatch[1].trim() : '';
          const pubDate = rawDate && !isNaN(Date.parse(rawDate)) ? new Date(rawDate).toISOString() : new Date().toISOString();

          feedItems.push({
            category: feed.name,
            group: feed.group,
            badgeClass: feed.badgeClass,
            title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
            link: (linkMatch[1] || linkMatch[0]).trim(),
            pubDate: pubDate
          });
        }
      }

      // 各フィードごとに指定件数（limit）を確保
      feedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      allItems.push(...feedItems.slice(0, feed.limit || 5));

    } catch (err) {
      console.error(`取得失敗: ${feed.name}`, err);
    }
  }

  // 全体を最新順にソート
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const output = {
    updatedAt: new Date().toISOString(),
    items: allItems
  };

  fs.writeFileSync('news.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log(`news.json を生成しました (合計: ${output.items.length} 件)`);
}

main();
