// List of known chain identifiers (partial names)
const CHAIN_KEYWORDS = [
  'サイゼリヤ',
  'マツモトキヨシ',
  'ドトール',
  'スターバックス',
  'タリーズ',
  'すき家',
  '吉野家',
  '松屋',
  'コメダ',
  'ミスタードーナツ',
  'ローソン',
  'ファミリーマート',
  'セブンイレブン',
  'ダイソー',
  'ココカラファイン',
  'ツルハ',
  'サンドラッグ'
];

// List of non-profit keywords to exclude
const NON_PROFIT_KEYWORDS = [
  '神社',
  '寺',
  '教会',
  'NPO',
  '法人',
  '協会',
  '組合',
  '財団',
  '公園',
  '市役所',
  '区役所'
];

export async function filterChainBusinesses(businesses) {
  return businesses.filter(business => {
    const name = business.name || '';
    
    // Exclude non-profits
    if (NON_PROFIT_KEYWORDS.some(keyword => name.includes(keyword))) {
      return false;
    }
    
    // Exclude known chains
    if (CHAIN_KEYWORDS.some(keyword => name.includes(keyword))) {
      return false;
    }
    
    // Additional checks can be added here
    
    return true;
  });
}