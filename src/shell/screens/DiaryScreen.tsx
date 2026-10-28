import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { es, type TextKey, type Translate } from '../../i18n';
import type { ActivityEvent, MinigameMetrics, StageSummary } from '../activity';
import { dayMarks, diaryDays, diaryTotals, monthGrid, monthOf, shiftMonth, streakDates, timeOf, weekdayOf, type DayMark, type DiaryDay, type Month } from '../diary';
import type { DogRecord } from '../dogRecord';
import { LESSONS } from '../lessons/content';
import { findNode } from '../nodes/content';
import { Button } from '../Overlays';
import { shownStreak, type DiaryOutcome, type WalkDiaryEntry } from '../streak';
import { Badge, Choice, Panel, StarRow } from '../ui/components';
import { handlePress } from '../ui/press';
import type { BadgeTone } from '../ui/styles';
import { color, theme } from '../ui/theme';
import { worldOfNode } from '../world';
import { Flame } from './WorldMapScreen';
import { Screen } from './Screen';

type View_ = 'calendar' | 'events';

const MARK_COLOR: Record<DayMark, string> = {
  node: color.brand,
  daily: color.accent,
  lesson: color.info,
  walk: color.coral,
  'first-stage': color.sintonia,
};

const OUTCOME_TONE: Record<DiaryOutcome, BadgeTone> = { completed: 'brand', struggled: 'warn', skipped: 'quiet' };

const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function monthName(t: Translate, month: number): string {
  return t(`diary.month.${month}` as TextKey);
}

function longDate(t: Translate, date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return capitalized(fill(t('diary.dateLong'), { weekday: t(`diary.weekday.${weekdayOf(date)}` as TextKey), day: d, month: monthName(t, m - 1), year: y }));
}

function nodeTitle(t: Translate, id: string): string {
  const node = findNode(id);
  return node ? t(node.title) : t('diary.event.unknown');
}

/** A coloured dot for a kind of mark; the legend and the day text name it, so colour is never the only signal. */
function Dot({ mark, size = 8 }: { mark: DayMark; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: MARK_COLOR[mark], borderWidth: 1.5, borderColor: color.ink }} />;
}

/** One figure in a two-column grid: a small label over a bold value. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: theme.space[1], paddingRight: theme.space[2] }}>
      <Text className="text-caption text-inkMuted">{label}</Text>
      <Text className="font-display text-body text-ink">{value}</Text>
    </View>
  );
}

function StageStats({ t, stage }: { t: Translate; stage: StageSummary }) {
  const s = t('results.seconds');
  return (
    <View className="mt-1 flex-row flex-wrap">
      <Stat label={t('results.score')} value={`${stage.score} ${t('results.scoreOutOf')}`} />
      <Stat label={t('results.duration')} value={`${Math.round(stage.durationSeconds)} ${s}`} />
      <Stat label={t('results.slack')} value={`${stage.slack}%`} />
      <Stat label={t('results.pull')} value={`${stage.pull}%`} />
      <Stat label={t('results.peakArousal')} value={`${Math.round(stage.peakArousal)} / 100`} />
      <Stat label={t('results.markerAccuracy')} value={stage.markerAccuracyMs === undefined ? t('results.markerAccuracyNone') : `${Math.round(stage.markerAccuracyMs)} ${t('results.ms')}`} />
      <Stat label={t('results.hits')} value={String(stage.markerHits)} />
      <Stat label={t('results.missed')} value={String(stage.missedOpportunities)} />
      <Stat label={t('results.checkIns')} value={String(stage.checkInHits)} />
      <Stat label={t('results.posteSuccesses')} value={String(stage.posteSuccesses)} />
      <Stat label={t('results.harshStops')} value={String(stage.harshStops)} />
      <Stat label={t('results.sintonia')} value={`${Math.round(stage.sintoniaSeconds)} ${s}`} />
      <Stat label={t('results.goSniffs')} value={String(stage.goSniffs)} />
    </View>
  );
}

function MetricStats({ t, metrics }: { t: Translate; metrics: MinigameMetrics }) {
  const keys = (['tension', 'timing', 'poste', 'attention'] as const).filter((k) => metrics[k] !== undefined);
  if (keys.length === 0) return null;
  return (
    <View className="mt-1 flex-row flex-wrap">
      {keys.map((k) => (
        <Stat key={k} label={t(`diary.metric.${k}`)} value={`${Math.round(metrics[k]! * 100)}%`} />
      ))}
    </View>
  );
}

/** One line of a day: a time and a coloured mark on the left, what happened on the right. */
function Entry({ time, mark, children }: { time?: string; mark: DayMark | null; children: React.ReactNode }) {
  return (
    <View className="flex-row py-3" style={{ borderTopWidth: 2, borderStyle: 'dashed', borderColor: color.edge, gap: theme.space[3] }}>
      <View className="items-center" style={{ width: 44, gap: theme.space[1] }}>
        {mark && <Dot mark={mark} size={12} />}
        {time !== undefined && <Text className="text-caption text-inkMuted">{time}</Text>}
      </View>
      <View className="flex-1">{children}</View>
    </View>
  );
}

