/**
 * Alias dictionary: common short names → law_id for direct lookup.
 * Avoids a search API round-trip for the most frequently used laws.
 */
export const LAW_ALIASES: Record<string, { lawId: string; fullTitle: string }> = {
  // 六法
  憲法: { lawId: "321CONSTITUTION", fullTitle: "日本国憲法" },
  日本国憲法: { lawId: "321CONSTITUTION", fullTitle: "日本国憲法" },
  民法: { lawId: "129AC0000000089", fullTitle: "民法" },
  刑法: { lawId: "140AC0000000045", fullTitle: "刑法" },
  商法: { lawId: "132AC0000000048", fullTitle: "商法" },
  民事訴訟法: { lawId: "408AC0000000109", fullTitle: "民事訴訟法" },
  民訴法: { lawId: "408AC0000000109", fullTitle: "民事訴訟法" },
  刑事訴訟法: { lawId: "323AC0000000131", fullTitle: "刑事訴訟法" },
  刑訴法: { lawId: "323AC0000000131", fullTitle: "刑事訴訟法" },

  // 主要法
  会社法: { lawId: "417AC0000000086", fullTitle: "会社法" },
  行政事件訴訟法: { lawId: "337AC0000000139", fullTitle: "行政事件訴訟法" },
  行訴法: { lawId: "337AC0000000139", fullTitle: "行政事件訴訟法" },
  行政手続法: { lawId: "405AC0000000088", fullTitle: "行政手続法" },
  行手法: { lawId: "405AC0000000088", fullTitle: "行政手続法" },
  国家賠償法: { lawId: "322AC0000000125", fullTitle: "国家賠償法" },
  国賠法: { lawId: "322AC0000000125", fullTitle: "国家賠償法" },
  労働基準法: { lawId: "322AC0000000049", fullTitle: "労働基準法" },
  労基法: { lawId: "322AC0000000049", fullTitle: "労働基準法" },
  労働契約法: { lawId: "419AC0000000128", fullTitle: "労働契約法" },
  独占禁止法: { lawId: "322AC0000000054", fullTitle: "私的独占の禁止及び公正取引の確保に関する法律" },
  独禁法: { lawId: "322AC0000000054", fullTitle: "私的独占の禁止及び公正取引の確保に関する法律" },
  著作権法: { lawId: "345AC0000000048", fullTitle: "著作権法" },
  特許法: { lawId: "334AC0000000121", fullTitle: "特許法" },
  所得税法: { lawId: "340AC0000000033", fullTitle: "所得税法" },
  法人税法: { lawId: "340AC0000000034", fullTitle: "法人税法" },
  消費税法: { lawId: "363AC0000000108", fullTitle: "消費税法" },
  道路交通法: { lawId: "335AC0000000105", fullTitle: "道路交通法" },
  道交法: { lawId: "335AC0000000105", fullTitle: "道路交通法" },
  建築基準法: { lawId: "325AC0000000201", fullTitle: "建築基準法" },
  消費者契約法: { lawId: "412AC0000000061", fullTitle: "消費者契約法" },
  消契法: { lawId: "412AC0000000061", fullTitle: "消費者契約法" },
  民事執行法: { lawId: "354AC0000000004", fullTitle: "民事執行法" },
  民執法: { lawId: "354AC0000000004", fullTitle: "民事執行法" },
  民事保全法: { lawId: "401AC0000000091", fullTitle: "民事保全法" },
  破産法: { lawId: "416AC0000000075", fullTitle: "破産法" },
  借地借家法: { lawId: "403AC0000000090", fullTitle: "借地借家法" },
  不動産登記法: { lawId: "416AC0000000123", fullTitle: "不動産登記法" },
  戸籍法: { lawId: "322AC0000000224", fullTitle: "戸籍法" },
  地方自治法: { lawId: "322AC0000000067", fullTitle: "地方自治法" },
  自治法: { lawId: "322AC0000000067", fullTitle: "地方自治法" },
  個人情報保護法: { lawId: "415AC0000000057", fullTitle: "個人情報の保護に関する法律" },
  金融商品取引法: { lawId: "323AC0000000025", fullTitle: "金融商品取引法" },
  金商法: { lawId: "323AC0000000025", fullTitle: "金融商品取引法" },
};

/**
 * Resolve a user-supplied law name to a law_id if it matches a known alias.
 * Returns undefined if not found.
 */
export function resolveAlias(name: string): { lawId: string; fullTitle: string } | undefined {
  return LAW_ALIASES[name.trim()];
}
