export const EMOTIONS = {
  happy:   { emoji: '😊', color: '#7C9E8F', bg: '#EEF5F2', label: 'Happy' },
  sad:     { emoji: '😔', color: '#8E87B8', bg: '#F0EFF8', label: 'Sad' },
  anxious: { emoji: '😰', color: '#C4924A', bg: '#FBF5EC', label: 'Anxious' },
  angry:   { emoji: '😤', color: '#C9897A', bg: '#FBF1EF', label: 'Angry' },
  neutral: { emoji: '😐', color: '#6B7280', bg: '#F3F4F6', label: 'Neutral' },
};

export const getRiskColor = (level) => {
  if (level === 'high') return '#DC2626';
  if (level === 'medium') return '#D97706';
  return '#059669';
};

export const getRiskLabel = (level) => {
  if (level === 'high') return 'Crisis Detected';
  if (level === 'medium') return 'Some Distress';
  return 'Stable';
};
