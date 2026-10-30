import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import { playDogSound } from '../audio';
import type { BreedId } from '../onboarding/breeds';
import { Button } from '../Overlays';
import { INTRO_BARKDOKU_BOARD } from '../puzzle/boards';
import {
  computeMetrics,
  createPuzzle,
  elapsedMs,
  formatClock,
  pausePuzzle,
  type PuzzleEvent,
  puzzleSummary,
  resetPuzzle,
  resumePuzzle,
  targetSecondsFor,
  toggleCell,
} from '../puzzle/engine';
import {
  type BarkdokuBoard,
  type BarkdokuMetrics,
  type BarkdokuState,
  type CellCoord,
  type ConflictMarker,
  PAPER_MEADOW_PALETTE,
  type PuzzleSummary,
} from '../puzzle/types';
import {
  getDogCoords,
  isDogConflicted,
  isRegionSatisfied,
} from '../puzzle/validator';
import { BreedArt } from '../ui/BreedArt';
import { Badge, StarRow } from '../ui/components';
import { feedback } from '../ui/feedback';
import { useAppActive } from '../ui/useAppActive';
import { useTicker } from '../ui/useTicker';
import { theme, usePalette } from '../ui/theme';
import { Screen } from './Screen';

/** Dog head silhouette for region tracker when not yet satisfied. */
export function DogHeadSilhouette({
  color: fillColor,
  size = 24,
}: {
  color: string;
  size?: number;
}) {
  const color = usePalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" aria-hidden={true}>
      <Path d="M7 11 L10 4 L14 10 Z" fill={fillColor} />
      <Path d="M25 11 L22 4 L18 10 Z" fill={fillColor} />
      <Circle cx={16} cy={16} r={10} fill={fillColor} />
      <Ellipse cx={16} cy={20} rx={6} ry={4} fill={fillColor} />
      <Circle cx={16} cy={18} r={1.5} fill={color.surface} opacity={0.6} />
    </Svg>
  );
}

