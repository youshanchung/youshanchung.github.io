/**
 * Bilingual dictionary. Add new strings here only — never hard-code text in screens.
 */

export type Lang = 'zh' | 'en';

const dict = {
  appTitle:        { zh: 'Tabata 計時器',       en: 'Tabata Timer' },

  prepare:         { zh: '準備',                en: 'GET READY' },
  work:            { zh: '運動',                en: 'WORK' },
  rest:            { zh: '休息',                en: 'REST' },
  cycleRest:       { zh: '回合間休息',          en: 'CYCLE REST' },
  done:            { zh: '完成！',              en: 'DONE!' },

  routine:         { zh: '例行設定',            en: 'Routine' },
  loadLast:        { zh: '載入前次鍛鍊',        en: 'Load last workout' },
  workShort:       { zh: '運動',                en: 'Work' },
  restShort:       { zh: '休息',                en: 'Rest' },
  exercises:       { zh: '運動',                en: 'Exercises' },
  cycles:          { zh: '回合',                en: 'Cycles' },
  cycleResetTime:  { zh: '重設回合',            en: 'Cycle Rest' },
  sound:           { zh: '聲音',                en: 'Sound' },
  start:           { zh: '開始',                en: 'Start' },

  next:            { zh: '接下來:',             en: 'Next:' },
  pauseOnLeave:    { zh: '如果我離開本 app 就暫停鍛鍊', en: 'Pause workout if I leave the app' },
  totalRemaining:  { zh: '剩餘總時間',          en: 'Total remaining' },
  quitTitle:       { zh: '結束鍛鍊？',          en: 'Quit workout?' },
  quitBody:        { zh: '目前進度將不會保留。', en: 'Your progress on this run won’t be saved.' },
  quit:            { zh: '結束',                en: 'Quit' },

  editExercises:   { zh: '編輯運動清單',        en: 'Edit Exercises' },
  exerciseName:    { zh: '名稱',                en: 'Name' },
  workSeconds:     { zh: '運動秒數',            en: 'Work seconds' },
  restSeconds:     { zh: '休息秒數',            en: 'Rest seconds' },
  addExercise:     { zh: '+ 新增運動',          en: '+ Add exercise' },
  remove:          { zh: '移除',                en: 'Remove' },
  save:            { zh: '儲存',                en: 'Save' },
  cancel:          { zh: '取消',                en: 'Cancel' },

  on:              { zh: '開',                  en: 'ON' },
  off:             { zh: '關',                  en: 'OFF' },
} as const;

export type StringKey = keyof typeof dict;

export function t(key: StringKey, lang: Lang): string {
  return dict[key][lang];
}
