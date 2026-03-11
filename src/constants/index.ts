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

// テーマカラー（ライトテーマ）
export const COLORS = {
  // ベース
  background: '#FFFFFF',
  surface: '#F5F5F8',
  surfaceLight: '#EEEEF2',
  surfaceElevated: '#E8E8EE',

  // ブランド
  primary: '#4ECDC4',
  primaryDark: '#3db8b0',
  primaryGlow: 'rgba(78, 205, 196, 0.12)',
  accent: '#7C6BF0',
  accentGlow: 'rgba(124, 107, 240, 0.10)',

  // テキスト
  text: '#1a1a2e',
  textSecondary: '#6b6b80',
  textMuted: '#a0a0b0',

  // UI
  border: '#e0e0e8',
  borderLight: '#d0d0da',
  danger: '#FF5252',
  dangerGlow: 'rgba(255, 82, 82, 0.10)',
  success: '#00C48C',
  successGlow: 'rgba(0, 196, 140, 0.10)',
  warning: '#FFB74D',

  // レイアウト
  trayBackground: '#F8F8FC',
  timelineBackground: '#FAFAFE',
  timelineLine: '#e8e8f0',
  overlay: 'rgba(0,0,0,0.4)',

  // グラデーション（LinearGradient用）
  gradientStart: '#F5F5F8',
  gradientEnd: '#FFFFFF',
  headerGradientStart: '#FFFFFF',
  headerGradientEnd: '#F5F5F8',
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
