import { KeepColor } from '../types';

export const KEEP_COLORS: KeepColor[] = [
  {
    key: 'default',
    name: 'Default',
    lightBg: 'bg-white',
    darkBg: 'dark:bg-[#202124]',
    borderLight: 'border-gray-200',
    borderDark: 'dark:border-[#5f6368]',
  },
  {
    key: 'coral',
    name: 'Coral',
    lightBg: 'bg-[#faafa8]',
    darkBg: 'dark:bg-[#77172e]',
    borderLight: 'border-[#f28b82]',
    borderDark: 'dark:border-[#8c1d37]',
  },
  {
    key: 'peach',
    name: 'Peach',
    lightBg: 'bg-[#f39f76]',
    darkBg: 'dark:bg-[#692b17]',
    borderLight: 'border-[#f6ad55]',
    borderDark: 'dark:border-[#7b341e]',
  },
  {
    key: 'sand',
    name: 'Sand',
    lightBg: 'bg-[#fff8b8]',
    darkBg: 'dark:bg-[#7c4a03]',
    borderLight: 'border-[#fef08a]',
    borderDark: 'dark:border-[#925404]',
  },
  {
    key: 'mint',
    name: 'Mint',
    lightBg: 'bg-[#e2f6d3]',
    darkBg: 'dark:bg-[#264d3b]',
    borderLight: 'border-[#bbf7d0]',
    borderDark: 'dark:border-[#2f5e49]',
  },
  {
    key: 'sage',
    name: 'Sage',
    lightBg: 'bg-[#b4ddd3]',
    darkBg: 'dark:bg-[#0c625d]',
    borderLight: 'border-[#99f6e4]',
    borderDark: 'dark:border-[#0e746f]',
  },
  {
    key: 'fog',
    name: 'Fog',
    lightBg: 'bg-[#d4e4ed]',
    darkBg: 'dark:bg-[#256377]',
    borderLight: 'border-[#bae6fd]',
    borderDark: 'dark:border-[#2d768f]',
  },
  {
    key: 'storm',
    name: 'Storm',
    lightBg: 'bg-[#aeccdc]',
    darkBg: 'dark:bg-[#284255]',
    borderLight: 'border-[#93c5fd]',
    borderDark: 'dark:border-[#32526b]',
  },
  {
    key: 'dusk',
    name: 'Dusk',
    lightBg: 'bg-[#d3bfdb]',
    darkBg: 'dark:bg-[#472e5b]',
    borderLight: 'border-[#e9d5ff]',
    borderDark: 'dark:border-[#583971]',
  },
  {
    key: 'blossom',
    name: 'Blossom',
    lightBg: 'bg-[#f6e2dd]',
    darkBg: 'dark:bg-[#6c394f]',
    borderLight: 'border-[#fbcfe8]',
    borderDark: 'dark:border-[#834560]',
  },
  {
    key: 'clay',
    name: 'Clay',
    lightBg: 'bg-[#e9e3d4]',
    darkBg: 'dark:bg-[#4b443a]',
    borderLight: 'border-[#e2d9c8]',
    borderDark: 'dark:border-[#5c5448]',
  },
  {
    key: 'chalk',
    name: 'Chalk',
    lightBg: 'bg-[#efeff1]',
    darkBg: 'dark:bg-[#232427]',
    borderLight: 'border-[#e5e7eb]',
    borderDark: 'dark:border-[#3c4043]',
  },
];

export function getColorConfig(colorKey: string): KeepColor {
  return KEEP_COLORS.find((c) => c.key === colorKey) || KEEP_COLORS[0];
}