/** Upper tracker showing dog head silhouettes illuminating into BreedArt canine faces. */
export function ZoneTracker({
  board,
  dogs,
  conflicts,
  breed = 'mestizo',
  coat = 'golden',
  t,
}: {
  board: BarkdokuBoard;
  dogs: readonly CellCoord[];
  conflicts: readonly ConflictMarker[];
  breed?: BreedId;
  coat?: DogCoat;
  t?: Translate;
}) {
  return (
    <View className="mb-2 flex-row items-center justify-center gap-1.5" testID="zone-tracker">
      {Array.from({ length: board.size }).map((_, regId) => {
        const satisfied = isRegionSatisfied(board, dogs, regId);
        const regColor = PAPER_MEADOW_PALETTE[regId % PAPER_MEADOW_PALETTE.length];
        const statusLabel = t
          ? satisfied
            ? t('minigame.barkdoku.completed')
            : t('minigame.barkdoku.pending')
          : satisfied
            ? 'completada'
            : 'pendiente';
        const zoneLabel = t ? t('minigame.barkdoku.zone') : 'Zona';
        return (
          <View
            key={regId}
            testID={`zone-tracker-item-${regId}`}
            accessibilityLabel={`${zoneLabel} ${regId + 1}: ${statusLabel}`}
            className="items-center justify-center rounded-full"
            style={{
              backgroundColor: satisfied ? `${regColor}33` : `${regColor}18`,
              borderWidth: 2,
              borderColor: satisfied ? regColor : `${regColor}55`,
              width: 36,
              height: 36,
            }}
          >
            {satisfied ? (
              <BreedArt breed={breed} coat={coat} width={26} looking={false} />
            ) : (
              <DogHeadSilhouette color={regColor} size={22} />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Compact inline banner with 3 diagrammatic cards illustrating the core rules. */
export function RuleBanner({ t }: { t: Translate }) {
  const color = usePalette();
  return (
    <View
      className="mb-3 rounded-2xl border border-edge bg-surface p-2.5 shadow-sm"
      testID="rule-banner"
    >
      <View className="flex-row justify-between gap-2">
        {/* Card 1: Territory station */}
        <View className="flex-1 items-center rounded-xl bg-surfaceSunken p-2">
          <View className="mb-1 h-6 w-6 items-center justify-center rounded-md bg-brand/30">
            <Text className="text-xs font-bold text-brandText">{'1'}</Text>
          </View>
          <Text className="text-center text-xs font-bold text-ink">
            {t('minigame.barkdoku.ruleZoneTitle')}
          </Text>
          <Text className="text-center text-[10px] text-inkMuted">
            {t('minigame.barkdoku.ruleZoneSub')}
          </Text>
        </View>

        {/* Card 2: Line of sight */}
        <View className="flex-1 items-center rounded-xl bg-surfaceSunken p-2">
          <View
            className="mb-1 h-6 w-6 items-center justify-center rounded-md"
            style={{ backgroundColor: color.sky }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                stroke={color.ink}
                strokeWidth="2"
                fill="none"
              />
              <Circle cx={12} cy={12} r={3} fill={color.ink} />
              <Line x1="2" y1="2" x2="22" y2="22" stroke={color.danger} strokeWidth="2.5" />
            </Svg>
          </View>
          <Text className="text-center text-xs font-bold text-ink">
            {t('minigame.barkdoku.ruleSightTitle')}
          </Text>
          <Text className="text-center text-[10px] text-inkMuted">
            {t('minigame.barkdoku.ruleSightSub')}
          </Text>
        </View>

        {/* Card 3: 8-neighbor space bubble */}
        <View className="flex-1 items-center rounded-xl bg-surfaceSunken p-2">
          <View className="mb-1 h-6 w-6 items-center justify-center rounded-md bg-accentSoft">
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Circle cx={12} cy={12} r={4} fill={color.ink} />
              <Circle
                cx={12}
                cy={12}
                r={9}
                stroke={color.flame}
                strokeWidth="2"
                strokeDasharray="3,2"
                fill="none"
              />
            </Svg>
          </View>
          <Text className="text-center text-xs font-bold text-ink">
            {t('minigame.barkdoku.ruleBubbleTitle')}
          </Text>
          <Text className="text-center text-[10px] text-inkMuted">
            {t('minigame.barkdoku.ruleBubbleSub')}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Visual Shield bold white 'X' icon. */
function VisualShield({ size }: { size: number }) {
  const color = usePalette();
  const iconSize = Math.max(16, size * 0.55);
  return (
    <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" testID="visual-shield-icon">
      <Line
        x1="4"
        y1="4"
        x2="20"
        y2="20"
        stroke={color.surface}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <Line
        x1="20"
        y1="4"
        x2="4"
        y2="20"
        stroke={color.surface}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Placed dog inside a cell with calm vs alert conflict indicator. */
function CellDogAvatar({
  conflicted,
  breed = 'mestizo',
  coat = 'golden',
  size,
  barkText,
}: {
  conflicted: boolean;
  breed?: BreedId;
  coat?: DogCoat;
  size: number;
  barkText: string;
}) {
  const avatarWidth = Math.max(24, Math.floor(size * 0.75));

  return (
    <View className="items-center justify-center" testID="cell-dog-avatar">
      <BreedArt breed={breed} coat={coat} width={avatarWidth} looking={conflicted} />
      {conflicted && (
        <View
          testID="conflict-bark-indicator"
          className="absolute -top-1 -right-1 rounded-full bg-danger px-1"
        >
          <Text className="text-[10px] font-bold text-onDanger">{barkText}</Text>
        </View>
      )}
    </View>
  );
}

/** Localized explanation of why a conflict agitates the dogs. */
function conflictMessage(t: Translate, conflict: ConflictMarker): string {
  const n = String((conflict.index ?? 0) + 1);
  if (conflict.type === 'line-of-sight') {
    const key = conflict.axis === 'col' ? 'minigame.barkdoku.conflictCol' : 'minigame.barkdoku.conflictRow';
    return t(key).split('{n}').join(n);
  }
  if (conflict.type === 'region') return t('minigame.barkdoku.conflictRegion');
  return t('minigame.barkdoku.conflictSpace');
}

/** Handling points a mistake costs: none earns 3 stars, one 2 and more 1, as the puzzle's own rating does. */
const MISTAKE_COST = 200;
/** Missing the Target Time caps the score below 3 stars, as the puzzle's own rating does (ADR 0014). */
const OVER_TARGET_CAP = 800;

/** A Barkdoku run as a Node result: the Debrief metrics and the handling score (0-1000) the stars come from. */
export function barkdokuResult(metrics: BarkdokuMetrics): { metrics: { timing: number; attention: number; tension: number }; handlingScore: number } {
  return {
    metrics: {
      timing: metrics.solved ? 1 : 0,
      attention: Math.max(0, 1 - metrics.mistakes * 0.33),
      tension: metrics.treatsLeft / 3,
    },
    handlingScore: metrics.solved ? Math.min(metrics.withinTarget ? 1000 : OVER_TARGET_CAP, Math.max(0, 1000 - metrics.mistakes * MISTAKE_COST)) : 0,
  };
}

/** What the clock shows at `now`: the Solve Time, the Target Time line and whether it was missed. */
export function clockFace(t: Translate, state: BarkdokuState, now: number): { time: string; target?: string; over: boolean; label: string } {
  const seconds = Math.floor(elapsedMs(state, now) / 1000);
  const time = formatClock(seconds);
  const target = targetSecondsFor(state.board);
  if (target === undefined) return { time, over: false, label: t('minigame.barkdoku.clockLabel').replace('{time}', time) };
  const targetTime = formatClock(target);
  return {
    time,
    target: t('minigame.barkdoku.target').replace('{time}', targetTime),
    over: seconds > target,
    label: t('minigame.barkdoku.clockLabelTarget').replace('{time}', time).replace('{target}', targetTime),
  };
}

/** The Solve Time clock; it re-renders only when the shown second changes, and only while running and in the foreground. */
function PuzzleClock({ t, state }: { t: Translate; state: BarkdokuState }) {
  const [, setSecond] = useState(0);
  useTicker(state.runningSince !== null, 250, () => setSecond(Math.floor(elapsedMs(state, Date.now()) / 1000)));
  const face = clockFace(t, state, Date.now());
  return (
    <View className="items-end" testID="puzzle-clock" accessibilityLabel={face.label}>
      <Text className={`font-display text-body font-bold ${face.over ? 'text-dangerText' : 'text-ink'}`} style={{ fontVariant: ['tabular-nums'] }}>
        {face.time}
      </Text>
      {face.target && <Text className="text-[10px] text-inkMuted">{face.target}</Text>}
    </View>
  );
}

/** The solved card: the Solve Time, and outside practice the Stars and the Target Time verdict. */
export function SolvedCard({ t, metrics, practice = false, onContinue }: { t: Translate; metrics: BarkdokuMetrics; practice?: boolean; onContinue: () => void }) {
  const time = formatClock(metrics.durationSeconds);
  const timeLine =
    metrics.targetSeconds === undefined
      ? t('minigame.barkdoku.yourTime').replace('{time}', time)
      : t('minigame.barkdoku.yourTimeTarget').replace('{time}', time).replace('{target}', formatClock(metrics.targetSeconds));
  return (
    <View testID="victory-card" className="mt-3 rounded-2xl border border-brand/50 bg-brand/10 p-4 items-center">
      <Text className="text-h3 font-bold text-brandText mb-1">{t('minigame.barkdoku.solvedTitle')}</Text>
      <Text className="text-center text-xs text-inkMuted mb-2">{t('minigame.barkdoku.solvedBody')}</Text>
      <Text testID="solve-time" className="text-center font-bold text-body text-ink">{timeLine}</Text>
      {practice ? (
        <Text testID="practice-kept" className="mt-1 text-center text-xs text-inkMuted">{t('minigame.barkdoku.practiceKept')}</Text>
      ) : (
        <>
          {metrics.targetSeconds !== undefined && (
            <Text testID={metrics.withinTarget ? 'target-met' : 'target-missed'} className={`mt-1 text-center text-xs ${metrics.withinTarget ? 'font-bold text-brandText' : 'text-inkMuted'}`}>
              {t(metrics.withinTarget ? 'minigame.barkdoku.targetMet' : 'minigame.barkdoku.targetMissed')}
            </Text>
          )}
          <View className="mt-2">
            <StarRow stars={metrics.stars} label={`${metrics.stars} ${t('map.starsOf3')}`} />
          </View>
        </>
      )}
      <View className="mt-3">
        <Button label={t('results.continue')} onPress={onContinue} />
      </View>
    </View>
  );
}

export interface BarkdokuViewProps {
  t: Translate;
  board?: BarkdokuBoard;
  breed?: BreedId;
  coat?: DogCoat;
  /** A replay of a Daily Barkdoku already solved today: marked, unrated, and saved by no one. */
  practice?: boolean;
  onFinish?: (metrics: BarkdokuMetrics, summary: PuzzleSummary) => void;
  onExit?: () => void;
}

/**
 * Barkdoku Interactive View.
 * Flat pastel Paper Meadow grid with 3-state cell toggle, treat lives HUD, Solve Time clock,
 * upper zone tracker, and canine posture conflict feedback.
 */
export function BarkdokuView({
  t,
  board = INTRO_BARKDOKU_BOARD,
  breed = 'mestizo',
  coat = 'golden',
  practice = false,
  onFinish,
  onExit,
}: BarkdokuViewProps) {
  const color = usePalette();
  // The last tap's event rides along with the state so rapid taps chain through the updater.
  const [game, setGame] = useState(() => ({
    state: createPuzzle(board),
    event: null as PuzzleEvent | null,
    tap: 0,
  }));
  const { state } = game;
  const { width } = useWindowDimensions();

  // Compute cell size dynamically based on board size
  const maxBoardWidth = Math.min(width - 32, theme.size.readableWidth - 32);
  const cellSize = Math.min(68, Math.floor((maxBoardWidth - (board.size - 1) * 4) / board.size));
  const boardPixelSize = cellSize * board.size + (board.size - 1) * 4;

  const dogs = useMemo(() => getDogCoords(state.grid), [state.grid]);

  // The clock counts foreground time only.
  const active = useAppActive();
  useEffect(() => {
    setGame((prev) => {
      const next = active ? resumePuzzle(prev.state, Date.now()) : pausePuzzle(prev.state, Date.now());
      return next === prev.state ? prev : { ...prev, state: next };
    });
  }, [active]);

  useEffect(() => {
    const { event } = game;
    if (event === 'shield_placed' || event === 'cell_cleared' || event === 'dog_placed') {
      feedback.press();
    } else if (event === 'dog_conflict' || event === 'failed') {
      try {
        playDogSound('bark');
      } catch {}
      feedback.star(1);
    } else if (event === 'solved') {
      feedback.success();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.tap]);

  const handleCellTap = (row: number, col: number) => {
    setGame((prev) => {
      const step = toggleCell(prev.state, { row, col });
      return { state: step.state, event: step.event, tap: prev.tap + 1 };
    });
  };

  const handleReset = () => {
    feedback.press();
    setGame((prev) => ({ state: resetPuzzle(prev.state), event: null, tap: prev.tap }));
  };

  const handleComplete = () => {
    const metrics = computeMetrics(state);
    if (onFinish) {
      onFinish(metrics, puzzleSummary(board, metrics));
    }
  };

  // Find rows or columns with line-of-sight conflict to render sightline indicators
  const rowConflicts = new Set<number>();
  const colConflicts = new Set<number>();
  for (const c of state.conflicts) {
    if (c.type === 'line-of-sight' && c.index !== undefined) {
      (c.axis === 'col' ? colConflicts : rowConflicts).add(c.index);
    }
  }

  return (
    <Screen>
      {/* Header: Treats Lives & Level Info */}
      <View className="mb-2 flex-row items-center justify-between">
        <View className="shrink">
          <View className="flex-row items-center" style={{ gap: theme.space[2] }}>
            <Text className="text-body font-bold text-ink">
              {board.name ?? t('minigame.barkdoku.title')}
            </Text>
            {practice && <Badge label={t('minigame.barkdoku.practice')} tone="info" />}
          </View>
          <Text className="text-xs text-inkMuted">
            {`${board.size}x${board.size} • ${dogs.length}/${board.size} `}
            {t('minigame.barkdoku.dogs')}
          </Text>
        </View>

        <View className="items-end" style={{ gap: theme.space[1] }}>
          {/* Treat Lives HUD */}
          <View className="flex-row items-center gap-1.5" testID="treat-lives-hud">
            {[0, 1, 2].map((i) => {
              const active = i < state.treats;
              const treatStatus = active
                ? t('minigame.barkdoku.active')
                : t('minigame.barkdoku.lost');
              return (
                <View
                  key={i}
                  accessibilityLabel={`${t('minigame.barkdoku.treat')} ${i + 1} ${treatStatus}`}
                  testID={`treat-pip-${i}-${active ? 'active' : 'inactive'}`}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24">
                    <Path
                      d="M17 5a3 3 0 0 1 2.8 4 3 3 0 0 1-1.2 5.8A3 3 0 0 1 17 19H7a3 3 0 0 1-1.6-4.2A3 3 0 0 1 4.2 9 3 3 0 0 1 7 5h10z"
                      fill={active ? color.accent : color.edge}
                    />
                  </Svg>
                </View>
              );
            })}
          </View>
          <PuzzleClock t={t} state={state} />
        </View>
      </View>

      {/* Upper Zone Fulfillment Tracker */}
      <ZoneTracker
        board={board}
        dogs={dogs}
        conflicts={state.conflicts}
        breed={breed}
        coat={coat}
        t={t}
      />

      {/* Rules Mini-Banner */}
      <RuleBanner t={t} />

      {/* Main Grid Viewport */}
      <View className="items-center justify-center my-2">
        <View
          testID="barkdoku-grid"
          style={{
            width: boardPixelSize,
            height: boardPixelSize,
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {Array.from({ length: board.size }).map((_, r) => {
            const hasRowSightline = rowConflicts.has(r);
            return (
              <View
                key={`row-${r}`}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  height: cellSize,
                  position: 'relative',
                }}
              >
                {/* Visual red sightline ray for row conflict */}
                {hasRowSightline && (
                  <View
                    testID={`sightline-row-${r}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: cellSize / 2 - 1.5,
                      height: 3,
                      backgroundColor: color.danger,
                      opacity: 0.8,
                      zIndex: 10,
                    }}
                  />
                )}

                {Array.from({ length: board.size }).map((_, c) => {
                  const cellState = state.grid[r][c];
                  const regId = board.regions[r][c];
                  const tileBg =
                    PAPER_MEADOW_PALETTE[regId % PAPER_MEADOW_PALETTE.length];
                  const isConflicted =
                    cellState === 'dog' &&
                    isDogConflicted({ row: r, col: c }, state.conflicts);
                  const hasColSightline = colConflicts.has(c);

                  return (
                    <Pressable
                      key={`cell-${r}-${c}`}
                      testID={`cell-${r}-${c}`}
                      accessibilityLabel={`${t('minigame.barkdoku.cell')} ${t('minigame.barkdoku.row')} ${r + 1} ${t('minigame.barkdoku.col')} ${c + 1}, ${t('minigame.barkdoku.zone')} ${regId + 1}, ${t('minigame.barkdoku.state')} ${cellState}`}
                      onPress={() => handleCellTap(r, c)}
                      disabled={state.status !== 'playing'}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 8,
                        backgroundColor: tileBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: isConflicted ? 2.5 : 1,
                        borderColor: isConflicted ? color.danger : 'rgba(255,255,255,0.4)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {/* Visual red sightline ray for column conflict */}
                      {hasColSightline && (
                        <View
                          testID={`sightline-col-${c}`}
                          pointerEvents="none"
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: cellSize / 2 - 1.5,
                            width: 3,
                            backgroundColor: color.danger,
                            opacity: 0.8,
                            zIndex: 10,
                          }}
                        />
                      )}

                      {cellState === 'shield' && <VisualShield size={cellSize} />}
                      {cellState === 'dog' && (
                        <CellDogAvatar
                          conflicted={isConflicted}
                          breed={breed}
                          coat={coat}
                          size={cellSize}
                          barkText={t('minigame.barkdoku.bark')}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>

      {/* Conflict Explanation Bar if active */}
      {state.conflicts.length > 0 && state.status === 'playing' && (
        <View
          testID="conflict-warning-bar"
          className="my-2 rounded-xl bg-danger/20 border border-danger/40 p-2.5"
        >
          <Text className="text-center font-bold text-xs text-dangerText">
            {conflictMessage(t, state.conflicts[0])}
          </Text>
        </View>
      )}

      {/* Win State Overlay Card */}
      {state.status === 'solved' && (
        <SolvedCard t={t} metrics={computeMetrics(state)} practice={practice} onContinue={handleComplete} />
      )}

      {/* Failure State Overlay Card */}
      {state.status === 'failed' && (
        <View
          testID="failed-card"
          className="mt-3 rounded-2xl border border-danger/50 bg-danger/10 p-4 items-center"
        >
          <Text className="text-h3 font-bold text-dangerText mb-1">
            {t('minigame.barkdoku.failedTitle')}
          </Text>
          <Text className="text-center text-xs text-inkMuted mb-3">
            {t('minigame.barkdoku.failedBody')}
          </Text>
          <Button
            label={t('minigame.barkdoku.retry')}
            onPress={handleReset}
          />
          {onFinish && (
            <Button
              label={t('minigame.barkdoku.exit')}
              tone="quiet"
              onPress={handleComplete}
            />
          )}
        </View>
      )}

      {/* Bottom Exit or Reset Controls during play */}
      {state.status === 'playing' && (
        <View className="mt-4 flex-row items-center justify-between">
          <Button
            label={t('minigame.barkdoku.restart')}
            tone="quiet"
            onPress={handleReset}
          />
          {onExit && (
            <Button
              label={t('node.back')}
              tone="quiet"
              onPress={onExit}
            />
          )}
        </View>
      )}
    </Screen>
  );
}
