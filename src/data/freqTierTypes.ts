import { GreekWord } from '../types';

export interface FrequencyTierItem {
  id: string;
  greek: string;
  translationRu: string;
  frequencyLabel: string;
  tierId: string;
  count: number;
}

export interface FrequencyTierGroup {
  id: string;
  titleRu: string;
  countLabel: string;
  minFreq: number;
  maxFreq: number;
  items: FrequencyTierItem[];
}
