// アプリ全体の定数

// 付箋の色パレット（モダンなグラデーション風パステル）
export const STICKY_COLORS = [
  '#FF6B6B', // コーラル
  '#4ECDC4', // ティール
  '#45B7D1', // スカイ
  '#96CEB4', // セージ
  '#FFEAA7', // レモン
  '#DDA0DD', // オーキッド
  '#A29BFE', // ラベンダー
  '#FD79A8', // ピンク
  '#74B9FF', // ブルー
  '#55EFC4', // ミント
  '#FDCB6E', // マリーゴールド
  '#E17055', // テラコッタ
] as const;

// デフォルトの所要時間選択肢（分）
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180] as const;

// タイムラインの設定
export const TIMELINE = {
  START_HOUR: 0,
  END_HOUR: 24,
  HOUR_HEIGHT: 80,           // 1時間あたりの高さ（px）
  SLOT_INTERVAL: 30,         // 分刻み
} as const;

// テーマカラー（モダンダーク）
export const COLORS = {
  // ベース
  background: '#0a0a1a',
  surface: '#141428',
  surfaceLight: '#1e1e3a',
  surfaceElevated: '#252548',

  // ブランド
  primary: '#4ECDC4',
  primaryDark: '#3db8b0',
  primaryGlow: 'rgba(78, 205, 196, 0.15)',
  accent: '#A29BFE',
  accentGlow: 'rgba(162, 155, 254, 0.15)',

  // テキスト
  text: '#f0f0ff',
  textSecondary: '#9898b8',
  textMuted: '#5c5c78',

  // UI
  border: '#2a2a48',
  borderLight: '#35355a',
  danger: '#FF6B6B',
  dangerGlow: 'rgba(255, 107, 107, 0.15)',
  success: '#55EFC4',
  successGlow: 'rgba(85, 239, 196, 0.15)',
  warning: '#FDCB6E',

  // レイアウト
  trayBackground: '#0e0e22',
  timelineBackground: '#0c0c1e',
  timelineLine: '#1e1e38',
  overlay: 'rgba(0,0,0,0.7)',

  // グラデーション（LinearGradient用）
  gradientStart: '#141428',
  gradientEnd: '#0a0a1a',
  headerGradientStart: '#1a1a38',
  headerGradientEnd: '#141428',
} as const;

// アニメーション設定
export const ANIMATION = {
  SPRING_CONFIG: {
    damping: 15,
    stiffness: 150,
    mass: 0.5,
  },
  FLY_DURATION: 400,        // 付箋が飛んでいくアニメーション時間(ms)
} as const;

// サンプルタスク（初回起動時）
export const SAMPLE_TASKS = [
  { title: '会議', duration: 60, color: '#45B7D1', icon: '💼', defaultStartTime: '10:00' },
  { title: 'ランチ', duration: 60, color: '#96CEB4', icon: '🍱', defaultStartTime: '12:00' },
  { title: 'ジム', duration: 90, color: '#FF6B6B', icon: '💪', defaultStartTime: '18:00' },
  { title: '勉強', duration: 60, color: '#FFEAA7', icon: '📚', defaultStartTime: '20:00' },
  { title: 'メール確認', duration: 30, color: '#A29BFE', icon: '📧', defaultStartTime: '09:00' },
  { title: '休憩', duration: 15, color: '#55EFC4', icon: '☕', defaultStartTime: '15:00' },
  { title: '通院', duration: 60, color: '#FD79A8', icon: '🏥' },
  { title: '買い物', duration: 45, color: '#74B9FF', icon: '🛒' },
] as const;

// AsyncStorageのキー
export const STORAGE_KEYS = {
  TASKS: '@flicksched/tasks',
  SCHEDULED: '@flicksched/scheduled',
  SETTINGS: '@flicksched/settings',
  FIRST_LAUNCH: '@flicksched/first_launch',
} as const;