function EventEntry({ t, event }: { t: Translate; event: ActivityEvent }) {
  const time = timeOf(event.at);
  const details = (
    <>
      {event.stage && <StageStats t={t} stage={event.stage} />}
      {event.metrics && <MetricStats t={t} metrics={event.metrics} />}
      {event.exercise && event.exercise in es && (
        <View className="mt-2">
          <Text className="text-caption text-inkMuted">{t('diary.event.exercise')}</Text>
          <Text className="text-body text-ink">{t(event.exercise as TextKey)}</Text>
        </View>
      )}
    </>
  );
  if (event.kind === 'node') {
    const node = findNode(event.id);
    const world = worldOfNode(event.id);
    return (
      <Entry time={time} mark="node">
        <View className="flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
          <Badge label={t(node?.mode === 'minigame' ? 'diary.event.minigame' : 'diary.event.stage')} tone="brand" />
          {world && <Text className="text-caption text-inkMuted">{t(world.title)}</Text>}
        </View>
        <Text className="mt-1 font-display text-body text-ink">{nodeTitle(t, event.id)}</Text>
        {event.stars !== undefined && (
          <View className="flex-row items-center" style={{ gap: theme.space[2] }}>
            <StarRow stars={event.stars} size={18} label={`${event.stars} ${t('map.starsOf3')}`} />
            <Text className="text-caption text-inkMuted">{t('diary.event.stars')}</Text>
          </View>
        )}
        {details}
      </Entry>
    );
  }
  if (event.kind === 'daily') {
    return (
      <Entry time={time} mark="daily">
        <Text className="font-display text-body text-ink">{t('daily.title')}</Text>
        {details}
      </Entry>
    );
  }
  if (event.kind === 'first-stage') {
    return (
      <Entry time={time} mark="first-stage">
        <Text className="font-display text-body text-ink">{t('diary.event.firstStage')}</Text>
        {details}
      </Entry>
    );
  }
  const lesson = LESSONS.find((l) => l.id === event.id);
  return (
    <Entry time={time} mark="lesson">
      <Text className="text-caption text-inkMuted">{t('diary.event.lessonRead')}</Text>
      <Text className="font-display text-body text-ink">{lesson ? t(lesson.title) : t('diary.event.unknown')}</Text>
      {lesson && <Text className="text-caption text-inkMuted">{`${t('library.day')} ${lesson.day} · ${lesson.minutes} ${t('lesson.minutes')}`}</Text>}
    </Entry>
  );
}

function WalkEntry({ t, walk }: { t: Translate; walk: WalkDiaryEntry }) {
  return (
    <Entry mark="walk">
      <Text className="text-caption text-inkMuted">{t('diary.event.walk')}</Text>
      <Text className="font-display text-body text-ink">{nodeTitle(t, walk.nodeId)}</Text>
      <View className="mt-1">
        <Badge label={t(`diary.${walk.outcome}`)} tone={OUTCOME_TONE[walk.outcome]} />
      </View>
    </Entry>
  );
}

