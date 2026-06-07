export const defaultVideoTrimLabels = {
  actions: {
    trim: 'Trim',
    cancel: 'Cancel',
  },
  playback: {
    play: 'Play',
    pause: 'Pause',
  },
  video: {
    ariaLabel: 'Video preview',
  },
  toolbar: {
    ariaLabel: 'Video trim controls',
  },
  filmstrip: {
    loadingFrames: ({ loaded, total }: { loaded: number; total: number }) =>
      `Loading frames ${loaded}/${total}`,
  },
  errors: {
    decode:
      'Unable to decode this video. Its codec may not be supported in this browser.',
    sourceNotSupported: 'This video format is not supported in this browser.',
    load: 'Unable to load this video.',
  },
}

export type VideoTrimLabels = typeof defaultVideoTrimLabels

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K]
}

export type VideoTrimLabelsProp = DeepPartial<VideoTrimLabels>

export function resolveVideoTrimLabels(
  labels?: VideoTrimLabelsProp,
): VideoTrimLabels {
  return {
    actions: {
      ...defaultVideoTrimLabels.actions,
      ...labels?.actions,
    },
    playback: {
      ...defaultVideoTrimLabels.playback,
      ...labels?.playback,
    },
    video: {
      ...defaultVideoTrimLabels.video,
      ...labels?.video,
    },
    toolbar: {
      ...defaultVideoTrimLabels.toolbar,
      ...labels?.toolbar,
    },
    filmstrip: {
      ...defaultVideoTrimLabels.filmstrip,
      ...labels?.filmstrip,
    },
    errors: {
      ...defaultVideoTrimLabels.errors,
      ...labels?.errors,
    },
  }
}
