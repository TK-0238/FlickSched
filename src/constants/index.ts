// アプリ全体の定数

// 付箋の色パレット
export const STICKY_COLORS = [
  '#FF6B6B', // 赤
  '#4ECDC4', // ティール
  '#45B7D1', // 水色
  '#96CEB4', // ミント
  '#FFEAA7', // 黄色
  '#DDA0DD', // プラム
  '#98D8C8', // セージ
  '#F7DC6F', // ゴールド
  '#BB8FCE', // ラベンダー
  '#F0B27A', // ピーチ
  '#85C1E9', // スカイブルー
  '#82E0AA', // ライトグリーン
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

// テーマカラー
export const COLORS = {
  background: '#0f0f23',
  surface: '#1a1a2e',
  surfaceLight: '#25253d',
  primary: '#4ECDC4',
  primaryDark: '#3db8b0',
  text: '#e8e8f0',
  textSecondary: '#8888a8',
  textMuted: '#555570',
  border: '#2a2a44',
  danger: '#FF6B6B',
  success: '#82E0AA',
  trayBackground: '#16162a',
  timelineBackground: '#121230',
  timelineLine: '#2a2a44',
  overlay: 'rgba(0,0,0,0.6)',
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
  { title: 'メール確認', duration: 30, color: '#DDA0DD', icon: '📧', defaultStartTime: '09:00' },
  { title: '休憩', duration: 15, color: '#98D8C8', icon: '☕', defaultStartTime: '15:00' },
  { title: '通院', duration: 60, color: '#F0B27A', icon: '🏥' },
  { title: '買い物', duration: 45, color: '#BB8FCE', icon: '🛒' },
] as const;

// AsyncStorageのキー
export const STORAGE_KEYS = {
  TASKS: '@flicksched/tasks',
  SCHEDULED: '@flicksched/scheduled',
  SETTINGS: '@flicksched/settings',
  FIRST_LAUNCH: '@flicksched/first_launch',
} as const;