function activityCount(t: Translate, day: DiaryDay): string | null {
  const n = day.events.length + day.walks.length;
  if (n === 0) return null;
  return n === 1 ? t('diary.activity') : fill(t('diary.activities'), { count: n });
}

/** Everything known about one day. */
function DayCard({ t, day, date, today, inStreak }: { t: Translate; day: DiaryDay | undefined; date: string; today: string; inStreak: boolean }) {
  const marks = day ? dayMarks(day) : [];
  const count = day ? activityCount(t, day) : null;
  // a Daily best with no logged play (from before the log) still gets a line
  const loggedDaily = day?.events.some((e) => e.kind === 'daily') ?? false;
  return (
    <Panel className="mb-4">
      <View className="flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
        {date === today && <Badge label={t('diary.today')} tone="accent" />}
        {inStreak && (
          <View className="flex-row items-center">
            <Flame lit label={t('diary.streakDay')} />
            <Text className="text-caption text-ink">{t('diary.streakDay')}</Text>
          </View>
        )}
      </View>
      <Text className="mt-1 font-display text-title text-ink" accessibilityRole="header">
        {longDate(t, date)}
      </Text>
      {(count || marks.length > 0) && (
        <View className="mt-1 flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
          {count && <Text className="text-caption text-inkMuted">{count}</Text>}
          {marks.map((m) => (
            <View key={m} className="flex-row items-center" style={{ gap: 4 }}>
              <Dot mark={m} />
              <Text className="text-caption text-inkMuted">{t(`diary.mark.${m}`)}</Text>
            </View>
          ))}
        </View>
      )}
      {!day || (marks.length === 0 && !day.trialStarted) ? (
        <Text className="mt-3 text-body text-inkMuted">{t('diary.dayEmpty')}</Text>
      ) : (
        <View className="mt-2">
          {day.trialStarted && (
            <Entry mark={null}>
              <Badge label={t('world.plusBadge')} tone="accent" />
              <Text className="mt-1 text-body text-ink">{t('diary.event.trial')}</Text>
            </Entry>
          )}
          {day.events.map((e) => (
            <EventEntry key={`${e.at}|${e.kind}|${e.id}`} t={t} event={e} />
          ))}
          {day.walks.map((w) => (
            <WalkEntry key={w.nodeId} t={t} walk={w} />
          ))}
          {day.dailyBest !== undefined && (
            <Entry mark="daily">
              <Text className="text-caption text-inkMuted">{t('diary.event.dailyBest')}</Text>
              <Text className="font-display text-title text-ink">{`${day.dailyBest} ${t('results.scoreOutOf')}`}</Text>
              {!loggedDaily && <Text className="text-caption text-inkMuted">{t('diary.event.noDetails')}</Text>}
            </Entry>
          )}
        </View>
      )}
    </Panel>
  );
}

function Totals({ t, record, days, today }: { t: Translate; record: DogRecord; days: readonly DiaryDay[]; today: string }) {
  const totals = diaryTotals(days);
  const walks = totals.walks.completed + totals.walks.struggled + totals.walks.skipped;
  const dayWord = (n: number) => `${n} ${t(n === 1 ? 'streak.day' : 'streak.days')}`;
  return (
    <Panel className="mb-4">
      <View className="flex-row flex-wrap">
        <Stat label={t('diary.totals.streak')} value={dayWord(shownStreak(record.streak, today))} />
        <Stat label={t('diary.totals.bestStreak')} value={dayWord(record.streak.best)} />
        <Stat label={t('diary.totals.activeDays')} value={String(totals.activeDays)} />
        <Stat label={t('diary.totals.bestScore')} value={totals.bestScore === null ? '-' : `${totals.bestScore} ${t('results.scoreOutOf')}`} />
        <Stat label={t('diary.totals.nodeRuns')} value={String(totals.nodeRuns)} />
        <Stat label={t('diary.totals.dailyRuns')} value={String(totals.dailyRuns)} />
        <Stat label={t('diary.totals.lessonsRead')} value={String(totals.lessonsRead)} />
        <Stat label={t('diary.totals.walks')} value={walks === 0 ? '0' : `${walks} (${totals.walks.completed} ✓)`} />
      </View>
      {totals.since && <Text className="mt-1 text-caption text-inkMuted">{fill(t('diary.totals.since'), { date: longDate(t, totals.since).toLowerCase() })}</Text>}
    </Panel>
  );
}

