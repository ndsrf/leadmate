import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import { ReadDogView, type ReadDogResult } from './ReadDogView';

/** The Doorbell Mat: the shared "read the Dog, pick the action" Minigame with the bell, the mat and the Send to mat action. */
export function DoorbellMatView({ t, seed, coat, onCue, onFinish }: { t: Translate; seed: number; coat?: DogCoat; onCue?: () => void; onFinish: (result: ReadDogResult) => void }) {
  return <ReadDogView t={t} scene="doorbell" seed={seed} coat={coat} onCue={onCue} onFinish={onFinish} />;
}