function Legend({ t }: { t: Translate }) {
  return (
    <View className="mt-3 flex-row flex-wrap" style={{ gap: theme.space[3] }}>
      {(['node', 'daily', 'lesson', 'walk', 'first-stage'] as const).map((m) => (
        <View key={m} className="flex-row items-center" style={{ gap: 4 }}>
          <Dot mark={m} />
          <Text className="text-caption text-inkMuted">{t(`diary.mark.${m}`)}</Text>
        </View>
      ))}
    </View>
  );
}

function MonthNavButton({ label, glyph, onPress }: { label: string; glyph: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => handlePress(onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="items-center justify-center rounded-game-pill bg-surface"
      style={{ width: theme.size.touchMin, height: theme.size.touchMin, borderWidth: theme.border.ink, borderColor: color.ink }}
    >
      <Text className="font-display text-title text-ink">{glyph}</Text>
    </Pressable>
  );
}

function Calendar({
  t,
  month,
  onMonth,
  byDate,
  streak,
  today,
  selected,
  onSelect,
}: {
  t: Translate;
  month: Month;
  onMonth: (m: Month) => void;
  byDate: ReadonlyMap<string, DiaryDay>;
  streak: ReadonlySet<string>;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}) {
  const weeks = monthGrid(month);
  const title = capitalized(fill(t('diary.monthYear'), { month: monthName(t, month.month), year: month.year }));
  const hasAny = weeks.some((w) => w.some((d) => d !== null && byDate.has(d)));
  return (
    <Panel className="mb-4">
      <View className="flex-row items-center justify-between" style={{ gap: theme.space[2] }}>
        <MonthNavButton label={t('diary.prevMonth')} glyph="‹" onPress={() => onMonth(shiftMonth(month, -1))} />
        <Pressable onPress={() => handlePress(() => { onMonth(monthOf(today)); onSelect(today); })} accessibilityRole="button" accessibilityLabel={`${title}. ${t('diary.thisMonth')}`} className="shrink items-center">
          <Text className="font-display text-title text-ink">
            {title}
          </Text>
        </Pressable>
        <MonthNavButton label={t('diary.nextMonth')} glyph="›" onPress={() => onMonth(shiftMonth(month, 1))} />
      </View>
      <View className="mt-3 flex-row">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="font-display text-caption text-inkMuted" accessibilityLabel={t(`diary.weekday.${i}` as TextKey)}>
              {t(`diary.weekdayShort.${i}` as TextKey)}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((date, di) => {
            if (date === null) return <View key={di} className="flex-1" style={{ aspectRatio: 0.85 }} />;
            const day = byDate.get(date);
            const marks = day ? dayMarks(day) : [];
            const active = marks.length > 0;
            const isSelected = date === selected;
            const isToday = date === today;
            const inStreak = streak.has(date);
            const label = [longDate(t, date), isToday ? t('diary.today') : '', ...marks.map((m) => t(`diary.mark.${m}`)), inStreak ? t('diary.streakDay') : ''].filter(Boolean).join('. ');
            return (
              <Pressable
                key={date}
                onPress={() => handlePress(() => onSelect(date))}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={label}
                className="flex-1"
                style={{ aspectRatio: 0.85, padding: 2 }}
              >
                <View
                  className="flex-1 items-center justify-center"
                  style={{
                    borderRadius: theme.radius.sm,
                    backgroundColor: isSelected ? color.brand : active ? color.accentSoft : undefined,
                    borderWidth: isToday || isSelected ? theme.border.ink : active ? 1.5 : 0,
                    borderColor: isToday && !isSelected ? color.focus : color.ink,
                    gap: 2,
                  }}
                >
                  <Text className="font-display text-body" style={{ color: isSelected ? color.onBrand : active ? color.ink : color.inkMuted }}>
                    {String(Number(date.slice(8)))}
                  </Text>
                  <View className="flex-row" style={{ gap: 2, minHeight: 6 }}>
                    {marks.map((m) => (
                      <Dot key={m} mark={m} size={6} />
                    ))}
                  </View>
                  {inStreak && <View pointerEvents="none" style={{ position: 'absolute', bottom: 2, left: 6, right: 6, height: 3, borderRadius: 2, backgroundColor: color.flame }} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      {!hasAny && <Text className="mt-2 text-caption text-inkMuted">{t('diary.monthEmpty')}</Text>}
      <Legend t={t} />
    </Panel>
  );
}

/**
 * The Diary: a month calendar whose marked days open what happened on them, or a list of only the
 * days with activity, newest first. Read-only; it shows the record and never changes it.
 */
export function DiaryScreen({ t, record, today, onBack }: { t: Translate; record: DogRecord; today: string; onBack: () => void }) {
  const days = useMemo(() => diaryDays(record), [record]);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const streak = useMemo(() => streakDates(record.streak.lastActiveDate, record.streak.current, today), [record.streak, today]);
  const [view, setView] = useState<View_>('calendar');
  const [month, setMonth] = useState<Month>(() => monthOf(today));
  const [selected, setSelected] = useState(today);

  const header = (
    <View>
      <View className="flex-row items-center justify-between" style={{ gap: theme.space[2] }}>
        <Text className="shrink font-display text-title text-ink" accessibilityRole="header">
          {t('diary.screen.title')}
        </Text>
        <Button label={t('diary.back')} tone="secondary" onPress={onBack} />
      </View>
      <View className="flex-row flex-wrap">
        <Choice label={t('diary.view.calendar')} selected={view === 'calendar'} onPress={() => setView('calendar')} />
        <Choice label={t('diary.view.events')} selected={view === 'events'} onPress={() => setView('events')} />
      </View>
    </View>
  );

  // month headings for the list view
  let lastMonth = '';
  return (
    <Screen header={header}>
      <Text className="mb-3 text-body text-inkMuted">{t('diary.screen.subtitle')}</Text>
      <Totals t={t} record={record} days={days} today={today} />
      {view === 'calendar' ? (
        <>
          <Calendar t={t} month={month} onMonth={setMonth} byDate={byDate} streak={streak} today={today} selected={selected} onSelect={setSelected} />
          <DayCard t={t} day={byDate.get(selected)} date={selected} today={today} inStreak={streak.has(selected)} />
          {!byDate.has(selected) && days.length > 0 && <Text className="mb-4 text-caption text-inkMuted">{t('diary.pickDay')}</Text>}
        </>
      ) : days.length === 0 ? (
        <Panel>
          <Text className="text-body text-inkMuted">{t('diary.empty')}</Text>
        </Panel>
      ) : (
        days.map((day) => {
          const key = day.date.slice(0, 7);
          const heading = key !== lastMonth;
          lastMonth = key;
          const m = monthOf(day.date);
          return (
            <View key={day.date}>
              {heading && (
                <Text className="mb-2 mt-2 font-display text-title text-inkMuted" accessibilityRole="header">
                  {capitalized(fill(t('diary.monthYear'), { month: monthName(t, m.month), year: m.year }))}
                </Text>
              )}
              <DayCard t={t} day={day} date={day.date} today={today} inStreak={streak.has(day.date)} />
            </View>
          );
        })
      )}
      {view === 'calendar' && days.length === 0 && (
        <Panel>
          <Text className="text-body text-inkMuted">{t('diary.empty')}</Text>
        </Panel>
      )}
    </Screen>
  );
}
